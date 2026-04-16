"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { config } from "@/lib/config";
import { ProGate } from "@/components/pro-gate";
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from "@/components/erns-chat";

interface IPOItem {
    date: string;
    symbol: string;
    name: string;
    exchange: string;
    price: string;
    shares: string;
    value: string;
    return_pct: string;
    status: string;
}

// Inline Chatbot for IPOs
function IPOChatbot({ ipos }: { ipos: IPOItem[] }) {
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

        const contextMsg = "Context: Upcoming and recent IPOs:\n" +
            ipos.slice(0, 15).map(a => `${a.date} | ${a.symbol} (${a.name}): Price ${a.price}, Shares ${a.shares}, Value ${a.value}`).join("\n");

        const userMsg = { role: "user" as const, content: trimmed };
        const apiMessages = messages.length === 0
            ? [{ role: "system" as const, content: `You are an AI investment banker and IPO expert. Help the user analyze the following IPO calendar:\n${contextMsg}\nKeep responses concise, aggressive, and highly analytical.` }, userMsg]
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
    }, [input, loading, messages, ipos]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-semibold text-text-main text-sm">IPO Copilot</h3>
                    <p className="text-[10px] text-cyan-400">Ask me about these new listings</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-text-muted text-xs mt-10">
                        <p>I am tracking {ipos.length} upcoming IPOs.</p>
                        <p className="mt-2">Ask me to analyze the biggest deals or evaluate a specific ticker's offering size.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${msg.role === "user" ? "bg-cyan-600 text-white" : "bg-white/5 text-text-main border border-border"}`}>
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
                                <div className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                        placeholder="Analyze this week's IPOs..."
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-cyan-500/50"
                    />
                    <button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function IPOsPage() {
    const [ipos, setIpos] = useState<IPOItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<Record<string, { loading: boolean, data?: string }>>({});

    const toggleExpand = async (item: IPOItem) => {
        if (expandedSymbol === item.symbol) {
            setExpandedSymbol(null);
            return;
        }
        setExpandedSymbol(item.symbol);
        if (!analysisData[item.symbol]) {
            setAnalysisData(prev => ({ ...prev, [item.symbol]: { loading: true } }));
            try {
                const res = await fetch(`${config.apiUrl}/market/ipos/analyze`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item)
                });
                const data = await res.json();
                setAnalysisData(prev => ({ ...prev, [item.symbol]: { loading: false, data: data.analysis } }));
            } catch (err) {
                setAnalysisData(prev => ({ ...prev, [item.symbol]: { loading: false, data: "**Error**: Failed to generate AI analysis." } }));
            }
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchIPOs = async () => {
            try {
                const res = await fetch(`${config.apiUrl}/market/ipos`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (isMounted && data.ipos) {
                    setIpos(data.ipos);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchIPOs();
        return () => { isMounted = false; };
    }, []);

    return (
        <ProGate>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Main Content: IPO Calendar */}
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-text-main">IPO Calendar</h2>
                                <span className="text-xs text-cyan-400 px-2 py-1 rounded bg-cyan-500/10 font-mono hidden sm:inline-block border border-cyan-500/20">
                                    LIVE FEED
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : ipos.length === 0 ? (
                            <div className="text-center py-20 bg-surface border border-border rounded-xl">
                                <p className="text-text-muted">No IPO data currently available. Check back later.</p>
                            </div>
                        ) : (
                            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-border text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                                                <th className="p-3 pl-4">Date</th>
                                                <th className="p-3">Symbol</th>
                                                <th className="p-3">Company</th>
                                                <th className="p-3">Expected Price</th>
                                                <th className="p-3">Shares</th>
                                                <th className="p-3 text-right pr-4">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {ipos.map((item, idx) => (
                                                <Fragment key={`${item.symbol}-${idx}`}>
                                                    <motion.tr 
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                                        onClick={() => toggleExpand(item)}
                                                        className="hover:bg-white/5 transition-colors cursor-pointer"
                                                    >
                                                        <td className="p-3 pl-4 text-xs font-mono text-cyan-400 whitespace-nowrap">
                                                            {item.date}
                                                        </td>
                                                        <td className="p-3 text-sm font-bold text-text-main">
                                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                                                                {item.symbol}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-xs text-text-muted max-w-[200px] truncate" title={item.name}>
                                                            {item.name}
                                                        </td>
                                                        <td className="p-3 text-xs font-mono text-text-main">
                                                            {item.price !== "-" ? `$${item.price}` : "-"}
                                                        </td>
                                                        <td className="p-3 text-xs font-mono text-text-muted">
                                                            {item.shares}
                                                        </td>
                                                        <td className="p-3 text-right pr-4 text-xs font-mono text-profit font-semibold">
                                                            {item.value}
                                                        </td>
                                                    </motion.tr>
                                                    <AnimatePresence>
                                                        {expandedSymbol === item.symbol && (
                                                            <motion.tr
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="bg-black/40 border-b border-border overflow-hidden"
                                                            >
                                                                <td colSpan={6} className="p-0">
                                                                    <div className="p-5 border-l-4 border-cyan-500 m-4 bg-surface rounded-r-xl text-sm text-text-main">
                                                                        {analysisData[item.symbol]?.loading ? (
                                                                            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
                                                                                <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                                                                Running Analyst Compute...
                                                                            </div>
                                                                        ) : (
                                                                            <div className="tyche-ai-response prose prose-invert max-w-none prose-sm font-sans">
                                                                                <ReactMarkdown>{analysisData[item.symbol]?.data || ""}</ReactMarkdown>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        )}
                                                    </AnimatePresence>
                                                </Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Chatbot */}
                    <div className="w-full md:w-80 lg:w-96 shrink-0">
                        <div className="sticky top-24">
                            <IPOChatbot ipos={ipos} />
                        </div>
                    </div>
                </div>
            </div>
        </ProGate>
    );
}
