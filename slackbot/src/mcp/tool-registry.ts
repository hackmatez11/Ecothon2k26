import { MCPTool } from '../types';
import { RAGEngine } from '../rag/rag-engine.service';
import { prisma } from '../database/prisma.service';
import { AuditService } from '../database/audit.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import { App as SlackApp } from '@slack/bolt';

export class ToolRegistry {

  // ─── Memory / RAG ──────────────────────────────────────────────────────────

  static createRetrieveMemoryTool(ragEngine: RAGEngine): MCPTool {
    return {
      name: 'retrieveMemory',
      description: 'Retrieve relevant memories from the RAG system based on a query',
      parameters: {
        type: 'object',
        properties: {
          query:  { type: 'string', description: 'The search query' },
          limit:  { type: 'number', description: 'Max memories to retrieve (default 5)' },
          source: { type: 'string', description: 'Filter by source (slack, complaint, agent_message, doc_request)' },
        },
        required: ['query'],
      },
      handler: async (params) => {
        const memories = await ragEngine.retrieveMemories({
          query: params.query,
          limit: params.limit || 5,
          source: params.source,
          minSimilarity: 0.7,
        });
        return { memories, count: memories.length };
      },
    };
  }

  static createStoreMemoryTool(ragEngine: RAGEngine): MCPTool {
    return {
      name: 'storeMemory',
      description: 'Store a new memory in the RAG system',
      parameters: {
        type: 'object',
        properties: {
          content:  { type: 'string',  description: 'Content to store' },
          source:   { type: 'string',  description: 'Source type (slack, complaint, agent_message, doc_request)' },
          sourceId: { type: 'string',  description: 'Optional source identifier' },
          metadata: { type: 'object',  description: 'Additional metadata' },
        },
        required: ['content', 'source'],
      },
      handler: async (params) => {
        const memoryId = await ragEngine.storeMemory(params);
        return { success: true, memoryId };
      },
    };
  }

  // ─── Complaint Management ───────────────────────────────────────────────────

  static createSubmitComplaintTool(): MCPTool {
    return {
      name: 'submitComplaint',
      description: 'Register a new citizen complaint in the system (called after portal intake)',
      parameters: {
        type: 'object',
        properties: {
          citizenName:   { type: 'string', description: 'Citizen full name' },
          citizenPhone:  { type: 'string', description: 'Citizen phone number' },
          citizenEmail:  { type: 'string', description: 'Citizen email (optional)' },
          category:      { type: 'string', description: 'Complaint category (e.g. factory_smoke, pothole, sewage_overflow)' },
          description:   { type: 'string', description: 'Full description of the complaint' },
          location:      { type: 'string', description: 'Location of the issue' },
          attachmentUrl: { type: 'string', description: 'URL to attached image/document (optional)' },
          priority:      { type: 'string', description: 'Priority: low, medium, high, urgent (default: medium)' },
          notifyCallback:{ type: 'string', description: 'Webhook URL to notify citizen portal on status change (optional)' },
        },
        required: ['citizenName', 'category', 'description', 'location'],
      },
      handler: async (params) => {
        const complaint = await prisma.complaint.create({
          data: {
            citizenName:    params.citizenName,
            citizenPhone:   params.citizenPhone,
            citizenEmail:   params.citizenEmail,
            category:       params.category,
            description:    params.description,
            location:       params.location,
            attachmentUrl:  params.attachmentUrl,
            priority:       params.priority || 'medium',
            status:         'received',
            notifyCallback: params.notifyCallback,
          },
        });

        // Initial status update entry
        await prisma.complaintUpdate.create({
          data: {
            complaintId: complaint.id,
            updatedBy:   'System',
            status:      'received',
            note:        'Complaint received from citizen portal',
          },
        });

        await AuditService.logAudit({
          agentName:  'System',
          action:     'complaint_received',
          resource:   'complaint',
          resourceId: complaint.id,
          details:    { category: params.category, citizenName: params.citizenName, location: params.location },
        });

        logger.info('Complaint registered', { complaintId: complaint.id, category: complaint.category });
        return { success: true, complaintId: complaint.id, complaint };
      },
    };
  }

  static createGetComplaintByIdTool(): MCPTool {
    return {
      name: 'getComplaintById',
      description: 'Fetch a complaint by its ID including updates and document requests',
      parameters: {
        type: 'object',
        properties: {
          complaintId: { type: 'string', description: 'The complaint ID' },
        },
        required: ['complaintId'],
      },
      handler: async (params) => {
        const complaint = await prisma.complaint.findUnique({
          where: { id: params.complaintId },
          include: {
            updates:     { orderBy: { createdAt: 'asc' } },
            docRequests: { orderBy: { createdAt: 'asc' } },
            officer:     true,
          },
        });
        if (!complaint) return { success: false, error: 'Complaint not found' };

        const pendingDocs = complaint.docRequests.filter(d => d.status === 'pending');
        return {
          success: true,
          complaint,
          pendingDocRequests: pendingDocs,
          allDocsFulfilled: pendingDocs.length === 0,
        };
      },
    };
  }

  static createUpdateComplaintStatusTool(): MCPTool {
    return {
      name: 'updateComplaintStatus',
      description: 'Update the status of a complaint and add a status trail entry',
      parameters: {
        type: 'object',
        properties: {
          complaintId:      { type: 'string', description: 'Complaint ID' },
          status:           { type: 'string', description: 'New status: received, triaged, in_progress, blocked_on_docs, resolved, closed' },
          note:             { type: 'string', description: 'Update note or action taken' },
          updatedBy:        { type: 'string', description: 'Agent or officer name making this update' },
          assignedDept:     { type: 'string', description: 'Department being assigned (optional)' },
          resolutionNote:   { type: 'string', description: 'Resolution summary (when resolving)' },
        },
        required: ['complaintId', 'status', 'updatedBy'],
      },
      handler: async (params) => {
        const updateData: any = { status: params.status, updatedAt: new Date() };
        if (params.assignedDept) updateData.assignedDept = params.assignedDept;
        if (params.resolutionNote) updateData.resolutionNote = params.resolutionNote;
        if (params.status === 'resolved') updateData.resolvedAt = new Date();

        const complaint = await prisma.complaint.update({
          where: { id: params.complaintId },
          data: updateData,
        });

        await prisma.complaintUpdate.create({
          data: {
            complaintId: params.complaintId,
            updatedBy:   params.updatedBy,
            status:      params.status,
            note:        params.note,
          },
        });

        // Notify citizen portal via callback if URL is set
        if (complaint.notifyCallback) {
          try {
            await fetch(complaint.notifyCallback, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ complaintId: complaint.id, status: complaint.status, note: params.note }),
            });
          } catch (e) {
            logger.warn('Failed to notify citizen portal callback', { complaintId: complaint.id });
          }
        }

        await AuditService.logAudit({
          agentName:  params.updatedBy,
          action:     'complaint_status_updated',
          resource:   'complaint',
          resourceId: params.complaintId,
          details:    { newStatus: params.status, note: params.note },
        });

        logger.info('Complaint status updated', { complaintId: params.complaintId, status: params.status });
        return { success: true, complaint };
      },
    };
  }

  static createEscalateComplaintTool(): MCPTool {
    return {
      name: 'escalateComplaint',
      description: 'Escalate a complaint to the Supervisor agent and elevate its priority',
      parameters: {
        type: 'object',
        properties: {
          complaintId: { type: 'string', description: 'Complaint ID' },
          reason:      { type: 'string', description: 'Reason for escalation' },
          escalatedBy: { type: 'string', description: 'Agent or officer escalating' },
        },
        required: ['complaintId', 'reason', 'escalatedBy'],
      },
      handler: async (params) => {
        const complaint = await prisma.complaint.update({
          where: { id: params.complaintId },
          data: { priority: 'urgent' },
        });

        await prisma.complaintUpdate.create({
          data: {
            complaintId: params.complaintId,
            updatedBy:   params.escalatedBy,
            status:      complaint.status,
            note:        `ESCALATED: ${params.reason}`,
          },
        });

        // Queue message to SupervisorAgent
        await prisma.agentMessage.create({
          data: {
            fromAgent: params.escalatedBy,
            toAgent:   'SupervisorAgent',
            intent:    'handle_escalation',
            payload:   { complaintId: params.complaintId, reason: params.reason },
            status:    'pending',
          },
        });

        await AuditService.logAudit({
          agentName:  params.escalatedBy,
          action:     'complaint_escalated',
          resource:   'complaint',
          resourceId: params.complaintId,
          details:    { reason: params.reason },
        });

        return { success: true, complaintId: params.complaintId, escalated: true };
      },
    };
  }

  static createRouteComplaintToDeptTool(): MCPTool {
    return {
      name: 'routeComplaintToDept',
      description: 'Assign a complaint to a specific department and queue a message to that department\'s agent',
      parameters: {
        type: 'object',
        properties: {
          complaintId: { type: 'string', description: 'Complaint ID' },
          department:  { type: 'string', description: 'Department: Environment, WaterSupply, Roads, HealthSanitation' },
          note:        { type: 'string', description: 'Routing rationale or instructions for the dept agent' },
        },
        required: ['complaintId', 'department'],
      },
      handler: async (params) => {
        const agentNameMap: Record<string, string> = {
          Environment:      'EnvironmentAgent',
          WaterSupply:      'WaterSupplyAgent',
          Roads:            'RoadsInfraAgent',
          HealthSanitation: 'HealthSanitationAgent',
        };

        const targetAgent = agentNameMap[params.department];
        if (!targetAgent) return { success: false, error: `Unknown department: ${params.department}` };

        await prisma.complaint.update({
          where: { id: params.complaintId },
          data: { assignedDept: params.department, status: 'triaged' },
        });

        await prisma.agentMessage.create({
          data: {
            fromAgent: 'SupervisorAgent',
            toAgent:   targetAgent,
            intent:    'handle_complaint',
            payload:   { complaintId: params.complaintId, note: params.note || '' },
            status:    'pending',
          },
        });

        logger.info('Complaint routed to department', { complaintId: params.complaintId, department: params.department });
        return { success: true, complaintId: params.complaintId, routedTo: params.department, targetAgent };
      },
    };
  }

  // ─── Cross-Dept Document / Permission Request ───────────────────────────────

  static createGetComplaintDependenciesTool(): MCPTool {
    return {
      name: 'getComplaintDependencies',
      description: 'Get the list of cross-department document/permission dependencies for a given complaint category',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Complaint category (e.g. factory_smoke, sewage_overflow, road_widening)' },
        },
        required: ['category'],
      },
      handler: async (params) => {
        const dependencies = config.complaintDependencies[params.category] || [];
        return {
          category:          params.category,
          dependencies,
          hasDependencies:   dependencies.length > 0,
          count:             dependencies.length,
        };
      },
    };
  }

  static createRequestDeptDocumentOrPermissionTool(slackApp: SlackApp): MCPTool {
    return {
      name: 'requestDeptDocumentOrPermission',
      description: 'Auto-send a structured document/permission request to a government department\'s Slack channel and record it in the database',
      parameters: {
        type: 'object',
        properties: {
          complaintId:    { type: 'string', description: 'Complaint ID this request is for' },
          fromDept:       { type: 'string', description: 'Requesting department' },
          toDept:         { type: 'string', description: 'Department being asked (Environment, WaterSupply, Roads, HealthSanitation)' },
          documentNeeded: { type: 'string', description: 'Specific document or permission needed' },
          deadlineDays:   { type: 'number', description: 'Number of days to fulfill (default 3)' },
          urgencyNote:    { type: 'string', description: 'Optional urgency context' },
        },
        required: ['complaintId', 'fromDept', 'toDept', 'documentNeeded'],
      },
      handler: async (params) => {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + (params.deadlineDays || 3));

        const channelId = config.departmentChannels[params.toDept as keyof typeof config.departmentChannels];
        if (!channelId) return { success: false, error: `No Slack channel configured for dept: ${params.toDept}` };

        // Fetch complaint summary
        const complaint = await prisma.complaint.findUnique({ where: { id: params.complaintId } });
        if (!complaint) return { success: false, error: 'Complaint not found' };

        const requestMessage = [
          `🏛️ *Inter-Department Document/Permission Request*`,
          ``,
          `*From:* ${params.fromDept} Department`,
          `*To:* ${params.toDept} Department`,
          `*Complaint ID:* \`${params.complaintId}\``,
          `*Category:* ${complaint.category}`,
          `*Location:* ${complaint.location}`,
          ``,
          `*Document / Permission Needed:*`,
          `> ${params.documentNeeded}`,
          ``,
          params.urgencyNote ? `*Urgency:* ${params.urgencyNote}\n` : '',
          `*Deadline:* ${deadline.toDateString()}`,
          ``,
          `Please review and use \`/fulfill-doc\` command with the request ID once ready.`,
          `Complaint description: _${complaint.description.substring(0, 200)}_`,
        ].filter(Boolean).join('\n');

        // Post to department Slack channel
        let slackTs: string | undefined;
        try {
          const result = await slackApp.client.chat.postMessage({
            channel: channelId,
            text: requestMessage,
          });
          slackTs = result.ts as string;
        } catch (err) {
          logger.warn('Failed to post doc request to Slack, recording in DB anyway', { err });
        }

        // Record in database
        const docRequest = await prisma.deptDocumentRequest.create({
          data: {
            complaintId:    params.complaintId,
            fromDept:       params.fromDept,
            toDept:         params.toDept,
            documentNeeded: params.documentNeeded,
            requestMessage: requestMessage,
            deadline:       deadline,
            status:         'pending',
            slackMessageTs: slackTs,
            slackChannelId: channelId,
          },
        });

        // Update complaint status to blocked_on_docs if not already in_progress
        await prisma.complaint.update({
          where: { id: params.complaintId },
          data: { status: 'blocked_on_docs' },
        });

        await AuditService.logAudit({
          agentName:  params.fromDept + 'Agent',
          action:     'doc_request_sent',
          resource:   'dept_document_request',
          resourceId: docRequest.id,
          details:    { toDept: params.toDept, documentNeeded: params.documentNeeded, complaintId: params.complaintId },
        });

        logger.info('Document/permission request sent', {
          requestId: docRequest.id,
          fromDept: params.fromDept,
          toDept: params.toDept,
          complaintId: params.complaintId,
        });

        return { success: true, requestId: docRequest.id, deadline: deadline.toISOString(), slackPosted: !!slackTs };
      },
    };
  }

  static createFulfillDocumentRequestTool(slackApp: SlackApp): MCPTool {
    return {
      name: 'fulfillDocumentRequest',
      description: 'Mark a document/permission request as fulfilled. Checks if all deps are met and unblocks primary dept agent.',
      parameters: {
        type: 'object',
        properties: {
          requestId:       { type: 'string', description: 'The DeptDocumentRequest ID' },
          fulfillmentNote: { type: 'string', description: 'Summary of what was provided' },
          fulfilledBy:     { type: 'string', description: 'Agent or officer name fulfilling the request' },
          status:          { type: 'string', description: 'fulfilled or rejected' },
        },
        required: ['requestId', 'fulfillmentNote', 'fulfilledBy'],
      },
      handler: async (params) => {
        const docRequest = await prisma.deptDocumentRequest.update({
          where: { id: params.requestId },
          data: {
            status:          params.status || 'fulfilled',
            fulfillmentNote: params.fulfillmentNote,
            fulfilledAt:     new Date(),
          },
          include: { complaint: true },
        });

        // Reply in the Slack thread if we have the ts
        if (docRequest.slackChannelId && docRequest.slackMessageTs) {
          try {
            await slackApp.client.chat.postMessage({
              channel: docRequest.slackChannelId,
              thread_ts: docRequest.slackMessageTs,
              text: `✅ *Request ${params.status || 'fulfilled'}* by ${params.fulfilledBy}\n> ${params.fulfillmentNote}`,
            });
          } catch (e) {
            logger.warn('Failed to reply in Slack thread for doc request', { requestId: params.requestId });
          }
        }

        // Check if all pending doc requests for this complaint are now fulfilled
        const remainingPending = await prisma.deptDocumentRequest.count({
          where: { complaintId: docRequest.complaintId, status: 'pending' },
        });

        if (remainingPending === 0) {
          // All dependencies fulfilled — notify the primary dept agent
          await prisma.complaint.update({
            where: { id: docRequest.complaintId },
            data: { status: 'in_progress' },
          });

          const complaint = docRequest.complaint;
          const agentNameMap: Record<string, string> = {
            Environment:      'EnvironmentAgent',
            WaterSupply:      'WaterSupplyAgent',
            Roads:            'RoadsInfraAgent',
            HealthSanitation: 'HealthSanitationAgent',
          };
          const primaryAgent = complaint.assignedDept ? agentNameMap[complaint.assignedDept] : 'SupervisorAgent';

          await prisma.agentMessage.create({
            data: {
              fromAgent: 'System',
              toAgent:   primaryAgent,
              intent:    'all_docs_fulfilled',
              payload:   { complaintId: docRequest.complaintId, note: 'All cross-department documents/permissions have been received. Proceed with resolution.' },
              status:    'pending',
            },
          });

          // Post to primary dept channel
          const primaryChannel = complaint.assignedDept
            ? config.departmentChannels[complaint.assignedDept as keyof typeof config.departmentChannels]
            : config.departmentChannels.Supervisor;
          
          if (primaryChannel) {
            try {
              await slackApp.client.chat.postMessage({
                channel: primaryChannel,
                text: `✅ *All required documents/permissions received for Complaint \`${docRequest.complaintId}\`.*\nPlease proceed with investigation and resolution.`,
              });
            } catch (e) {
              logger.warn('Failed to notify primary dept channel', { complaintId: docRequest.complaintId });
            }
          }

          await AuditService.logAudit({
            agentName:  params.fulfilledBy,
            action:     'all_docs_fulfilled',
            resource:   'complaint',
            resourceId: docRequest.complaintId,
            details:    { requestId: params.requestId },
          });

          return { success: true, requestId: params.requestId, allDocsFulfilled: true, complaintUnblocked: true };
        }

        return { success: true, requestId: params.requestId, allDocsFulfilled: false, remainingPending };
      },
    };
  }

  // ─── Officer Notification ───────────────────────────────────────────────────

  static createNotifyOfficerTool(slackApp: SlackApp): MCPTool {
    return {
      name: 'notifyOfficer',
      description: 'Send a direct message to a government officer via Slack',
      parameters: {
        type: 'object',
        properties: {
          slackUserId: { type: 'string', description: 'Slack user ID of the officer' },
          message:     { type: 'string', description: 'Notification message' },
          complaintId: { type: 'string', description: 'Related complaint ID (optional)' },
        },
        required: ['slackUserId', 'message'],
      },
      handler: async (params) => {
        const result = await slackApp.client.chat.postMessage({
          channel: params.slackUserId, // DM by user ID
          text: params.message,
        });
        return { success: true, ts: result.ts };
      },
    };
  }

  // ─── Slack ──────────────────────────────────────────────────────────────────

  static createSendSlackMessageTool(slackApp: SlackApp): MCPTool {
    return {
      name: 'sendSlackMessage',
      description: 'Send a message to a Slack channel or user',
      parameters: {
        type: 'object',
        properties: {
          channel:  { type: 'string', description: 'Slack channel ID or user ID' },
          text:     { type: 'string', description: 'Message text' },
          threadTs: { type: 'string', description: 'Thread timestamp to reply in thread (optional)' },
        },
        required: ['channel', 'text'],
      },
      handler: async (params) => {
        const result = await slackApp.client.chat.postMessage({
          channel: params.channel,
          text: params.text,
          thread_ts: params.threadTs,
        });
        return { success: true, ts: result.ts };
      },
    };
  }

  // ─── Inter-Agent ────────────────────────────────────────────────────────────

  static createSendAgentMessageTool(): MCPTool {
    return {
      name: 'sendAgentMessage',
      description: 'Queue a message to another government department agent',
      parameters: {
        type: 'object',
        properties: {
          to:      { type: 'string', description: 'Target agent name (e.g. EnvironmentAgent, WaterSupplyAgent)' },
          intent:  { type: 'string', description: 'Message intent/purpose' },
          payload: { type: 'object', description: 'Message payload' },
          from:    { type: 'string', description: 'Source agent name' },
        },
        required: ['to', 'intent', 'payload'],
      },
      handler: async (params) => {
        const message = await prisma.agentMessage.create({
          data: {
            fromAgent: params.from || 'unknown',
            toAgent:   params.to,
            intent:    params.intent,
            payload:   params.payload,
            status:    'pending',
          },
        });
        logger.info(`Agent message queued: ${params.from} → ${params.to}`, { intent: params.intent, messageId: message.id });
        return { success: true, messageId: message.id };
      },
    };
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  static createLogAuditTool(): MCPTool {
    return {
      name: 'logAudit',
      description: 'Record an audit event for government accountability',
      parameters: {
        type: 'object',
        properties: {
          agentName:  { type: 'string', description: 'Agent name performing the action' },
          action:     { type: 'string', description: 'Action being logged' },
          resource:   { type: 'string', description: 'Resource type (complaint, doc_request, etc.)' },
          resourceId: { type: 'string', description: 'Resource ID' },
          details:    { type: 'object', description: 'Additional details' },
        },
        required: ['action'],
      },
      handler: async (params) => {
        await AuditService.logAudit(params);
        return { success: true };
      },
    };
  }
}
