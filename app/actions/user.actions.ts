'use server';

import { auth } from '@/auth';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import { hashSync } from 'bcrypt-ts';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './task.actions';

export async function createUserAction(params: {
  name: string;
  email: string;
  role: Role;
  weeklyCapacityHours?: number;
  password?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const authUser = session.user;
  const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
  if (userRole !== Role.OWNER) {
    return { ok: false, error: 'Akses ditolak: Hanya peran OWNER yang berwenang menambahkan anggota tim.' };
  }

  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, error: 'Nama dan alamat email wajib diisi.' };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { ok: false, error: 'Email pengguna sudah terdaftar di sistem.' };
    }

    const passwordToHash = params.password || 'password123';
    const passwordHash = hashSync(passwordToHash, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: params.role || Role.MEMBER,
        weeklyCapacityHours: params.weeklyCapacityHours || 40,
        avatarUrl: `/assets/images/profile/user-1.jpg`,
      },
    });

    // Add to default workspace if exists
    const defaultWorkspace = await prisma.workspace.findFirst({ select: { id: true } });
    if (defaultWorkspace) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: defaultWorkspace.id,
          userId: newUser.id,
          role: newUser.role,
        },
      });
    }

    revalidatePath('/users');
    return { ok: true, data: newUser };
  } catch (error) {
    console.error('[UserAction] Failed to create user:', error);
    return { ok: false, error: 'Gagal menambahkan anggota tim baru.' };
  }
}

export async function updateUserRoleAction(userId: string, newRole: Role): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const authUser = session.user;
  const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
  if (userRole !== Role.OWNER) {
    return { ok: false, error: 'Akses ditolak: Hanya peran OWNER yang berwenang mengubah peran anggota.' };
  }

  if (userId === session.user.id) {
    return { ok: false, error: 'Tidak dapat mengubah peran akun Anda sendiri.' };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Also update workspace membership role
    await prisma.workspaceMember.updateMany({
      where: { userId },
      data: { role: newRole },
    });

    revalidatePath('/users');
    return { ok: true, data: updated };
  } catch (error) {
    console.error('[UserAction] Failed to update user role:', error);
    return { ok: false, error: 'Gagal memperbarui peran pengguna.' };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Autentikasi diperlukan.' };
  }

  const authUser = session.user;
  const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
  if (userRole !== Role.OWNER) {
    return { ok: false, error: 'Akses ditolak: Hanya peran OWNER yang berwenang menghapus anggota.' };
  }

  if (userId === session.user.id) {
    return { ok: false, error: 'Tidak dapat menghapus akun Anda sendiri.' };
  }

  try {
    // 1. Clean orphaned references: Nullify assigneeId on tasks and subtasks
    await prisma.task.updateMany({
      where: { assigneeId: userId },
      data: { assigneeId: null },
    });
    await prisma.subtask.updateMany({
      where: { assigneeId: userId },
      data: { assigneeId: null },
    });

    // 2. Delete user (cascades memberships, timeLogs, comments, notifications)
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath('/users');
    revalidatePath('/my-tasks');
    return { ok: true };
  } catch (error) {
    console.error('[UserAction] Failed to delete user:', error);
    return { ok: false, error: 'Gagal menghapus pengguna dari tim.' };
  }
}
