"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";

export default function NeonCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      try {
        // 1. Get the session details from Neon Auth
        const response = await authClient.getSession();
        
        if (!active) return;

        if (response.error || !response.data?.session || !response.data?.user) {
          setErrorMsg("Could not retrieve active session from Neon Auth.");
          setTimeout(() => {
            router.push(`/auth/signin?error=NeonAuthFailed`);
          }, 3000);
          return;
        }

        const { session, user } = response.data;
        // Use the token or ID for session validation
        const sessionToken = session.token || session.id;

        // 2. Perform a silent credentials sign-in in NextAuth to establish the server-side session
        const nextAuthRes = await signIn("credentials", {
          redirect: false,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          sessionToken: sessionToken,
          isNeonAuth: "true",
          callbackUrl,
        });

        if (!active) return;

        if (nextAuthRes?.error) {
          setErrorMsg(nextAuthRes.error || "Failed to establish local session.");
          setTimeout(() => {
            router.push(`/auth/signin?error=NeonAuthSyncFailed`);
          }, 3000);
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (err: any) {
        if (!active) return;
        setErrorMsg(err.message || "An unexpected error occurred during authorization.");
        setTimeout(() => {
          router.push(`/auth/signin?error=NeonAuthException`);
        }, 3000);
      }
    }

    handleCallback();

    return () => {
      active = false;
    };
  }, [router, callbackUrl]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-8 select-none">
      {errorMsg ? (
        <div className="flex flex-col items-center max-w-sm">
          <WarningCircle className="h-10 w-10 text-[var(--text-down)] mb-3" />
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">
            Authentication Error
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-4">
            {errorMsg}
          </p>
          <div className="h-1 w-24 bg-[var(--border-soft)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--text-down)] animate-pulse" style={{ width: "100%" }} />
          </div>
          <span className="text-[10px] text-[var(--text-disabled)] mt-2 uppercase tracking-wider font-bold">
            Redirecting to sign in...
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <CircleNotch className="h-8 w-8 animate-spin text-[var(--teal-500)] mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
            Syncing Neon Auth Session...
          </p>
          <span className="text-[9px] text-[var(--text-disabled)] mt-1.5 uppercase tracking-wider font-semibold">
            Establishing secure database context
          </span>
        </div>
      )}
    </div>
  );
}
