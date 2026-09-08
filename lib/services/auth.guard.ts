import { Role } from '@prisma/client';
import prisma from '../db/prisma';

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export class AuthError extends Error {
  constructor(message: string, public code: 'UNAUTHENTICATED' | 'UNAUTHORIZED' | 'NOT_FOUND') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Validates whether a user has the required role for a given project or workspace
 */
export async function assertProjectPermission(userId: string, projectId: string, minRole: Role = 'VIEWER') {
  if (!userId) {
    throw new AuthError('Autentikasi diperlukan', 'UNAUTHENTICATED');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      workspaceId: true,
      workspace: {
        select: {
          members: {
            where: { userId },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!project) {
    throw new AuthError('Proyek tidak ditemukan', 'NOT_FOUND');
  }

  const member = project.workspace.members[0];
  if (!member) {
    throw new AuthError('Anda bukan anggota dari workspace ini', 'UNAUTHORIZED');
  }

  const userLevel = ROLE_HIERARCHY[member.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

  if (userLevel < requiredLevel) {
    throw new AuthError(`Akses ditolak: Dibutuhkan peran minimal ${minRole}`, 'UNAUTHORIZED');
  }

  return { member, project };
}
