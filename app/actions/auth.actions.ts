'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || typeof email !== 'string' || !email.trim()) {
    return { error: 'Silakan masukkan alamat email Anda.' };
  }

  if (!password || typeof password !== 'string') {
    return { error: 'Silakan masukkan kata sandi Anda.' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const isMilt = cleanEmail === 'milt1058@gmail.com' || cleanEmail === 'milt@company.com';
    const destination = isMilt ? '/milt/todos' : '/my-tasks';

    await signIn('credentials', {
      email: cleanEmail,
      password,
      redirectTo: destination,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.' };
        default:
          return { error: 'Gagal masuk ke sistem. Silakan coba beberapa saat lagi.' };
      }
    }
    // Next.js redirect errors must be rethrown to let the framework navigate
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
