"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ 
  children, 
  refetchInterval 
}: { 
  children: React.ReactNode;
  refetchInterval?: number;
}) {
  return (
    <NextAuthSessionProvider refetchInterval={refetchInterval}>
      {children}
    </NextAuthSessionProvider>
  );
}
