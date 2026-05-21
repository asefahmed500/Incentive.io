import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // This will be overridden in auth.ts with DB logic
        return null;
      },
    }),
  ],
  session: {
	  strategy: "jwt",
	  maxAge: 60 * 60 * 24, // 24 hours
	  updateAge: 60 * 30, // Refresh session every 30 minutes
	},
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userRole = (user as { role: string }).role;
        token.id = (user as { id: string }).id;
        token.role = userRole;
        token.employeeId = (user as { employeeId?: string }).employeeId;
        token.isActive = (user as { isActive?: boolean }).isActive ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string || "INVALID";
        session.user.employeeId = token.employeeId as string | undefined;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
	cookies: {
	  sessionToken: {
		name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
		options: {
		  httpOnly: true,
		  sameSite: "lax",
		  path: "/",
		  secure: process.env.NODE_ENV === "production",
		},
	  },
	  callbackUrl: {
		name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
		options: {
		  httpOnly: true,
		  sameSite: "lax",
		  path: "/",
		  secure: process.env.NODE_ENV === "production",
		},
	  },
	  csrfToken: {
		name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.csrf-token`,
		options: {
		  httpOnly: true,
		  sameSite: "lax",
		  path: "/",
		  secure: process.env.NODE_ENV === "production",
		},
	  },
	},
} satisfies NextAuthConfig;
