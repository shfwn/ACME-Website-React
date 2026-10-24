'use server';

import { auth } from '@/auth';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './task.actions';

export async function saveDocAction(params: {
  id?: string;
  projectId: string;
  title: string;
  contentMarkdown?: string;
  linkedTaskIds?: string[];
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const title = params.title.trim();
  if (!title) {
    return { ok: false, error: 'Judul dokumen tidak boleh kosong.' };
  }

  try {
    if (params.id) {
      const existing = await prisma.docWiki.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        return { ok: false, error: 'Dokumen tidak ditemukan.' };
      }

      const updated = await prisma.docWiki.update({
        where: { id: params.id },
        data: {
          title,
          contentMarkdown: params.contentMarkdown || '',
          linkedTaskIds: params.linkedTaskIds || [],
        },
      });

      revalidatePath(`/projects/${params.projectId}/docs`);
      return { ok: true, data: updated };
    }

    const created = await prisma.docWiki.create({
      data: {
        projectId: params.projectId,
        creatorId: session.user.id,
        title,
        contentMarkdown: params.contentMarkdown || '',
        linkedTaskIds: params.linkedTaskIds || [],
      },
    });

    revalidatePath(`/projects/${params.projectId}/docs`);
    return { ok: true, data: created };
  } catch (error) {
    console.error('[DocAction] Failed to save doc:', error);
    return { ok: false, error: 'Gagal menyimpan dokumen.' };
  }
}

export async function deleteDocAction(docId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  try {
    const doc = await prisma.docWiki.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return { ok: false, error: 'Dokumen tidak ditemukan.' };
    }

    const authUser = session.user;
    const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
    const isOwnerOrCreator = doc.creatorId === session.user.id || userRole === Role.OWNER;
    if (!isOwnerOrCreator) {
      return { ok: false, error: 'Hanya pembuat dokumen atau Owner yang berhak menghapus dokumen ini.' };
    }

    await prisma.docWiki.delete({
      where: { id: docId },
    });

    revalidatePath(`/projects/${doc.projectId}/docs`);
    return { ok: true };
  } catch (error) {
    console.error('[DocAction] Failed to delete doc:', error);
    return { ok: false, error: 'Gagal menghapus dokumen.' };
  }
}
