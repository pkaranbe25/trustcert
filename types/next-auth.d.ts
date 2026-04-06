import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      linkedWallet?: string;
      avatarColor: string;
      rememberMe: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    linkedWallet?: string;
    avatarColor: string;
    rememberMe: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    linkedWallet?: string;
    avatarColor: string;
    rememberMe: boolean;
  }
}
