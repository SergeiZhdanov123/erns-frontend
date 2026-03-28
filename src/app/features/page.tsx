"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const features = [
    {
        title: "Stock Screener",
        description: "Filter thousands of stocks with advanced criteria including fundamentals, technicals, and custom indicators.",
        details: "Our proprietary screener processes over 150 datapoints across 5,000+ US equities. Filter dynamically by upcoming earnings dates, relative volume surges, and DeepSeek AI sentiment scores to instantly find asymmetric setups before the market reacts.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
        ),
        visual: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Earnings Calendar",
        description: "Never miss an earnings announcement. Track estimates, surprises, and historical performance.",
        details: "Navigate earnings season with confidence. The integrated calendar aggregates BMO/AMC drop times from multiple institutional sources, allowing you to track expected vs. historical surprises, forward guidance revisions, and post-market movers.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
        ),
        visual: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "AI Trading Signals",
        description: "Machine learning models analyze SEC filings, options flow, and insider activity to generate actionable signals.",
        details: "Our intelligence engine instantly parses raw SEC and press release texts using DeepSeek AI models to gauge immediate institutional sentiment. Stop waiting on legacy analyst upgrades and trade directly off the source truth.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        visual: "https://images.unsplash.com/photo-1620912189868-30778f9024c5?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "SEC Filings",
        description: "Real-time access to 10-K, 10-Q, 8-K, and 13F filings with sub-50ms latency.",
        details: "Bypass the clunky EDGAR interface. Get instantly alerted and view cleanly parsed 8-K and 10-K reports seconds after they cross the wire. Time is your greatest edge when trading volatility events.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        visual: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Watchlist & Alerts",
        description: "Track your favorite stocks and get notified when they hit your price targets or trigger signals.",
        details: "Our 24/7 background worker continually monitors the Investor Relation hubs of your bookmarked watchlists. The second an earnings event or press release drops, you'll get an unmissable email alert directly in your inbox.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
        ),
        visual: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=800",
    },
    {
        title: "Developer API",
        description: "RESTful API and WebSocket feeds for programmatic access to all our data and signals.",
        details: "Integrate Erns directly into your existing command center. Create and manage granular API keys from your dashboard to stream enterprise-grade aggregated financial endpoints directly to your custom bot or trading script.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
        ),
        visual: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
    },
];

type FeatureDef = typeof features[0];

export default function FeaturesPage() {
    const [selectedFeature, setSelectedFeature] = useState<FeatureDef | null>(null);

    return (
        <main className="min-h-screen bg-background relative">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-16 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-4">
                        Powerful <span className="text-primary">Features</span>
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Everything you need to gain an edge in the market. Real-time data, AI-powered signals, and institutional-grade tools.
                    </p>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="pb-24 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-6 bg-surface border border-border rounded-xl hover:border-primary/30 transition-all flex flex-col items-start"
                        >
                            <div className="w-14 h-14 mb-4 rounded-xl bg-primary-dim/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-text-main mb-2">{feature.title}</h3>
                            <p className="text-text-muted text-sm mb-6 flex-1">{feature.description}</p>
                            
                            <button
                                onClick={() => setSelectedFeature(feature)}
                                className="px-4 py-2 border border-border rounded-lg text-sm text-text-main hover:bg-white/5 transition-colors font-medium"
                            >
                                Learn More
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 border-t border-border bg-surface/30">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-3xl font-bold text-text-main mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-text-muted mb-8">
                        Start your 14-day free trial. No credit card required.
                    </p>
                    <Link href="/sign-up">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] transition-all"
                        >
                            Start Free Trial
                        </motion.button>
                    </Link>
                </motion.div>
            </section>

            <Footer />

            <AnimatePresence>
                {selectedFeature && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectedFeature(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-border rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
                        >
                            <div className="h-48 sm:h-64 w-full relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedFeature.visual}
                                    alt={selectedFeature.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 backdrop-blur-md flex items-center justify-center text-primary border border-primary/30">
                                        {selectedFeature.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">{selectedFeature.title}</h3>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <h4 className="text-primary font-medium text-sm mb-2 uppercase tracking-wider">Feature Deep Dive</h4>
                                <p className="text-text-muted leading-relaxed mb-6">
                                    {selectedFeature.details}
                                </p>
                                
                                <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                                    <button
                                        onClick={() => setSelectedFeature(null)}
                                        className="px-5 py-2.5 rounded-lg text-text-muted hover:bg-white/5 transition-colors font-medium border border-transparent"
                                    >
                                        Close
                                    </button>
                                    <Link href="/select-plan">
                                        <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
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
