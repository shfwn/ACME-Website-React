'use server';

import { auth } from '@/auth';
import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './task.actions';

export async function addDependencyAction(taskId: string, dependsOnTaskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  if (taskId === dependsOnTaskId) {
    return { ok: false, error: 'Tugas tidak dapat bergantung pada dirinya sendiri.' };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!task) {
      return { ok: false, error: 'Tugas tidak ditemukan.' };
    }

    // 1. Fetch all dependencies in the project in ONE batch query (No N+1 in loops)
    const projectDeps = await prisma.taskDependency.findMany({
      where: {
        task: { projectId: task.projectId },
      },
      select: { taskId: true, dependsOnTaskId: true },
    });

    // 2. Build in-memory adjacency list
    const adj = new Map<string, string[]>();
    for (const d of projectDeps) {
      const list = adj.get(d.taskId) || [];
      list.push(d.dependsOnTaskId);
      adj.set(d.taskId, list);
    }

    // 3. BFS Cycle detection
    const queue = [dependsOnTaskId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      if (current === taskId) {
        return {
          ok: false,
          error: 'Terdeteksi Ketergantungan Siklus! Tugas ini akan membuat loop tak berujung.',
        };
      }

      if (!visited.has(current)) {
        visited.add(current);
        const nextNodes = adj.get(current) || [];
        for (const next of nextNodes) {
          queue.push(next);
        }
      }
    }

    // 4. Upsert relation to avoid duplicates
    const dep = await prisma.taskDependency.upsert({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
      },
      update: {},
      create: {
        taskId,
        dependsOnTaskId,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { ok: true, data: dep };
  } catch (error) {
    console.error('[DependencyAction] Failed to add dependency:', error);
    return { ok: false, error: 'Gagal menghubungkan tugas prasyarat.' };
  }
}

export async function removeDependencyAction(taskId: string, dependsOnTaskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    await prisma.taskDependency.deleteMany({
      where: { taskId, dependsOnTaskId },
    });

    if (task) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    return { ok: true };
  } catch (error) {
    console.error('[DependencyAction] Failed to remove dependency:', error);
    return { ok: false, error: 'Gagal menghapus hubungan prasyarat.' };
  }
}
