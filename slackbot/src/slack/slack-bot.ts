import { App, LogLevel } from '@slack/bolt';
import { AgentManager } from '../agents/agent-manager';
import { RAGEngine } from '../rag/rag-engine.service';
import { prisma } from '../database/prisma.service';
import { logger } from '../utils/logger';
import { config } from '../config';

export class SlackBot {
  private app: App;
  private agentManager: AgentManager;
  private ragEngine: RAGEngine;
  private started: boolean = false;

  constructor(agentManager: AgentManager, ragEngine: RAGEngine) {
    this.agentManager = agentManager;
    this.ragEngine = ragEngine;

    this.app = new App({
      token:         process.env.SLACK_BOT_TOKEN!,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      socketMode:    true,
      appToken:      process.env.SLACK_APP_TOKEN!,
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    });

    this.setupListeners();
  }

  private setupListeners(): void {

    // ── @mention in a department channel ─────────────────────────────────────
    this.app.event('app_mention', async ({ event, client, say }) => {
      try {
        const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
        if (!text) {
          await say('How can I help? You can ask about complaints, check status, or request document fulfillment.');
          return;
        }

        logger.info('App mention received', { user: event.user, text: text.substring(0, 100) });

        await client.reactions.add({ channel: event.channel, timestamp: event.ts, name: 'hourglass_flowing_sand' });

        const officer = await this.getOrCreateOfficer(event.user!, client);

        // Store in memory
        await this.ragEngine.storeSlackMessage({
          userId:    event.user!,
          channelId: event.channel,
          message:   text,
          threadTs:  event.thread_ts,
        });

        // Route to Supervisor for general queries; department agents are notified via agent messages
        const response = await this.agentManager.routeMessage(
          'SupervisorAgent',
          text,
          { slackUserId: event.user, officerId: officer?.id, channelId: event.channel, threadTs: event.thread_ts }
        );

        await client.reactions.remove({ channel: event.channel, timestamp: event.ts, name: 'hourglass_flowing_sand' });
        await client.reactions.add({ channel: event.channel, timestamp: event.ts, name: 'white_check_mark' });

        await say({ text: response, thread_ts: event.thread_ts });

      } catch (error) {
        logger.error('Error handling app mention:', error);
        await say('Sorry, I encountered an error. Please try again.');
      }
    });

    // ── Direct messages from government officers ──────────────────────────────
    this.app.event('message', async ({ event, client, say }) => {
      if ('bot_id' in event || event.subtype || (event as any).thread_ts) return;

      try {
        const msgEvent = event as any;
        logger.info('DM received', { user: msgEvent.user });

        const officer = await this.getOrCreateOfficer(msgEvent.user, client);

        await this.ragEngine.storeSlackMessage({
          userId:    msgEvent.user,
          channelId: msgEvent.channel,
          message:   msgEvent.text || '',
        });

        const response = await this.agentManager.routeMessage(
          'SupervisorAgent',
          msgEvent.text || '',
          { slackUserId: msgEvent.user, officerId: officer?.id, channelId: msgEvent.channel }
        );

        await say(response);

      } catch (error) {
        logger.error('Error handling DM:', error);
        await say('Sorry, I encountered an error. Please try again.');
      }
    });

    // ── /complaint — officer manual complaint filing ──────────────────────────
    this.app.command('/complaint', async ({ command, ack, say }) => {
      await ack();
      try {
        if (!command.text.trim()) {
          await say('Usage: `/complaint <description>`\nExample: `/complaint Pothole on MG Road near Gate 3, very deep`');
          return;
        }

        const response = await this.agentManager.routeMessage(
          'SupervisorAgent',
          `New complaint filed by officer via Slack: ${command.text}`,
          { slackUserId: command.user_id, channelId: command.channel_id }
        );

        await say(response);
      } catch (error) {
        logger.error('Error in /complaint command:', error);
        await say('Error processing complaint. Please try again.');
      }
    });

    // ── /status — check complaint status ─────────────────────────────────────
    this.app.command('/status', async ({ command, ack, say }) => {
      await ack();
      try {
        const complaintId = command.text.trim();
        if (!complaintId) {
          await say('Usage: `/status <complaintId>`');
          return;
        }

        const complaint = await prisma.complaint.findUnique({
          where: { id: complaintId },
          include: {
            updates:     { orderBy: { createdAt: 'desc' }, take: 3 },
            docRequests: { where: { status: 'pending' } },
          },
        });

        if (!complaint) {
          await say(`❌ Complaint \`${complaintId}\` not found.`);
          return;
        }

        const pendingDocs = complaint.docRequests;
        const lastUpdate  = complaint.updates[0];

        const statusMsg = [
          `📋 *Complaint Status: \`${complaint.id}\`*`,
          `*Category:* ${complaint.category}`,
          `*Citizen:* ${complaint.citizenName}`,
          `*Location:* ${complaint.location}`,
          `*Status:* ${complaint.status.toUpperCase()}`,
          `*Priority:* ${complaint.priority}`,
          `*Assigned Dept:* ${complaint.assignedDept || 'Not yet assigned'}`,
          lastUpdate ? `*Last Update:* ${lastUpdate.note} _(${lastUpdate.updatedBy})_` : '',
          pendingDocs.length > 0 ? `\n⏳ *Pending Document Requests (${pendingDocs.length}):*\n${pendingDocs.map(d => `• ${d.fromDept} → ${d.toDept}: ${d.documentNeeded}`).join('\n')}` : '',
          `*Submitted:* ${complaint.createdAt.toDateString()}`,
        ].filter(Boolean).join('\n');

        await say(statusMsg);

      } catch (error) {
        logger.error('Error in /status command:', error);
        await say('Error fetching complaint status. Please try again.');
      }
    });

    // ── /fulfill-doc — officer marks a document request as fulfilled ──────────
    this.app.command('/fulfill-doc', async ({ command, ack, say }) => {
      await ack();
      try {
        const parts = command.text.trim().split(' ');
        const requestId = parts[0];
        const note = parts.slice(1).join(' ') || 'Document/permission provided by department';

        if (!requestId) {
          await say('Usage: `/fulfill-doc <requestId> [fulfillment note]`\nFind the request ID in the document request message.');
          return;
        }

        const docRequest = await prisma.deptDocumentRequest.findUnique({ where: { id: requestId } });
        if (!docRequest) {
          await say(`❌ Document request \`${requestId}\` not found.`);
          return;
        }
        if (docRequest.status !== 'pending') {
          await say(`ℹ️ Document request \`${requestId}\` is already *${docRequest.status}*.`);
          return;
        }

        // Call the fulfillDocumentRequest tool via agent
        const response = await this.agentManager.routeMessage(
          'SupervisorAgent',
          `Officer ${command.user_name} is marking document request ${requestId} as fulfilled. Note: "${note}". Please use the fulfillDocumentRequest tool to process this.`,
          { requestId, fulfillmentNote: note, fulfilledBy: command.user_name, slackUserId: command.user_id }
        );

        await say(response);

      } catch (error) {
        logger.error('Error in /fulfill-doc command:', error);
        await say('Error processing fulfillment. Please try again.');
      }
    });

    // ── /list-complaints — list pending complaints for a dept ─────────────────
    this.app.command('/list-complaints', async ({ command, ack, say }) => {
      await ack();
      try {
        const dept = command.text.trim() || undefined;
        const complaints = await prisma.complaint.findMany({
          where: {
            status: { in: ['received', 'triaged', 'in_progress', 'blocked_on_docs'] },
            ...(dept ? { assignedDept: dept } : {}),
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          take: 10,
        });

        if (complaints.length === 0) {
          await say(dept ? `✅ No active complaints for ${dept} Department.` : '✅ No active complaints in the system.');
          return;
        }

        const list = complaints.map(c =>
          `• \`${c.id.substring(0, 8)}\` [${c.priority.toUpperCase()}] ${c.category} — ${c.location} _(${c.status})_`
        ).join('\n');

        await say(
          `📋 *Active Complaints${dept ? ` — ${dept} Dept` : ''}:*\n${list}\n\nUse \`/status <full-id>\` for details.`
        );

      } catch (error) {
        logger.error('Error in /list-complaints command:', error);
        await say('Error fetching complaints. Please try again.');
      }
    });
  }

  /**
   * Get or create a government officer record from Slack user
   */
  private async getOrCreateOfficer(slackUserId: string, client: any): Promise<any> {
    try {
      let officer = await prisma.govOfficer.findUnique({ where: { slackUserId } });

      if (!officer) {
        const userInfo = await client.users.info({ user: slackUserId });
        officer = await prisma.govOfficer.create({
          data: {
            slackUserId,
            name:       userInfo.user.real_name || userInfo.user.name,
            email:      userInfo.user.profile?.email || `${slackUserId}@gov.local`,
            department: 'Supervisor', // default, can be changed by admin
          },
        });
        logger.info('Created new officer record', { officerId: officer.id, slackUserId });
      }

      return officer;
    } catch (err) {
      logger.warn('Could not get/create officer record', { slackUserId, err });
      return null;
    }
  }

  async start(): Promise<void> {
    if (this.started) return;
    try {
      await this.app.start();
      this.started = true;
      logger.info('⚡️ Government Complaint Slackbot is running');
    } catch (error) {
      logger.error('Failed to start Slack bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.app.stop();
      this.started = false;
      logger.info('Slack bot stopped');
    } catch (error) {
      logger.error('Error stopping Slack bot:', error);
    }
  }

  getApp(): App {
    return this.app;
  }
}
