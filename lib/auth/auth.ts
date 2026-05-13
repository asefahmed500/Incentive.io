import NextAuth from "next-auth";
import type { NextAuthConfig, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/mongodb";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      employeeId?: string;
      isActive?: boolean;
    } & DefaultSession["user"];
  }
}

const config: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDatabase();
        const user = await User.findOne({ email: (credentials.email as string).toLowerCase(), isActive: true });
        if (!user) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as string,
          employeeId: user.employeeId?.toString()
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
        token.employeeId = (user as { employeeId?: string }).employeeId;
        token.isActive = true;
      }
      if (trigger === "update" || (!user && token.id)) {
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.id).lean();
          if (!dbUser || !dbUser.isActive) {
            token.isActive = false;
          } else {
            token.isActive = true;
          }
        } catch {
          token.isActive = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // Type guard for role
        const role = token.role;
        if (typeof role === "string") {
          session.user.role = role;
        } else {
          session.user.role = "salesExecutive";
        }
        session.user.employeeId = token.employeeId as string | undefined;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export const { handlers, auth, signOut } = NextAuth(config);