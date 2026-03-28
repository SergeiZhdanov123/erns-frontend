"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { config } from "@/lib/config";
import { useUser } from "@clerk/nextjs";
import { useWatchlist } from "@/hooks/useWatchlist";
import { formatAIResponse } from "@/components/erns-chat";

interface AnomalyItem {
    ticker: string;
    company_name: string;
    impact: "Positive" | "Negative" | "Neutral";
    severity: "High" | "Medium" | "Low";
    description: string;
    actionable_play?: string;
    metrics: Record<string, string>;
}

// Inline Chatbot for Anomalies
function AnomalyChatbot({ anomalies }: { anomalies: AnomalyItem[] }) {
    const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const contextMsg = "Context: Active market anomalies detected today:\n" +
            anomalies.map(a => `${a.ticker}: ${a.impact} impact. ${a.description}`).join("\n");

        const userMsg = { role: "user" as const, content: trimmed };
        const apiMessages = messages.length === 0
            ? [{ role: "system" as const, content: `You are an AI anomaly expert. Explain the following anomalies to the user:\n${contextMsg}` }, userMsg]
            : [...messages, userMsg];

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: apiMessages }),
            });
            const data = await res.json();
            if (data.reply) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
            }
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to AI." }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, anomalies]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-semibold text-text-main text-sm">Anomaly Copilot</h3>
                    <p className="text-[10px] text-primary">Ask me about these signals</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-text-muted text-xs mt-10">
                        <p>I am monitoring {anomalies.length} anomaly signals.</p>
                        <p className="mt-2">Ask me to summarize the risks or explain a specific ticker.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/5 text-text-main border border-border"}`}>
                            {msg.role === "assistant" ? (
                                <div className="tyche-ai-response text-xs whitespace-pre-wrap">
                                    {formatAIResponse(msg.content)}
                                </div>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-border rounded-xl px-4 py-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about an anomaly..."
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                    />
                    <button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AnomaliesPage() {
    const { user } = useUser();
    const { tickers: watchlistTickers, loading: wlLoading } = useWatchlist(user?.primaryEmailAddress?.emailAddress);
    
    const [scanType, setScanType] = useState<"watchlist" | "all">("watchlist");
    const [loading, setLoading] = useState(true);

    // ── Cache: store results per scan type so switching doesn't re-fetch ──
    const cacheRef = useRef<{
        watchlist: { data: AnomalyItem[]; tickersKey: string } | null;
        all: { data: AnomalyItem[] } | null;
    }>({ watchlist: null, all: null });

    // Active displayed anomaly results
    const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);

    // Stable ticker string to avoid reference-equality issues with arrays
    const tickersKey = useMemo(() => watchlistTickers.slice().sort().join(","), [watchlistTickers]);

    // Track whether we've done the initial fetch for each mode
    const fetchedRef = useRef<{ watchlist: string | null; all: boolean }>({ watchlist: null, all: false });

    const fetchAnomalies = useCallback(async (mode: "watchlist" | "all", tickers: string[], force = false) => {
        // Check cache first (unless forced)
        if (!force) {
            if (mode === "all" && cacheRef.current.all) {
                setAnomalies(cacheRef.current.all.data);
                setLoading(false);
                return;
            }
            if (mode === "watchlist" && cacheRef.current.watchlist && cacheRef.current.watchlist.tickersKey === tickersKey) {
                setAnomalies(cacheRef.current.watchlist.data);
                setLoading(false);
                return;
            }
        }

        if (mode === "watchlist" && tickers.length === 0) {
            setAnomalies([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const urlTickers = mode === "watchlist" ? `&tickers=${tickers.join(",")}` : "";
        
        try {
            const res = await fetch(`${config.apiUrl}/market/anomalies?scan_type=${mode}${urlTickers}`);
            const data = await res.json();
            const items = data.items || [];
            
            // Cache the results
            if (mode === "all") {
                cacheRef.current.all = { data: items };
            } else {
                cacheRef.current.watchlist = { data: items, tickersKey };
            }
            
            setAnomalies(items);
        } catch {
            // Keep showing whatever we have
        } finally {
            setLoading(false);
        }
    }, [tickersKey]);

    // Fetch on mode change or initial load — but only when needed
    useEffect(() => {
        if (wlLoading) return;

        if (scanType === "watchlist") {
            // Only re-fetch if watchlist tickers changed
            if (fetchedRef.current.watchlist !== tickersKey) {
                fetchedRef.current.watchlist = tickersKey;
                fetchAnomalies("watchlist", watchlistTickers);
            } else if (cacheRef.current.watchlist) {
                // Restore from cache when switching back
                setAnomalies(cacheRef.current.watchlist.data);
                setLoading(false);
            }
        } else {
            // "all" mode: fetch once
            if (!fetchedRef.current.all) {
                fetchedRef.current.all = true;
                fetchAnomalies("all", []);
            } else if (cacheRef.current.all) {
                // Restore from cache when switching back
                setAnomalies(cacheRef.current.all.data);
                setLoading(false);
            }
        }
    }, [scanType, tickersKey, wlLoading, fetchAnomalies, watchlistTickers]);

    const getImpactColor = (impact: string) => {
        if (impact === "Positive") return "text-profit bg-profit/10 border-profit/20";
        if (impact === "Negative") return "text-loss bg-loss/10 border-loss/20";
        return "text-text-muted bg-white/5 border-border";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Main Content: Anomalies List */}
                <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-text-main">Market Anomalies Detected</h2>
                            <span className="text-xs text-primary px-2 py-1 rounded bg-primary/10 font-mono hidden sm:inline-block">
                                LIVE SCAN
                            </span>
                        </div>
                        
                        {/* Scan Type Toggle */}
                        <div className="flex bg-surface border border-border rounded-lg p-1">
                            <button
                                onClick={() => setScanType("watchlist")}
                                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                    scanType === "watchlist" 
                                    ? "bg-primary text-primary-foreground" 
                                    : "text-text-muted hover:text-text-main"
                                }`}
                            >
                                Watchlist Stocks
                            </button>
                            <button
                                onClick={() => setScanType("all")}
                                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                    scanType === "all" 
                                    ? "bg-primary text-primary-foreground" 
                                    : "text-text-muted hover:text-text-main"
                                }`}
                            >
                                Market-Wide
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-surface border border-border rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : anomalies.length === 0 ? (
                        <div className="text-center py-20 bg-surface border border-border rounded-xl">
                            {scanType === "watchlist" && watchlistTickers.length === 0 ? (
                                <p className="text-text-muted">Your Watchlist is empty. Add stocks to scan them for anomalies.</p>
                            ) : (
                                <p className="text-text-muted">No significant anomalies detected in upcoming earnings.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {anomalies.map((item, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={item.ticker}
                                    className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-text-main">{item.ticker}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getImpactColor(item.impact)}`}>
                                                    {item.impact} Impact
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-muted mt-1">{item.company_name}</p>
                                        </div>
                                        
                                        <div className="flex flex-col items-end hidden sm:flex">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Severity</span>
                                                <span className={`text-[10px] font-bold uppercase ${item.severity === 'High' ? 'text-red-400' : item.severity === 'Medium' ? 'text-amber-400' : 'text-text-muted'}`}>
                                                    {item.severity}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map((val) => (
                                                    <div key={val} className={`w-8 h-1.5 rounded-full ${
                                                        (item.severity === 'High' && val <= 3) ||
                                                        (item.severity === 'Medium' && val <= 2) ||
                                                        (item.severity === 'Low' && val <= 1)
                                                        ? (item.severity === 'High' ? 'bg-red-400' : item.severity === 'Medium' ? 'bg-amber-400' : 'bg-white/40')
                                                        : 'bg-white/5'
                                                    }`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-text-main mb-4 leading-relaxed">
                                        {item.description}
                                    </p>

                                    {item.actionable_play && item.actionable_play !== "TBD" && (
                                        <div className="mb-5 bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 z-10">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            </div>
                                            <div className="z-10">
                                                <p className="text-[10px] text-primary uppercase font-bold tracking-wider mb-0.5">Active Options Play</p>
                                                <p className="text-sm font-semibold text-text-main font-mono">{item.actionable_play}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(item.metrics || {}).map(([key, val]) => (
                                            <div key={key} className="bg-background border border-border/50 rounded-lg p-2.5">
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{key}</p>
                                                <p className="text-sm font-semibold text-text-main font-mono">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Chatbot */}
                <div className="w-full md:w-80 lg:w-96 shrink-0">
                    <div className="sticky top-24">
                        <AnomalyChatbot anomalies={anomalies} />
                    </div>
                </div>
            </div>
        </div>
    );
}
