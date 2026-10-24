'use server';

import { auth } from '@/auth';
import prisma from '@/lib/db/prisma';
import { Priority, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function createTaskAction(params: {
  projectId: string;
  title: string;
  goal?: string;
  description?: string;
  statusId: string;
  assigneeId?: string;
  priority?: Priority;
  estimatedHours?: number;
  dueDate?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const title = params.title.trim();
  if (!title) {
    return { ok: false, error: 'Judul tugas wajib diisi.' };
  }

  try {
    const task = await prisma.task.create({
      data: {
        projectId: params.projectId,
        statusId: params.statusId,
        creatorId: session.user.id,
        assigneeId: params.assigneeId || null,
        title,
        description: params.description?.trim() || null,
        priority: params.priority || Priority.MEDIUM,
        estimatedHours: params.estimatedHours ?? 0,
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        workspaceId: (await prisma.project.findUnique({ where: { id: params.projectId }, select: { workspaceId: true } }))?.workspaceId || '',
        projectId: params.projectId,
        taskId: task.id,
        actorId: session.user.id,
        actionType: 'ASSIGNED',
        metadata: { title: task.title, goal: params.goal },
      },
    });

    revalidatePath(`/projects/${params.projectId}`);
    revalidatePath('/my-tasks');
    return { ok: true, data: task };
  } catch (error) {
    console.error('[TaskAction] Failed to create task:', error);
    return { ok: false, error: 'Gagal membuat tugas di server.' };
  }
}

export async function updateTaskStatusAction(taskId: string, newStatusId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { workspaceId: true } },
      },
    });

    if (!existing) {
      return { ok: false, error: 'Tugas tidak ditemukan.' };
    }

    const targetStatus = await prisma.customStatus.findUnique({
      where: { id: newStatusId },
    });

    if (!targetStatus) {
      return { ok: false, error: 'Status tujuan tidak valid.' };
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { statusId: newStatusId },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        workspaceId: existing.project.workspaceId,
        projectId: existing.projectId,
        taskId: existing.id,
        actorId: session.user.id,
        actionType: 'STATUS_CHANGED',
        metadata: { statusName: targetStatus.name, isDoneState: targetStatus.isDoneState },
      },
    });

    // Auto notification handoff if completed
    if (targetStatus.isDoneState) {
      const blockedDeps = await prisma.taskDependency.findMany({
        where: { dependsOnTaskId: taskId },
        include: {
          task: {
            include: {
              prerequisites: {
                include: {
                  dependsOnTask: { include: { status: true } },
                },
              },
            },
          },
          dependsOnTask: { select: { title: true } },
        },
      });

      for (const dep of blockedDeps) {
        const blockedTask = dep.task;
        const allPrereqsDone = blockedTask.prerequisites.every(p => p.dependsOnTask.status.isDoneState);
        if (allPrereqsDone && blockedTask.assigneeId) {
          await prisma.notification.create({
            data: {
              userId: blockedTask.assigneeId,
              actorId: session.user.id,
              title: 'Estafet Tugas: Prasyarat Selesai',
              message: `Semua prasyarat untuk tugas "${blockedTask.title}" telah selesai. Anda sudah bisa mulai mengerjakan.`,
              linkUrl: `/projects/${blockedTask.projectId}?taskId=${blockedTask.id}`,
            },
          });
        }
      }
    }

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath('/my-tasks');
    return { ok: true, data: updatedTask };
  } catch (error) {
    console.error('[TaskAction] Failed to update task status:', error);
    return { ok: false, error: 'Gagal memperbarui status tugas.' };
  }
}

export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    assigneeId?: string;
    priority?: Priority;
    estimatedHours?: number;
    dueDate?: string;
  }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      return { ok: false, error: 'Tugas tidak ditemukan.' };
    }
    const authUser = session.user;
    const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
    const isCreatorOrOwner = existing.creatorId === session.user.id || userRole === Role.OWNER;
    if (!isCreatorOrOwner) {
      return { ok: false, error: 'Hanya pembuat tugas atau Owner yang berhak mengubah rincian tugas.' };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() || null : undefined,
        assigneeId: data.assigneeId !== undefined ? data.assigneeId || null : undefined,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath('/my-tasks');
    return { ok: true, data: updated };
  } catch (error) {
    console.error('[TaskAction] Failed to update task:', error);
    return { ok: false, error: 'Gagal menyimpan perubahan tugas.' };
  }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      return { ok: false, error: 'Tugas tidak ditemukan.' };
    }

    const authUser = session.user;
    const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
    const isCreatorOrOwner = existing.creatorId === session.user.id || userRole === Role.OWNER;
    if (!isCreatorOrOwner) {
      return { ok: false, error: 'Hanya pembuat tugas atau Owner yang berhak menghapus tugas.' };
    }
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath('/my-tasks');
    return { ok: true };
  } catch (error) {
    console.error('[TaskAction] Failed to delete task:', error);
    return { ok: false, error: 'Gagal menghapus tugas.' };
  }
}
