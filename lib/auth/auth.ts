import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import type { DefaultSession } from "next-auth";

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

export const { handlers, auth, signOut, signIn } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      ...authConfig.providers[0],
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDatabase();
        const user = await User.findOne({ 
          email: (credentials.email as string).toLowerCase(), 
          isActive: true 
        });
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
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Use base jwt logic
      if (user) {
        const userRole = (user as { role: string }).role;
        token.id = (user as { id: string }).id;
        token.role = userRole;
        token.employeeId = (user as { employeeId?: string }).employeeId;
        token.isActive = true;
      }
      
      // Add DB-recheck logic only when NOT in Edge Runtime
      // This trigger/user check is a safe bet for non-edge cases
      if (trigger === "update" || (!user && token.id)) {
        try {
          // Note: In Next.js middleware, this might still trigger a Mongoose import
          // but if we use authConfig in middleware, we avoids this file entirely.
          await connectToDatabase();
          const dbUser = await User.findById(token.id).lean();
          token.isActive = !!(dbUser && dbUser.isActive);
        } catch {
          // If DB fails (e.g. in Edge), we assume previous state
        }
      }
      return token;
    },
  }
});
