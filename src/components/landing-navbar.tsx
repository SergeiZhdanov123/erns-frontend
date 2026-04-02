"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ErnsLogo } from "@/components/erns-logo";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/docs", label: "API" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function LandingNavbar() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.7)"]
  );
  const blur = useTransform(scrollY, [0, 80], ["blur(12px)", "blur(20px)"]);
  const shadow = useTransform(
    scrollY,
    [0, 80],
    ["0 0 35px rgba(0,230,118,0.15), 0 0 0 transparent", "0 0 45px rgba(0,230,118,0.22), 0 8px 30px rgba(0,0,0,0.6)"]
  );

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: bg,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          boxShadow: shadow,
        }}
        className="fixed top-4 left-4 right-4 md:left-8 md:right-8 lg:left-16 lg:right-16 z-50 rounded-full border border-white/[0.08] h-12 md:h-14"
      >
        <div className="flex h-full items-center justify-between px-5 md:px-6">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 flex-shrink-0">
            <ErnsLogo size="md" />
          </Link>

          {/* Center nav links - Desktop */}
          <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredLink(link.href)}
                onMouseLeave={() => setHoveredLink(null)}
                className="relative px-4 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
              >
                {hoveredLink === link.href && (
                  <motion.span
                    layoutId="landing-nav-hover"
                    className="absolute inset-0 rounded-full bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side — auth */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="hidden md:block px-3.5 py-1.5 text-[13px] font-medium text-white/60 hover:text-white transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/select-plan">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground hover:shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-shadow"
                >
                  Get Started
                </motion.button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground hover:shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-shadow"
                >
                  Dashboard
                </motion.button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-white/60 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 z-50 rounded-2xl border border-white/[0.08] bg-black/80 backdrop-blur-xl p-4 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-white/[0.06] space-y-2">
                <SignedOut>
                  <div onClick={() => setMobileMenuOpen(false)}>
                    <SignInButton mode="modal">
                      <button className="block w-full px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left">
                        Sign In
                      </button>
                    </SignInButton>
                  </div>
                  <div onClick={() => setMobileMenuOpen(false)}>
                    <SignUpButton mode="modal">
                      <button className="block w-full px-4 py-3 text-sm font-medium text-center text-primary-foreground bg-primary rounded-xl transition-colors">
                        Get Started Free
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-sm font-medium text-center text-primary-foreground bg-primary rounded-xl transition-colors"
                  >
                    Dashboard
                  </Link>
                </SignedIn>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
