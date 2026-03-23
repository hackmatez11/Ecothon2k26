import { prisma } from './prisma.service';
import { logger } from '../utils/logger';

export class AuditService {
  /**
   * Log a government system audit event
   */
  static async logAudit(params: {
    officerId?: string;
    agentName?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    // Legacy alias (ignored, kept for compat)
    doctorId?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          officerId:  params.officerId || undefined,
          agentName:  params.agentName,
          action:     params.action,
          resource:   params.resource,
          resourceId: params.resourceId,
          details:    params.details || null,
          ipAddress:  params.ipAddress,
        },
      });

      logger.info('Audit log created', {
        action:    params.action,
        resource:  params.resource,
        agentName: params.agentName,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw — audit failures shouldn't break the main flow
    }
  }

  /**
   * Query audit logs
   */
  static async getAuditLogs(filters: {
    officerId?: string;
    agentName?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return prisma.auditLog.findMany({
      where: {
        officerId: filters.officerId,
        agentName: filters.agentName,
        action:    filters.action,
        createdAt: { gte: filters.startDate, lte: filters.endDate },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }
}
