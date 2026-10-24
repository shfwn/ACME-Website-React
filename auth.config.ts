import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ('role' in user && typeof user.role === 'string') {
          token.role = user.role;
        } else {
          token.role = 'MEMBER';
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const tokenId = typeof token.id === 'string' ? token.id : (typeof token.sub === 'string' ? token.sub : '');
        const tokenRole = typeof token.role === 'string' ? token.role : 'MEMBER';
        session.user.id = tokenId;
        Object.assign(session.user, { role: tokenRole });
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const authUser = auth?.user;
      const userRole = authUser && 'role' in authUser && typeof authUser.role === 'string' ? authUser.role : '';
      const isMilt = userRole === 'MILT';

      const isOnLogin = nextUrl.pathname === '/login';
      const isMiltRoute = nextUrl.pathname.startsWith('/milt');
      const isTeamRoute =
        nextUrl.pathname.startsWith('/my-tasks') ||
        nextUrl.pathname.startsWith('/notifications') ||
        nextUrl.pathname.startsWith('/projects') ||
        nextUrl.pathname.startsWith('/users');

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL(isMilt ? '/milt/todos' : '/my-tasks', nextUrl));
        }
        return true;
      }

      // 1. ISOLASI RUTE MILT (/milt/*):
      // Hanya role MILT yang berhak mengakses fitur MILT. Role lain langsung dialihkan ke /my-tasks!
      if (isMiltRoute) {
        if (!isLoggedIn) return false;
        if (!isMilt) {
          return Response.redirect(new URL('/my-tasks', nextUrl));
        }
        return true;
      }

      // 2. ISOLASI RUTE TIM:
      // Role MILT TIDAK BISA mengakses fitur utama role lain! Otomatis dialihkan ke /milt/todos!
      if (isTeamRoute) {
        if (!isLoggedIn) return false;
        if (isMilt) {
          return Response.redirect(new URL('/milt/todos', nextUrl));
        }

        // Strict server-side RBAC for /users (khusus OWNER)
        if (nextUrl.pathname.startsWith('/users')) {
          if (userRole !== 'OWNER') {
            return Response.redirect(new URL('/my-tasks', nextUrl));
          }
        }
        return true;
      }

      return true;
    },
  },
  providers: [], // configured in auth.ts with Credentials
} satisfies NextAuthConfig;
