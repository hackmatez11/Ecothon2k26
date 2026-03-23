import express, { Request, Response } from 'express';
import cors from 'cors';
import { AgentManager } from '../agents/agent-manager';
import { prisma } from '../database/prisma.service';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Express HTTP server to receive complaints from the citizen portal.
 * Runs alongside the Slack bot on a separate port.
 */
export function createComplaintWebhook(agentManager: AgentManager) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ── POST /api/complaint — Submit new complaint from citizen portal ─────────
  app.post('/api/complaint', async (req: Request, res: Response) => {
    try {
      const { citizenName, citizenPhone, citizenEmail, category, description, location, attachmentUrl, priority, notifyCallback } = req.body;

      if (!citizenName || !category || !description || !location) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: citizenName, category, description, location',
        });
      }

      logger.info('New complaint from citizen portal', { citizenName, category, location });

      // 1. Create complaint record directly in DB
      const complaint = await prisma.complaint.create({
        data: {
          citizenName,
          citizenPhone:   citizenPhone || null,
          citizenEmail:   citizenEmail || null,
          category,
          description,
          location,
          attachmentUrl:  attachmentUrl || null,
          priority:       priority || 'medium',
          status:         'received',
          notifyCallback: notifyCallback || null,
        },
      });

      // Initial status history
      await prisma.complaintUpdate.create({
        data: {
          complaintId: complaint.id,
          updatedBy:   'CitizenPortal',
          status:      'received',
          note:        'Complaint received from citizen portal. Pending triage.',
        },
      });

      logger.info('Complaint created, triggering SupervisorAgent triage', { complaintId: complaint.id });

      // 2. Respond immediately so the citizen portal is not blocked
      res.status(201).json({
        success: true,
        complaintId: complaint.id,
        message: 'Your complaint has been received. You will be notified about the status.',
        trackingUrl: `/api/complaint/${complaint.id}`,
      });

      // 3. Trigger SupervisorAgent triage + cross-dept doc requests (async)
      const supervisor = agentManager.getSupervisor();
      if (supervisor) {
        supervisor.handleNewComplaint({
          complaintId:  complaint.id,
          citizenName:  complaint.citizenName,
          category:     complaint.category,
          description:  complaint.description,
          location:     complaint.location,
          priority:     complaint.priority,
        }).catch(err => {
          logger.error('SupervisorAgent triage failed for complaint', { complaintId: complaint.id, err });
        });
      }

    } catch (error: any) {
      logger.error('Error creating complaint from portal:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── GET /api/complaint/:id — Status check for citizen portal polling ────────
  app.get('/api/complaint/:id', async (req: Request, res: Response) => {
    try {
      const complaint = await prisma.complaint.findUnique({
        where: { id: req.params.id },
        include: {
          updates:     { orderBy: { createdAt: 'asc' } },
          docRequests: { select: { id: true, toDept: true, documentNeeded: true, status: true, createdAt: true } },
        },
      });

      if (!complaint) {
        return res.status(404).json({ success: false, error: 'Complaint not found' });
      }

      res.json({
        success: true,
        complaintId:    complaint.id,
        status:         complaint.status,
        priority:       complaint.priority,
        assignedDept:   complaint.assignedDept,
        updates:        complaint.updates,
        docRequests:    complaint.docRequests,
        resolvedAt:     complaint.resolvedAt,
        resolutionNote: complaint.resolutionNote,
      });

    } catch (error) {
      logger.error('Error fetching complaint:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── POST /api/complaint/:id/doc-fulfilled — Portal triggers doc fulfillment ─
  app.post('/api/complaint/:id/doc-fulfilled', async (req: Request, res: Response) => {
    try {
      const { requestId, fulfillmentNote, fulfilledBy } = req.body;

      if (!requestId || !fulfillmentNote) {
        return res.status(400).json({ success: false, error: 'requestId and fulfillmentNote are required' });
      }

      const docRequest = await prisma.deptDocumentRequest.findUnique({ where: { id: requestId } });
      if (!docRequest || docRequest.complaintId !== req.params.id) {
        return res.status(404).json({ success: false, error: 'Document request not found for this complaint' });
      }

      await prisma.deptDocumentRequest.update({
        where: { id: requestId },
        data: { status: 'fulfilled', fulfillmentNote, fulfilledAt: new Date() },
      });

      // Check remaining pending doc requests
      const remaining = await prisma.deptDocumentRequest.count({
        where: { complaintId: req.params.id, status: 'pending' },
      });

      if (remaining === 0) {
        await prisma.complaint.update({
          where: { id: req.params.id },
          data: { status: 'in_progress' },
        });
        await prisma.complaintUpdate.create({
          data: {
            complaintId: req.params.id,
            updatedBy:   fulfilledBy || 'Portal',
            status:      'in_progress',
            note:        'All cross-dept documents/permissions fulfilled. Department proceeding with resolution.',
          },
        });
      }

      res.json({
        success: true,
        requestId,
        allDocsFulfilled: remaining === 0,
        remainingPending: remaining,
      });

    } catch (error) {
      logger.error('Error fulfilling doc request via portal:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'GovComplaintSystem', timestamp: new Date().toISOString() });
  });

  return app;
}

export function startWebhookServer(agentManager: AgentManager): void {
  const webhookApp = createComplaintWebhook(agentManager);
  const port = config.app.webhookPort;

  webhookApp.listen(port, () => {
    logger.info(`🌐 Citizen portal webhook running on http://localhost:${port}`);
    logger.info(`   POST /api/complaint        — Submit new complaint`);
    logger.info(`   GET  /api/complaint/:id    — Check complaint status`);
    logger.info(`   POST /api/complaint/:id/doc-fulfilled — Mark doc request as fulfilled`);
  });
}
