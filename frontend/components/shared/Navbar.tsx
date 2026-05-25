"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWatchlist } from "@/hooks/useWatchlist";
import { TrendUp, FolderSimple, Scales, SignOut, SignIn, User as UserIcon } from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { watchlist } = useWatchlist();
  
  const { data: session, status } = useSession();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Do not render the dashboard navbar for guests or during initial session loading
  if (status !== "authenticated") {
    return null;
  }
  
  const links = [
    { href: "/", label: "Intelligence Hub", icon: TrendUp },
    { href: "/compare", label: "Signal Compare", icon: Scales },
    { href: "/watchlist", label: "My Watchlist", icon: FolderSimple, badge: watchlist.length },
  ];

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        borderBottom: '1px solid var(--border-soft)',
        background: 'var(--bg-elevated)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Stock<span style={{ color: 'var(--teal-500)' }}>Intel</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 ml-6">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: isActive ? 'var(--bg-sunken)' : 'transparent',
                  transitionProperty: 'color, background-color',
                  transitionDuration: '150ms',
                }}
              >
                <Icon
                  size={18}
                  weight={isActive ? "fill" : "regular"}
                  style={{ color: isActive ? 'var(--teal-500)' : 'var(--text-disabled)' }}
                />
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{
                      background: 'var(--teal-100)',
                      color: 'var(--teal-700)',
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Status indicator */}
        <div
          className="hidden lg:flex items-center text-xs font-semibold px-3 py-1.5 rounded-md select-none"
          style={{
            border: '1px solid var(--border-soft)',
            color: 'var(--text-tertiary)',
            background: 'var(--bg-surface)',
          }}
        >
          <span
            className="h-2 w-2 rounded-full mr-2 animate-pulse"
            style={{ background: 'var(--positive)' }}
          />
          Decision Engine Online
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Authentication controls */}
        {status === "authenticated" && session ? (
          <div ref={dropdownRef} className="relative z-50">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-full font-display font-bold text-sm border border-[var(--teal-200)] bg-[var(--teal-50)] text-[var(--teal-700)] shadow-sm cursor-pointer hover:border-[var(--teal-400)] transition-all active:scale-[0.96] p-2"
            >
              {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-56 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-lg p-2 flex flex-col gap-1 z-50">
                <div className="px-3.5 py-3 border-b border-[var(--border-soft)] mb-1 flex flex-col gap-0.5">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{session.user?.name}</p>
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] truncate">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[var(--text-down)] hover:bg-[oklch(82%_0.19_29_/_0.06)] transition-all select-none"
                >
                  <SignOut className="h-4.5 w-4.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          status === "unauthenticated" && (
            <Link
              href="/auth/signin"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--bg-sunken)] border border-[var(--border-soft)] px-4 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--border-soft)] transition-all shadow-sm active:scale-[0.98] select-none"
            >
              <SignIn className="h-4 w-4 text-[var(--teal-500)]" />
              <span>Sign In</span>
            </Link>
          )
        )}
      </div>
    </header>
  );
}
