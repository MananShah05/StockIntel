"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Eye, EyeSlash, CircleNotch, WarningCircle, CheckCircle } from "@phosphor-icons/react";
import { getApiUrl } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Post registration details to backend FastAPI auth endpoint
      const res = await fetch(`${getApiUrl()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Registration failed." }));
        throw new Error(err.detail || "Database registration failed.");
      }

      setSuccessMsg("Account created successfully! Authorizing access...");
      
      // 2. Automate login session upon successful registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password: password,
        callbackUrl: "/",
      });

      if (loginRes?.error) {
        setErrorMsg("Registration succeeded, but login session failed. Please sign in manually.");
        setIsLoading(false);
      } else {
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong during account setup.");
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
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-display font-bold text-[var(--text-primary)]">
            Create Hub Credentials
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 font-medium uppercase tracking-wider">
            Establish secure researcher profile
          </p>
        </div>

        {/* Notices */}
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

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 p-3.5 bg-[oklch(88%_0.14_142_/_0.08)] border border-[oklch(88%_0.14_142_/_0.2)] rounded-xl text-xs text-[var(--text-up)] font-medium">
                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 animate-pulse" />
                <span>{successMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alexander Vance"
              required
              className="w-full bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--text-tertiary)]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. Vance@firm.com"
              required
              className="w-full bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--text-tertiary)]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
              Security Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Establish strong password"
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
            disabled={isLoading || !name.trim() || !email.trim() || !password}
            className="w-full flex items-center justify-center gap-2 bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--border-soft)] disabled:opacity-50 disabled:pointer-events-none transition-all mt-6 shadow-sm active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <CircleNotch className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                <span>Establishing Profile...</span>
              </>
            ) : (
              <span>Register Account</span>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-5 border-t border-[var(--border-soft)] text-center text-xs text-[var(--text-secondary)] font-medium">
          Already have credentials?{" "}
          <Link
            href="/auth/signin"
            className="text-[var(--teal-500)] hover:text-[var(--teal-600)] font-bold hover:underline transition-colors ml-0.5"
          >
            Sign In Here →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
