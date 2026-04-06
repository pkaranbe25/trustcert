import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        await dbConnect();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error("No account found with this email.");
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const diff = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Account locked until ${user.lockedUntil.toLocaleTimeString()}. Try again in ${diff} minutes.`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          // Handle failed login attempts
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          
          if (user.failedLoginAttempts >= 5) {
            user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
          }
          
          await user.save();
          throw new Error("Invalid password.");
        }

        // Reset failed login attempts on success
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          linkedWallet: user.linkedWallet,
          avatarColor: user.avatarColor,
          rememberMe: user.rememberMe,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.linkedWallet = (user as any).linkedWallet;
        token.avatarColor = (user as any).avatarColor;
        token.rememberMe = (user as any).rememberMe;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).linkedWallet = token.linkedWallet;
        (session.user as any).avatarColor = token.avatarColor;
        (session.user as any).rememberMe = token.rememberMe;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Default 30 days, we'll refine this in logic if needed
  },
  secret: process.env.NEXTAUTH_SECRET,
};
