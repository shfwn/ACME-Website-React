import { ActionType, Prisma } from '@prisma/client';
import prisma from '../db/prisma';

export interface LogActivityParams {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  actorId: string;
  actionType: ActionType;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Service to log system and user activities into the audit trail
 */
export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        taskId: params.taskId,
        actorId: params.actorId,
        actionType: params.actionType,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    // Non-blocking catch to avoid failing main mutation if audit write fails
    console.error('[AuditService] Failed to record activity log:', error);
    return null;
  }
}
