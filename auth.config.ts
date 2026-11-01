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
      const isOwner = userRole === 'OWNER' || userRole === 'MILT' || authUser?.email?.toLowerCase() === 'milt1058@gmail.com';

      const isOnLogin = nextUrl.pathname === '/login';
      const isMiltRoute = nextUrl.pathname.startsWith('/milt');
      const isTeamRoute =
        nextUrl.pathname.startsWith('/my-tasks') ||
        nextUrl.pathname.startsWith('/notifications') ||
        nextUrl.pathname.startsWith('/projects');
      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL(isOwner ? '/milt/todos' : '/my-tasks', nextUrl));
        }
        return true;
      }
      // Common Settings route (available for all authenticated roles)
      if (nextUrl.pathname.startsWith('/settings')) {
        if (!isLoggedIn) return false;
        return true;
      }
      // User Management route (restricted to OWNER or MILT)
      if (nextUrl.pathname.startsWith('/users')) {
        if (!isLoggedIn) return false;
        if (!isOwner) {
          return Response.redirect(new URL('/my-tasks', nextUrl));
        }
        return true;
      }



      // 1. ISOLASI RUTE PERSONAL (/milt/*):
      // Hanya role OWNER yang berhak mengakses fitur personal. Role lain langsung dialihkan ke /my-tasks!
      if (isMiltRoute) {
        if (!isLoggedIn) return false;
        if (!isOwner) {
          return Response.redirect(new URL('/my-tasks', nextUrl));
        }
        return true;
      }

      // 2. ISOLASI RUTE TIM:
      // Role OWNER memiliki suite personal eksklusif. Rute tim dialihkan ke /milt/todos!
      if (isTeamRoute) {
        if (!isLoggedIn) return false;
        if (isOwner) {
          return Response.redirect(new URL('/milt/todos', nextUrl));
        }
        return true;
      }

      return true;
    },
  },
  providers: [], // configured in auth.ts with Credentials
} satisfies NextAuthConfig;
