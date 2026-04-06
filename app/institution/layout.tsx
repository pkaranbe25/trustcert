"use client";

import React, { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Building2, 
  LayoutDashboard, 
  FilePlus, 
  Award, 
  BarChart3, 
  Settings, 
  LogOut, 
  Clock,
  User
} from "lucide-react";
import Link from "next/link";
import { InstitutionProvider, useInstitution } from "@/lib/context/InstitutionContext";
import DashboardSkeleton from "@/components/shared/DashboardSkeleton";
import InstitutionSwitcher from "@/components/shared/InstitutionSwitcher";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && session.user.role !== "institution") {
      router.push("/student/portal");
    }
  }, [status, session, router]);

  if (status === "loading") return <DashboardSkeleton />;
  if (!session || session.user.role !== "institution") return null;

  return (
    <InstitutionProvider>
      <div className="flex min-h-screen bg-[#020d0a] selection:bg-indigo-500/30">
        <Sidebar session={session} />
        <main className="flex-1 flex flex-col relative z-10">
          <div className="absolute inset-0 bg-dot-grid opacity-50 pointer-events-none" />
          <div className="relative flex-1 p-8 md:p-12 overflow-y-auto">
             {children}
          </div>
        </main>
      </div>
    </InstitutionProvider>
  );
}

function Sidebar({ session }: { session: any }) {
  const pathname = usePathname();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/institution/dashboard", color: "indigo" },
    { label: "Issue Certificate", icon: FilePlus, href: "/institution/issue", color: "violet" },
    { label: "Certificates", icon: Award, href: "/institution/certificates", color: "fuchsia" },
    { label: "Analytics", icon: BarChart3, href: "/institution/analytics", color: "amber" },
    { label: "Settings", icon: Settings, href: "/institution/settings/account", color: "slate" },
  ];

  const colors: Record<string, string> = {
    indigo: "hover:text-indigo-400 group-hover:bg-indigo-500/10 text-indigo-400 border-indigo-500",
    violet: "hover:text-violet-400 group-hover:bg-violet-500/10 text-violet-400 border-violet-500",
    fuchsia: "hover:text-fuchsia-400 group-hover:bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500",
    amber: "hover:text-amber-400 group-hover:bg-amber-500/10 text-amber-400 border-amber-500",
    slate: "hover:text-slate-400 group-hover:bg-slate-500/10 text-slate-400 border-slate-500",
  };

  return (
    <aside className="w-64 bg-[#0a1a14] border-r border-white/5 flex flex-col h-screen sticky top-0 z-50 shrink-0">
      {/* Logo Section */}
      <div className="p-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
             <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-xl font-black gradient-text">TrustCert</span>
        </Link>
      </div>

      {/* Institution Switcher Section */}
      <div className="px-6 mb-8">
        <InstitutionSwitcher />
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative",
                isActive ? colors[item.color] + " bg-white/5" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} className={cn("transition-colors", isActive ? "text-current" : "text-muted-foreground group-hover:text-white")} />
              {item.label}
              {isActive && (
                <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-full", "bg-current")} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Section */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
             <User size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{session.user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate italic">Last login: {formatDistanceToNow(new Date(session.user.lastLogin || Date.now()))} ago</p>
          </div>
        </div>
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function ShieldCheck({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
