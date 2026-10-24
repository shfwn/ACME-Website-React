'use server';

import { auth } from '@/auth';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './task.actions';

export async function toggleSubtaskAction(subtaskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: { select: { projectId: true, project: { select: { workspaceId: true } } } },
      },
    });

    if (!subtask) {
      return { ok: false, error: 'Subtask tidak ditemukan.' };
    }

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted: !subtask.isCompleted },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: subtask.task.project.workspaceId,
        projectId: subtask.task.projectId,
        taskId: subtask.taskId,
        actorId: session.user.id,
        actionType: 'SUBTASK_TOGGLED',
        metadata: { subtaskId, title: subtask.title, isCompleted: updated.isCompleted },
      },
    });

    revalidatePath(`/projects/${subtask.task.projectId}`);
    revalidatePath('/my-tasks');
    return { ok: true, data: updated };
  } catch (error) {
    console.error('[SubtaskAction] Failed to toggle subtask:', error);
    return { ok: false, error: 'Gagal mengubah status langkah kerja.' };
  }
}

export async function addSubtaskAction(taskId: string, title: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return { ok: false, error: 'Judul langkah kerja tidak boleh kosong.' };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, subtasks: { select: { id: true } } },
    });

    if (!task) {
      return { ok: false, error: 'Tugas tidak ditemukan.' };
    }

    const newSubtask = await prisma.subtask.create({
      data: {
        taskId,
        title: cleanTitle,
        isCompleted: false,
        orderIndex: task.subtasks.length,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath('/my-tasks');
    return { ok: true, data: newSubtask };
  } catch (error) {
    console.error('[SubtaskAction] Failed to add subtask:', error);
    return { ok: false, error: 'Gagal menambahkan langkah kerja.' };
  }
}

export async function deleteSubtaskAction(subtaskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: { task: { select: { projectId: true } } },
    });

    if (!subtask) {
      return { ok: false, error: 'Subtask tidak ditemukan.' };
    }

    await prisma.subtask.delete({
      where: { id: subtaskId },
    });

    revalidatePath(`/projects/${subtask.task.projectId}`);
    revalidatePath('/my-tasks');
    return { ok: true };
  } catch (error) {
    console.error('[SubtaskAction] Failed to delete subtask:', error);
    return { ok: false, error: 'Gagal menghapus langkah kerja.' };
  }
}

export async function addTimeLogAction(
  taskId: string,
  durationMinutes: number,
  note?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const mins = Number(durationMinutes);
  if (!mins || isNaN(mins) || mins <= 0) {
    return { ok: false, error: 'Durasi waktu harus berupa angka positif.' };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { workspaceId: true } } },
    });

    if (!task) {
      return { ok: false, error: 'Tugas tidak ditemukan.' };
    }

    const newLog = await prisma.timeLog.create({
      data: {
        taskId,
        userId: session.user.id,
        durationMinutes: mins,
        durationSeconds: mins * 60,
        note: note?.trim() || 'Pencatatan waktu kerja',
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        actorId: session.user.id,
        actionType: 'TIME_LOGGED',
        metadata: { durationMinutes: mins, note: newLog.note },
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/projects/${task.projectId}/workload`);
    revalidatePath('/my-tasks');
    return { ok: true, data: newLog };
  } catch (error) {
    console.error('[TimeLogAction] Failed to add time log:', error);
    return { ok: false, error: 'Gagal mencatat waktu pengerjaan.' };
  }
}

export async function deleteTimeLogAction(logId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const log = await prisma.timeLog.findUnique({
      where: { id: logId },
      include: { task: { select: { projectId: true, creatorId: true } } },
    });

    if (!log) {
      return { ok: false, error: 'Catatan waktu tidak ditemukan.' };
    }

    const authUser = session.user;
    const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
    const isOwnerOrLogger = log.userId === session.user.id || log.task.creatorId === session.user.id || userRole === Role.OWNER;
    if (!isOwnerOrLogger) {
      return { ok: false, error: 'Hanya pencatat waktu atau Owner yang berhak menghapus log ini.' };
    }

    await prisma.timeLog.delete({
      where: { id: logId },
    });

    revalidatePath(`/projects/${log.task.projectId}`);
    revalidatePath(`/projects/${log.task.projectId}/workload`);
    revalidatePath('/my-tasks');
    return { ok: true };
  } catch (error) {
    console.error('[TimeLogAction] Failed to delete time log:', error);
    return { ok: false, error: 'Gagal menghapus catatan waktu.' };
  }
}

export async function addCommentAction(
  taskId: string,
  content: string,
  mentions: string[] = []
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const cleanContent = content.trim();
  if (!cleanContent) {
    return { ok: false, error: 'Isi komentar tidak boleh kosong.' };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { workspaceId: true } } },
    });

    if (!task) {
      return { ok: false, error: 'Tugas tidak ditemukan.' };
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: session.user.id,
        content: cleanContent,
        mentions,
      },
    });

    // Notify mentioned users
    for (const mentionedId of mentions) {
      if (mentionedId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: mentionedId,
            actorId: session.user.id,
            title: 'Panggilan Tugas (Mention)',
            message: `${session.user.name || 'Rekan'} memanggil Anda dalam komentar tugas "${task.title}".`,
            linkUrl: `/projects/${task.projectId}?taskId=${task.id}`,
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        actorId: session.user.id,
        actionType: 'COMMENT_ADDED',
        metadata: { commentId: comment.id },
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { ok: true, data: comment };
  } catch (error) {
    console.error('[CommentAction] Failed to add comment:', error);
    return { ok: false, error: 'Gagal mengirim komentar.' };
  }
}

export async function deleteCommentAction(commentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { task: { select: { projectId: true, creatorId: true } } },
    });

    if (!comment) {
      return { ok: false, error: 'Komentar tidak ditemukan.' };
    }

    const authUser = session.user;
    const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
    const isOwnerOrAuthor = comment.userId === session.user.id || comment.task.creatorId === session.user.id || userRole === Role.OWNER;
    if (!isOwnerOrAuthor) {
      return { ok: false, error: 'Hanya penulis komentar atau Owner yang berhak menghapus komentar ini.' };
    }

    await prisma.taskComment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/projects/${comment.task.projectId}`);
    return { ok: true };
  } catch (error) {
    console.error('[CommentAction] Failed to delete comment:', error);
    return { ok: false, error: 'Gagal menghapus komentar.' };
  }
}
