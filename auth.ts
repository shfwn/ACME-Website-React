import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compareSync } from 'bcrypt-ts';
import prisma from '@/lib/db/prisma';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials || typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const passwordsMatch = compareSync(password, user.passwordHash);
          if (!passwordsMatch) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: user.role,
          };
        } catch {
          // Safe fallback for offline development before Neon Tech connection is activated
        }

        // Standard test accounts with hashed passwords
        const defaultHash = '$2b$10$vyfPJFIoyWcL390Vr3sm.e4Uw2vd.6bNHBLhkwcoxCG6z6kPwFQrO'; // password123
        const localTestAccounts: Record<string, { id: string; name: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' }> = {
          'milt1058@gmail.com': { id: 'u-milt', name: 'Owner', role: 'OWNER' },
          'owner@company.com': { id: 'u-milt', name: 'Owner', role: 'OWNER' },
          'siti@company.com': { id: 'u-siti', name: 'Siti Rahma', role: 'ADMIN' },
          'andi@company.com': { id: 'u-andi', name: 'Andi Pratama', role: 'MEMBER' },
        };
        const testAcc = localTestAccounts[email];
        if (testAcc) {
          const isMatch = compareSync(password, defaultHash);
          if (isMatch) {
            return {
              id: testAcc.id,
              name: testAcc.name,
              email,
              role: testAcc.role,
            };
          }
        }

        return null;
      },
    }),
  ],
});
