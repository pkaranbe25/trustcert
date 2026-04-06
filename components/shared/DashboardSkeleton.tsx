"use client";

import React from "react";
import { Skeleton, SkeletonText, SkeletonAvatar } from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#020d0a]">
      {/* Sidebar Skeleton */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8 shrink-0">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonAvatar size={20} />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
          <SkeletonAvatar size={36} />
          <SkeletonText lines={2} className="w-24" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-10 space-y-10">
        <header className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 border border-white/5 rounded-2xl bg-white/[0.02] space-y-4">
              <SkeletonAvatar size={32} />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Large Chart Area */}
        <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02] space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>

        {/* Table Area */}
        <div className="p-6 border border-white/5 rounded-3xl bg-white/[0.02] space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex gap-4">
                   <SkeletonAvatar size={32} />
                   <SkeletonText lines={1} className="w-48" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
