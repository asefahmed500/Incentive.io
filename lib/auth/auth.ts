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
        return { id: user._id.toString(), email: user.email, name: user.name, role: user.role, employeeId: user.employeeId } as any;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = (user as any).id; token.role = (user as any).role; token.employeeId = (user as any).employeeId; }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) { (session.user as any).id = token.id; (session.user as any).role = token.role; (session.user as any).employeeId = token.employeeId; }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export const { handlers, auth } = NextAuth(config);