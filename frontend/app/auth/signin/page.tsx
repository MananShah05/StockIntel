"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Eye, EyeSlash, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const nextAuthError = searchParams.get("error");

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg(null);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/auth/neon-callback?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate Google Sign-in.");
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    nextAuthError === "CredentialsSignin" ? "Incorrect email address or password." :
    nextAuthError === "NeonAuthFailed" ? "Verification with Neon Auth service failed. Try again." :
    nextAuthError === "NeonAuthSyncFailed" ? "Syncing Google account to our records failed." :
    nextAuthError === "NeonAuthException" ? "An unexpected error occurred during external verification." :
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password: password,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMsg(res.error || "Incorrect email address or password.");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[420px] bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-8 shadow-lg"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[oklch(88%_0.14_142_/_0.1)] border border-[oklch(88%_0.14_142_/_0.2)] mb-4 text-[var(--text-up)]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-display font-bold text-[var(--text-primary)]">
            Welcome back to StockIntel
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 font-medium uppercase tracking-wider">
            Decision support system gateway
          </p>
        </div>

        {/* Error Notices */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 p-3.5 bg-[oklch(82%_0.19_29_/_0.08)] border border-[oklch(82%_0.19_29_/_0.2)] rounded-xl text-xs text-[var(--text-down)] font-medium">
                <WarningCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Sign-in with Neon Auth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-[var(--bg-sunken)] border border-[var(--border-soft)] hover:bg-[var(--border-soft)] rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] transition-all shadow-sm active:scale-[0.99] mb-5"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.05,-1.2 -0.13,-1.7z" fill="#4285F4" />
            <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.97 -3.3,0.97c-2.34,0 -4.33,-1.58 -5.04,-3.71H2.89v2.66c1.49,2.96 4.54,4.84 8.04,4.84z" fill="#34A853" />
            <path d="M6.96,13.1c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.04H2.89C2.28,8.27 1.93,9.66 1.93,11.1c0,1.44 0.35,2.83 0.96,4.06l3.11,-2.42c-0.18,-0.54 -0.04,-1.54 0.96,0.36z" fill="#FBBC05" />
            <path d="M12,5.21c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.54 14.43,1.6 12,1.6c-3.5,0 -6.55,1.88 -8.04,4.84l3.11,2.42c0.71,-2.13 2.7,-3.71 5.04,-3.71z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-disabled)] select-none">
            or use credentials
          </span>
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. analyst@firm.com"
              required
              className="w-full bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--text-tertiary)]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
                Security Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                required
                className="w-full bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl pl-4 pr-11 py-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--text-tertiary)]/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                {showPassword ? (
                  <EyeSlash className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password}
            className="w-full flex items-center justify-center gap-2 bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--border-soft)] disabled:opacity-50 disabled:pointer-events-none transition-all mt-6 shadow-sm active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <CircleNotch className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                <span>Authorizing Account...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-5 border-t border-[var(--border-soft)] text-center text-xs text-[var(--text-secondary)] font-medium">
          New to the research hub?{" "}
          <Link
            href="/auth/signup"
            className="text-[var(--teal-500)] hover:text-[var(--teal-600)] font-bold hover:underline transition-colors ml-0.5"
          >
            Create Credentials →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
