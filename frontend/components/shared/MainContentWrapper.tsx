"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Disclaimer } from "@/components/shared/Disclaimer";

interface MainContentWrapperProps {
  children: React.ReactNode;
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // If loading session, show centered loading screen
  if (status === "loading") {
    return (
      <main className="flex-1 w-full flex flex-col items-center justify-center min-h-[70vh] text-center p-8 select-none">
        <div className="h-8 w-8 rounded-full border-[3px] border-[var(--border-soft)] border-t-[var(--teal-500)] animate-spin mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          Verifying Security Access...
        </p>
      </main>
    );
  }

  // Determine if it is a public/unauthenticated landing or auth screen
  const isPublicPage = status !== "authenticated" || pathname?.startsWith("/auth");

  if (isPublicPage) {
    return (
      <main className="flex-1 w-full">
        {children}
      </main>
    );
  }

  // Centered grid container for active dashboard researchers
  return (
    <>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Disclaimer />
    </>
  );
}
