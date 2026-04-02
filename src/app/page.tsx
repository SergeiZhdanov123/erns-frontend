"use client";

import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { MarketTape } from "@/components/market-tape";
import { LandingNavbar } from "@/components/landing-navbar";
import { Footer } from "@/components/footer";
import { InteractiveGrid } from "@/components/interactive-grid";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   COUNTER
   ═══════════════════════════════════════════════════════════════ */
function Counter({ value, suffix = "", prefix = "" }: {
  value: number; suffix?: string; prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let s = 0;
    const inc = Math.ceil(value / 40);
    const t = setInterval(() => {
      s += inc;
      if (s >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(s);
    }, 16);
    return () => clearInterval(t);
  }, [isInView, value]);
  return <span ref={ref}>{prefix}{isInView ? display.toLocaleString() : "0"}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   GLOW CARD — cursor-tracking highlight
   ═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   3D TILT CARD
   ═══════════════════════════════════════════════════════════════ */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);
  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateY(0)";
  }, []);
  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleLeave}
      className={`glow-card transition-transform duration-200 ease-out ${className}`} style={{ transformStyle: "preserve-3d" }}
    >{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVEAL
   ═══════════════════════════════════════════════════════════════ */
function Reveal({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════ */
function FaqItem({ question, answer, isOpen, onToggle }: {
  question: string; answer: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle}
      className="w-full text-left p-5 sm:p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-primary/20 transition-all group"
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold transition-colors ${isOpen ? "text-primary" : "text-white/60 group-hover:text-primary"}`}>{question}</span>
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.15 }}
          className="ml-4 flex-shrink-0 w-6 h-6 rounded-full border border-white/[0.08] flex items-center justify-center">
          <svg className="w-3 h-3 text-primary/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="text-white/30 text-sm mt-3 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATA LINES — scrolling behind hero
   ═══════════════════════════════════════════════════════════════ */
function DataLine({ items, speed = 30, direction = 1 }: { items: string[]; speed?: number; direction?: number }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        animate={{ x: direction > 0 ? [0, -50 * items.length] : [-50 * items.length, 0] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        className="inline-flex gap-10 font-mono text-[11px] text-white/[0.12]"
      >
        {doubled.map((item, i) => <span key={i}>{item}</span>)}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGGER
   ═══════════════════════════════════════════════════════════════ */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const staggerChild = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const faqs = [
  { q: "What data does Erns cover?", a: "Real-time SEC filings (10-K, 10-Q, 8-K), earnings announcements, analyst estimates, and market data for 5,000+ US equities." },
  { q: "How fast is the data?", a: "SEC filings are parsed within milliseconds of hitting EDGAR. Market data streams in real-time. Earnings alerts are instant." },
  { q: "Can I use Erns for free?", a: "Yes. Starter is free with a 5-stock watchlist, earnings calendar, and limited screener." },
  { q: "How does the API work?", a: "RESTful endpoints for earnings, filings, screener results, and AI signals. Pro includes 50K calls/month." },
  { q: "What makes Erns different?", a: "Purpose-built for earnings intelligence. AI detects earnings-related patterns and anomalies that general-purpose tools miss." },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.06], [0, 80]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-[#030303] overflow-x-hidden landing-page landing-grid">
      <LandingNavbar />

      {/* ══════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
        <InteractiveGrid />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.02] blur-[100px] pointer-events-none" />

        <div className="absolute top-[18%] left-0 right-0 space-y-4 pointer-events-none z-[1]">
          <DataLine items={["AAPL 232.47 +0.42%", "NVDA 875.28 +1.67%", "MSFT 411.20 -0.23%", "TSLA 248.42 +3.12%", "GOOGL 178.36 +0.89%", "META 612.77 -0.45%", "AMZN 185.07 +1.31%", "JPM 198.45 +0.78%"]} speed={45} />
          <DataLine items={["10-K FILED", "8-K EDGAR ALERT", "EPS BEAT +11.2%", "REVENUE MISS -2.1%", "GUIDANCE RAISED", "INSIDER BUY $2.4M", "SHORT INTEREST ↑12%", "ANALYST UPGRADE"]} speed={38} direction={-1} />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex max-w-4xl flex-col items-center text-center pt-24"
        >
          <motion.div initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.15 }} className="mb-8"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.04] backdrop-blur-md px-4 py-2 text-xs font-mono text-primary/70 tracking-wide">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              REAL-TIME EARNINGS INTELLIGENCE
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4.2rem] font-bold tracking-tight text-white leading-[1.1] max-w-3xl"
          >
            Wall Street doesn&apos;t read faster.
            <br />
            <span className="text-white">They read</span>{" "}
            <span className="text-primary text-glow">smarter.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-7 max-w-lg text-sm sm:text-[15px] text-white/50 leading-relaxed"
          >
            Real-time SEC filings. AI-driven contrarian signals. The same
            earnings intelligence institutions pay $25k/yr for — rebuilt for everyone.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 flex gap-3"
          >
            <Link href="/sign-up">
              <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(0,230,118,0.25)" }} whileTap={{ scale: 0.97 }}
                className="group relative overflow-hidden px-7 py-3 bg-primary text-black text-sm font-semibold rounded-xl transition-all"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </motion.button>
            </Link>
            <Link href="/docs">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-7 py-3 text-white/40 text-sm font-medium rounded-xl border border-white/[0.08] hover:text-white/60 hover:border-white/[0.15] transition-all"
              >View API →</motion.button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="mt-28 pb-24 flex gap-10 sm:gap-14"
          >
            {[
              { value: 5000, suffix: "+", label: "STOCKS" },
              { value: 15000, suffix: "+", label: "FILINGS/DAY" },
              { value: 50, prefix: "<", suffix: "ms", label: "LATENCY" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-lg sm:text-xl font-mono font-semibold text-white/60">
                  <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-[10px] font-mono tracking-[0.15em] text-white/15">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 z-10">
          <MarketTape />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES — 3D Tilt Cards (like pricing page)
          ══════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-28 md:py-36 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.015] blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-4 block">Capabilities</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Built for the <span className="text-primary text-glow">data-obsessed.</span>
              </h2>
              <p className="text-white/40 text-sm max-w-lg mx-auto">
                Every feature engineered for speed, accuracy, and signal clarity.
              </p>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[
              { icon: "📄", title: "SEC Filings", desc: "10-K, 10-Q, 8-K parsed within milliseconds of hitting EDGAR. Full text search, sentiment scoring, section extraction." },
              { icon: "⚡", title: "AI Signals", desc: "DeepSeek models detect contrarian patterns, earnings anomalies, and guidance sentiment shifts before consensus." },
              { icon: "📅", title: "Earnings Calendar", desc: "5,000+ stocks with BMO/AMC timing, historical beat rates, EPS surprise tracking, and estimate revisions." },
              { icon: "🔍", title: "Advanced Screener", desc: "Filter by earnings surprise, revenue acceleration, margin expansion, guidance changes, and custom criteria." },
              { icon: "⌨️", title: "Developer API", desc: "RESTful endpoints and WebSocket feeds. Access filings, earnings data, quotes, and AI signals programmatically." },
              { icon: "📡", title: "Live Monitoring", desc: "24/7 workers scrape IR pages during earnings season. Alerts the second results drop — before the wire." },
            ].map((item) => (
              <motion.div key={item.title} variants={staggerChild}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
              >
                <TiltCard className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7 group hover:border-primary/20 transition-colors">
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg mb-5 group-hover:border-primary/20 group-hover:bg-primary/[0.06] transition-colors">
                      {item.icon}
                    </div>
                    <h3 className="text-base font-semibold text-white/80 mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-white/25 leading-relaxed group-hover:text-white/35 transition-colors">{item.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TERMINAL PREVIEW
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/[0.02] blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-14">
              <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-4 block">Live Preview</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Your terminal. <span className="text-primary text-glow">Your edge.</span>
              </h2>
              <p className="text-white/40 text-sm max-w-lg mx-auto">
                A dashboard built for institutional speed and clarity.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="rounded-2xl border border-white/[0.06] bg-[#060606] overflow-hidden shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a] border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="ml-3 text-[10px] text-white/15 font-mono">erns://dashboard — live</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  <span className="text-[9px] text-primary/50 font-mono">LIVE</span>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="grid grid-cols-3 gap-px bg-white/[0.04] rounded-lg overflow-hidden mb-5">
                  {[
                    { label: "S&P 500", value: "6,025.99", change: "+0.42%", up: true },
                    { label: "NASDAQ", value: "19,643.86", change: "+0.67%", up: true },
                    { label: "VIX", value: "14.23", change: "-3.12%", up: false },
                  ].map((idx, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                      className="bg-[#080808] p-4"
                    >
                      <p className="text-[10px] text-white/20 font-mono mb-1">{idx.label}</p>
                      <p className="text-lg font-bold text-white/80 font-mono">{idx.value}</p>
                      <p className={`text-xs font-mono mt-0.5 ${idx.up ? "text-primary/70" : "text-red-400/70"}`}>{idx.change}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="h-32 sm:h-40 rounded-lg bg-[#080808] border border-white/[0.03] overflow-hidden mb-5"
                >
                  <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0,230,118,0.12)" />
                        <stop offset="100%" stopColor="rgba(0,230,118,0)" />
                      </linearGradient>
                    </defs>
                    <motion.path d="M0,130 C50,115 100,125 150,100 C200,75 250,85 300,60 C350,40 400,50 450,35 C500,22 550,30 600,18 C650,25 700,12 750,22 L800,18 L800,160 L0,160 Z"
                      fill="url(#cg)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }} />
                    <motion.path d="M0,130 C50,115 100,125 150,100 C200,75 250,85 300,60 C350,40 400,50 450,35 C500,22 550,30 600,18 C650,25 700,12 750,22 L800,18"
                      fill="none" stroke="rgba(0,230,118,0.6)" strokeWidth="1.5"
                      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }} />
                  </svg>
                </motion.div>

                <div className="space-y-1.5">
                  {[
                    { ticker: "NVDA", type: "BEAT", detail: "EPS $5.16 vs $4.64 est (+11.2%)", time: "2m", color: "text-primary/60 bg-primary/[0.08]" },
                    { ticker: "AAPL", type: "FILING", detail: "10-Q filed — revenue guidance raised", time: "8m", color: "text-blue-400/60 bg-blue-400/[0.08]" },
                    { ticker: "TSLA", type: "VOLUME", detail: "3.2x average volume detected", time: "15m", color: "text-amber-400/60 bg-amber-400/[0.08]" },
                  ].map((alert, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.015] hover:bg-white/[0.03] transition-colors font-mono text-[11px]"
                    >
                      <span className="text-primary/60 font-semibold w-10">{alert.ticker}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${alert.color}`}>{alert.type}</span>
                      <span className="text-white/20 flex-1 truncate">{alert.detail}</span>
                      <span className="text-white/10">{alert.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — Vertical timeline with animated line
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-4 block">How It Works</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Three steps. <span className="text-primary">One edge.</span>
              </h2>
            </div>
          </Reveal>

          <div className="relative">
            {/* Animated vertical line */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute left-5 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent origin-top hidden sm:block"
            />

            <div className="space-y-10 sm:space-y-16">
              {[
                { step: "01", title: "Connect", description: "Create an account and build a watchlist. We begin monitoring every filing, every signal, every move — immediately.", delay: 0 },
                { step: "02", title: "Analyze", description: "AI processes each SEC filing in real-time. Key metrics extracted. Sentiment scored. Anomalies surfaced automatically.", delay: 0.15 },
                { step: "03", title: "Execute", description: "Receive instant alerts with actionable signals. React to market-moving information before consensus catches on.", delay: 0.3 },
              ].map((item, i) => (
                <Reveal key={i} delay={item.delay}>
                  <div className="flex gap-6 sm:gap-10 items-start group">
                    {/* Dot */}
                    <div className="relative flex-shrink-0">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: item.delay + 0.2, type: "spring", stiffness: 300, damping: 15 }}
                        className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary/[0.06] border border-primary/20 flex items-center justify-center group-hover:bg-primary/[0.12] group-hover:border-primary/40 transition-colors"
                      >
                        <span className="font-mono text-xs md:text-sm text-primary/60 font-bold">{item.step}</span>
                      </motion.div>
                    </div>
                    <div className="pt-1">
                      <h3 className="text-xl md:text-2xl font-bold text-white/80 mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-sm text-white/25 leading-relaxed max-w-md group-hover:text-white/35 transition-colors">{item.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BUILT FOR — Staggered offset cards
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] rounded-full bg-primary/[0.015] blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-4 block">Built For</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                For every <span className="text-primary">edge case.</span>
              </h2>
              <p className="text-white/25 text-sm max-w-lg mx-auto">
                Whether you trade earnings, build algos, or manage a book.
              </p>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-5"
          >
            {[
              { title: "Earnings Traders", description: "Track every announcement across 5,000+ stocks. Beat/miss data, EPS surprise history, post-earnings price action.", tags: ["Calendar", "Surprises", "Movers"] },
              { title: "Quant / Algo", description: "Build custom strategies on our API. Access SEC filings, market data, and AI signals programmatically.", tags: ["REST API", "WebSocket", "Historical"] },
              { title: "Fundamental Analysts", description: "Screen by revenue growth, margin expansion, guidance changes, analyst sentiment revisions.", tags: ["Screener", "Guidance", "Analysts"] },
              { title: "Portfolio Managers", description: "Monitor holdings with instant filing alerts, watchlist signals, and curated financial news.", tags: ["Watchlist", "Alerts", "News"] },
            ].map((persona, i) => (
              <motion.div key={i} variants={staggerChild}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <GlowCard className="h-full p-6 sm:p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/20 transition-all duration-300 group">
                  <div className="relative z-10">
                    <h3 className="text-base font-semibold text-white/70 mb-2 group-hover:text-primary transition-colors">{persona.title}</h3>
                    <p className="text-sm text-white/20 leading-relaxed mb-4 group-hover:text-white/30 transition-colors">{persona.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.tags.map((tag, j) => (
                        <span key={j} className="font-mono text-[10px] text-white/15 border border-white/[0.06] px-2 py-0.5 rounded group-hover:border-primary/15 group-hover:text-primary/30 transition-colors">{tag}</span>
                      ))}
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING — 3D Tilt Cards (like /pricing page)
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-4 block">Pricing</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Transparent <span className="text-primary text-glow">pricing.</span>
              </h2>
              <p className="text-white/40 text-sm max-w-lg mx-auto">
                Start free. Scale when ready. No surprises.
              </p>
            </div>
          </Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5 md:gap-6"
          >
            {[
              { name: "Starter", price: "Free", period: "", features: ["5 watchlist stocks", "Basic earnings calendar", "Limited screener", "Community support"], cta: "Start Free", popular: false },
              { name: "Pro", price: "$10", period: "/mo", features: ["Unlimited watchlist", "AI-powered signals", "Advanced screener", "50K API calls/mo", "Real-time SEC alerts", "Priority support"], cta: "Start Trial", popular: true },
              { name: "Enterprise", price: "$299", period: "/mo", features: ["Everything in Pro", "Unlimited API calls", "Custom signal models", "Dedicated support", "SLA guarantees", "Team management"], cta: "Contact Sales", popular: false },
            ].map((plan) => (
              <motion.div key={plan.name} variants={staggerChild}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <TiltCard className={`relative rounded-2xl border p-6 sm:p-8 h-full flex flex-col ${plan.popular
                    ? "border-primary/30 bg-gradient-to-b from-primary/[0.08] to-transparent shadow-[0_0_60px_-10px_rgba(0,230,118,0.15)] gradient-border"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black text-xs font-bold rounded-full shadow-lg shadow-primary/25">
                      Most Popular
                    </div>
                  )}
                  <div className="relative z-10 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <div className="mb-5">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/30">{plan.period}</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-white/35">
                          <svg className="w-4 h-4 text-primary/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/sign-up">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular
                            ? "bg-primary text-black hover:shadow-[0_0_30px_rgba(0,230,118,0.4)]"
                            : "border border-white/[0.08] text-white/50 hover:text-white/70 hover:border-primary/30 hover:bg-white/[0.04]"
                          }`}
                      >{plan.cta}</motion.button>
                    </Link>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ — Card accordion (like pricing page)
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-4 block">FAQ</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Common Questions</h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <FaqItem question={faq.q} answer={faq.a}
                  isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none" />
        <Reveal>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Stop reacting.<br />
              <span className="text-white/50">Start anticipating.</span>
            </h2>
            <p className="text-white/20 text-sm mb-10">
              14-day free trial. No credit card required.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 60px rgba(0,230,118,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden px-10 py-4 bg-primary text-black font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(0,230,118,0.3)]"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative z-10 flex items-center gap-2">
                    Launch Terminal
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </motion.button>
              </Link>
              <Link href="/pricing">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 border border-white/[0.08] text-white/40 font-semibold rounded-xl hover:text-white/60 hover:border-white/[0.15] transition-all"
                >View Plans</motion.button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}