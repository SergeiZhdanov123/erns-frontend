"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={`glow-card ${className}`}>
      {children}
    </div>
  );
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

const features = [
  {
    title: "Stock Screener",
    description: "Filter thousands of stocks with advanced criteria including fundamentals, technicals, and custom indicators.",
    details: "Our proprietary screener processes over 150 datapoints across 5,000+ US equities. Filter dynamically by upcoming earnings dates, relative volume surges, and DeepSeek AI sentiment scores.",
    icon: "📊",
    span: "lg:col-span-2",
  },
  {
    title: "Earnings Calendar",
    description: "Never miss an earnings announcement. Track estimates, surprises, and historical performance.",
    details: "Navigate earnings season with confidence. The integrated calendar aggregates BMO/AMC drop times from multiple institutional sources.",
    icon: "📅",
    span: "",
  },
  {
    title: "AI Trading Signals",
    description: "Machine learning models analyze SEC filings, options flow, and insider activity.",
    details: "Our intelligence engine instantly parses raw SEC and press release texts using DeepSeek AI models to gauge immediate institutional sentiment.",
    icon: "⚡",
    span: "",
  },
  {
    title: "SEC Filings",
    description: "Real-time access to 10-K, 10-Q, 8-K, and 13F filings with sub-50ms latency.",
    details: "Bypass the clunky EDGAR interface. Get instantly alerted and view cleanly parsed reports seconds after they cross the wire.",
    icon: "📄",
    span: "lg:col-span-2",
  },
  {
    title: "Watchlist & Alerts",
    description: "Track your favorite stocks and get notified on filings, earnings, and anomalies.",
    details: "Our 24/7 background worker continually monitors the IR hubs of your watchlist. Instant email alerts when events drop.",
    icon: "🔔",
    span: "",
  },
  {
    title: "Developer API",
    description: "RESTful API and WebSocket feeds for programmatic access to all data and signals.",
    details: "Integrate Erns directly into your stack. Create API keys from your dashboard to stream enterprise-grade endpoints.",
    icon: "⌨️",
    span: "",
  },
];

type Feature = (typeof features)[0];

export default function FeaturesPage() {
  const [selected, setSelected] = useState<Feature | null>(null);

  return (
    <main className="min-h-screen bg-[#030303] landing-page landing-grid">
      <div className="landing-page-lines" />
      <LandingNavbar />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-20 px-6 relative z-10">
        <Reveal>
          <div className="max-w-5xl mx-auto">
            <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-3 block">Platform Features</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-xl">
              Powerful features.<br />
              <span className="text-primary text-glow">Zero noise.</span>
            </h1>
            <p className="text-white/50 text-sm max-w-lg leading-relaxed">
              Everything you need to gain an edge. Real-time data, AI-powered signals, and institutional-grade tools.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Feature grid — 3-box pattern */}
      <section className="pb-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Top row */}
          <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden mb-px">
            {features.slice(0, 3).map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.06}>
                <GlowCard className={`bg-[#060606] p-6 sm:p-8 h-full group hover:bg-[#0a0a0a] transition-all duration-300 cursor-pointer`}>
                  <div className="relative z-10 flex flex-col h-full" onClick={() => setSelected(feature)}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-sm group-hover:border-primary/20 group-hover:bg-primary/[0.05] transition-colors">
                        {feature.icon}
                      </div>
                      <h3 className="text-base font-semibold text-white group-hover:text-primary transition-colors">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed group-hover:text-white transition-colors flex-1 mb-4">{feature.description}</p>
                    <span className="text-[11px] text-white/15 group-hover:text-primary/40 transition-colors font-mono">
                      Learn more →
                    </span>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
          {/* Bottom row */}
          <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {features.slice(3, 6).map((feature, i) => (
              <Reveal key={feature.title} delay={0.2 + i * 0.06}>
                <GlowCard className={`bg-[#060606] p-6 sm:p-8 h-full group hover:bg-[#0a0a0a] transition-all duration-300 cursor-pointer`}>
                  <div className="relative z-10 flex flex-col h-full" onClick={() => setSelected(feature)}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-sm group-hover:border-primary/20 group-hover:bg-primary/[0.05] transition-colors">
                        {feature.icon}
                      </div>
                      <h3 className="text-base font-semibold text-white group-hover:text-primary transition-colors">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed group-hover:text-white transition-colors flex-1 mb-4">{feature.description}</p>
                    <span className="text-[11px] text-white/15 group-hover:text-primary/40 transition-colors font-mono">
                      Learn more →
                    </span>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/[0.04] relative z-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-white/25 text-sm mb-8">
              14-day free trial. No credit card required.
            </p>
            <Link href="/sign-up">
              <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 50px rgba(0,230,118,0.3)" }} whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-primary text-black rounded-lg font-semibold text-sm transition-all"
              >
                Start Free Trial
              </motion.button>
            </Link>
          </div>
        </Reveal>
      </section>

      <div className="relative z-10"><Footer /></div>

      {/* Feature Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl overflow-hidden max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-primary/[0.06] border border-primary/20 flex items-center justify-center text-sm">
                    {selected.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">{selected.title}</h3>
                </div>
                <p className="text-white/30 leading-relaxed text-sm mb-6">{selected.details}</p>
                <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.06]">
                  <button onClick={() => setSelected(null)}
                    className="px-4 py-2 text-white/30 hover:text-white/50 transition-colors text-sm font-medium"
                  >Close</button>
                  <Link href="/sign-up">
                    <button className="px-4 py-2 bg-primary text-black rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
                      Start Free Trial
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
