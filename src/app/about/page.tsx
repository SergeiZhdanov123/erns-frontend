"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing-navbar";
import { Footer } from "@/components/footer";

/* ── GlowCard ── */
function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    c.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  }, []);
  return <div ref={ref} onMouseMove={handleMouseMove} className={`glow-card ${className}`}>{children}</div>;
}

/* ── Reveal ── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay }} className={className}
    >{children}</motion.div>
  );
}

/* ── Animated Stat ── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    const numMatch = value.match(/[\d,]+/);
    if (!numMatch) { setDisplay(value); return; }
    const target = parseInt(numMatch[0].replace(/,/g, ""));
    const prefix = value.substring(0, value.indexOf(numMatch[0]));
    const suffix = value.substring(value.indexOf(numMatch[0]) + numMatch[0].length);
    let current = 0;
    const inc = Math.ceil(target / 35);
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setDisplay(value); clearInterval(timer); }
      else setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center p-5">
      <p className="text-xl font-bold text-white font-mono mb-1">{inView ? display : "—"}</p>
      <p className="text-[10px] font-mono tracking-widest text-white/15 uppercase">{label}</p>
    </div>
  );
}

const values = [
  { icon: "⚡", title: "Speed is Alpha", description: "Every feature optimized for speed — from sub-50ms data latency to instant SEC filing parsing. Milliseconds matter." },
  { icon: "🎯", title: "Signal Over Noise", description: "Our AI surfaces what moves markets. No data overload — just the signals that matter, when they matter." },
  { icon: "🔓", title: "Democratize Access", description: "Institutional-grade intelligence shouldn't cost $25k/yr. We make Wall Street tools accessible to every trader." },
  { icon: "🛡️", title: "Trust & Transparency", description: "Your data is yours. We never sell personal information. Our AI models explain their reasoning — no black boxes." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#030303] landing-page landing-grid">
      <LandingNavbar />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 relative z-10">
        <Reveal>
          <div className="max-w-5xl mx-auto">
            <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-3 block">About Erns</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-xl leading-tight">
              Building the future of{" "}
              <span className="text-primary text-glow">earnings intelligence.</span>
            </h1>
            <p className="text-white/50 text-sm max-w-lg leading-relaxed">
              Founded on a simple belief: every trader deserves the same intelligence
              that institutional investors use to gain an edge.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Mission + Stats */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.04] relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <Reveal>
              <div>
                <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-3 block">Our Mission</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Level the playing field.</h2>
                <div className="space-y-4 text-sm text-white/50 leading-relaxed">
                  <p>
                    For decades, institutional investors had access to real-time SEC
                    filing analysis, earnings intelligence, and AI-powered trading signals
                    — tools that cost tens of thousands of dollars per year.
                  </p>
                  <p>
                    Erns changes that. We parse every filing the moment it hits EDGAR,
                    run AI analysis to detect sentiment and surprises, and deliver
                    actionable signals — at a price any serious trader can afford.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
                {[
                  { value: "5,000+", label: "Stocks" },
                  { value: "15,000+", label: "Filings/Day" },
                  { value: "<50ms", label: "Latency" },
                  { value: "24/7", label: "Monitoring" },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#060606]">
                    <AnimatedStat value={stat.value} label={stat.label} />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values — 2x2 grid with GlowCards */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.04] relative z-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-3 block">Our Values</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">What drives us.</h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {values.map((val, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <GlowCard className="bg-[#060606] p-6 sm:p-8 h-full group hover:bg-[#0a0a0a] transition-all duration-300">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-sm group-hover:border-primary/20 group-hover:bg-primary/[0.05] transition-colors">
                        {val.icon}
                      </div>
                      <h3 className="text-base font-semibold text-white group-hover:text-primary transition-colors">{val.title}</h3>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed group-hover:text-white transition-colors">{val.description}</p>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/[0.04] relative z-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to trade with an edge?</h2>
            <p className="text-white/25 text-sm mb-8">14-day free trial. No credit card required.</p>
            <Link href="/sign-up">
              <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 50px rgba(0,230,118,0.3)" }} whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-primary text-black rounded-lg font-semibold text-sm transition-all"
              >
                Get Started Free →
              </motion.button>
            </Link>
          </div>
        </Reveal>
      </section>

      <div className="relative z-10"><Footer /></div>
    </main>
  );
}
