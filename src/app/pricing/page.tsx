"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing-navbar";
import { Footer } from "@/components/footer";

/* ── Reveal ── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay }} className={className}
    >{children}</motion.div>
  );
}

/* ── 3D Tilt Card — cursor-tracking perspective with glow ── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);
  const handleMouseLeave = useCallback(() => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateY(0)";
  }, []);
  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      className={`glow-card transition-transform duration-200 ease-out ${className}`} style={{ transformStyle: "preserve-3d" }}
    >{children}</div>
  );
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const staggerChild = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individual traders getting started",
    features: ["5 stocks in watchlist", "Basic SEC filing alerts", "Earnings calendar", "No API access", "Community support"],
    cta: "Get Started",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Pro",
    price: "$10",
    period: "/month",
    description: "For serious traders who need an edge",
    features: ["Unlimited watchlist", "Real-time SEC filing alerts", "AI-powered signals", "Advanced screener filters", "50,000 API calls/month", "Priority support", "Historical data access"],
    cta: "Start Free Trial",
    href: "/sign-up?plan=pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    description: "For funds and professional traders",
    features: ["Everything in Pro", "Unlimited API calls", "Custom signal models", "Dedicated support", "SLA guarantees", "Team management", "SSO authentication", "Custom integrations"],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
];

const faqs = [
  { q: "What's included in the free trial?", a: "You get full access to Pro features for 14 days, no credit card required. Cancel anytime." },
  { q: "How does the API work?", a: "RESTful API with WebSocket support. Access SEC filings, earnings data, and signals programmatically." },
  { q: "Can I switch plans later?", a: "Yes, upgrade or downgrade anytime. Changes take effect immediately with prorated billing." },
  { q: "Is my data secure?", a: "Your data is encrypted in transit and at rest. We never share or sell your data." },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-[#030303] landing-page landing-grid">
      <LandingNavbar />

      {/* Header */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 relative z-10">
        <Reveal>
          <div className="max-w-4xl mx-auto text-center">
            <span className="font-mono text-[10px] text-primary/50 tracking-[0.2em] uppercase mb-4 block">Pricing</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5">
              Simple, Transparent <span className="text-primary text-glow">Pricing</span>
            </h1>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              Start free and scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Plans — 3D tilt cards */}
      <section className="pb-24 px-6 relative z-10">
        {/* Ambient glow behind pricing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px] pointer-events-none" />

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5 md:gap-6 relative z-10"
        >
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={staggerChild}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <TiltCard className={`relative rounded-2xl border p-6 sm:p-8 h-full flex flex-col ${
                plan.popular
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
                  <p className="text-white/50 text-sm mb-5">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/30">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-white/50">
                        <svg className="w-4 h-4 text-primary/50 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                        plan.popular
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
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-white/[0.04] relative z-10">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-5 sm:p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold text-sm sm:text-base transition-colors ${openFaq === i ? "text-primary" : "text-white group-hover:text-primary"}`}>{faq.q}</h4>
                    <motion.div animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: 0.15 }}
                      className="ml-4 flex-shrink-0 w-6 h-6 rounded-full border border-white/[0.08] flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-primary/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <p className="text-white/30 text-sm mt-3 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/[0.04] relative z-10">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-white/50 mb-8">
              Start your 14-day free trial today. No credit card required.
            </p>
            <Link href="/sign-up">
              <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 60px rgba(0,230,118,0.4)" }} whileTap={{ scale: 0.97 }}
                className="px-10 py-4 bg-primary text-black rounded-xl font-semibold transition-all shadow-[0_0_30px_-5px_rgba(0,230,118,0.3)]"
              >
                Start Free Trial
              </motion.button>
            </Link>
          </div>
        </Reveal>
      </section>

      <div className="relative z-10"><Footer /></div>
    </main>
  );
}
