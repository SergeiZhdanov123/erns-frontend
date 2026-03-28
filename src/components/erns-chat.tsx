"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function ErnsChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = { role: "user", content: trimmed };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            const data = await res.json();

            if (data.reply) {
                setMessages([...newMessages, { role: "assistant", content: data.reply }]);
            } else {
                setMessages([
                    ...newMessages,
                    { role: "assistant", content: "Sorry, I couldn't process that request. Please try again." },
                ]);
            }
        } catch {
            setMessages([
                ...newMessages,
                { role: "assistant", content: "Connection error. Please check your network and try again." },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* ─── Floating Button ─── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 group ${isOpen
                    ? "bg-surface border border-border rotate-0 scale-95"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 scale-100 hover:scale-105"
                    }`}
                aria-label="Erns AI Chat"
            >
                {isOpen ? (
                    <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                )}
            </button>


            {/* ─── Chat Panel ─── */}
            {isOpen && (
                <div className="fixed bottom-24 right-5 z-50 w-[380px] h-[520px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-surface/80 backdrop-blur-sm shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text-main">Erns AI</h3>
                                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Earnings Intelligence Assistant
                                </p>
                            </div>
                            <button
                                onClick={() => { setMessages([]); }}
                                className="ml-auto text-[10px] text-text-muted/50 hover:text-text-muted px-2 py-1 rounded hover:bg-white/5 transition-colors"
                                title="Clear chat"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-text-main font-medium mb-1">Ask Erns AI anything</p>
                                <p className="text-xs text-text-muted mb-4">Earnings data, SEC filings, financial analysis, or platform help</p>
                                <div className="space-y-1.5 w-full">
                                    {[
                                        "What are AAPL's latest earnings?",
                                        "Who reports earnings this week?",
                                        "How do I use the screener?",
                                    ].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                                            className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-border/50 text-xs text-text-muted hover:text-text-main hover:border-primary/30 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-white/[0.05] text-text-main border border-border/50 rounded-bl-md"
                                        }`}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="tyche-ai-response text-xs whitespace-pre-wrap">
                                            {formatAIResponse(msg.content)}
                                        </div>
                                    ) : (
                                        <span className="text-xs">{msg.content}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/[0.05] border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-border bg-surface/80 shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about earnings, companies..."
                                disabled={loading}
                                className="flex-1 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text-main placeholder-text-muted/40 focus:border-primary/50 outline-none disabled:opacity-50 transition-colors"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-30 disabled:hover:bg-primary transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-[9px] text-text-muted/30 text-center mt-1.5">Powered by AI • Erns Intelligence</p>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Sentiment Bar Component ───
function SentimentBar({ bullish, bearish, label }: { bullish: number; bearish: number; label?: string }) {
    const total = bullish + bearish;
    const bullPct = total > 0 ? Math.round((bullish / total) * 100) : 50;
    const bearPct = 100 - bullPct;
    
    return (
        <div className="my-2 rounded-lg bg-white/[0.03] border border-border/50 p-2.5">
            {label && <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}</p>}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-emerald-400 w-8">{bullPct}%</span>
                <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden flex">
                    <div 
                        className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${bullPct}%` }}
                    />
                    <div 
                        className="h-full rounded-r-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                        style={{ width: `${bearPct}%` }}
                    />
                </div>
                <span className="text-[10px] font-bold text-red-400 w-8 text-right">{bearPct}%</span>
            </div>
            <div className="flex justify-between">
                <span className="text-[9px] text-emerald-400/70">Bullish</span>
                <span className="text-[9px] text-red-400/70">Bearish</span>
            </div>
        </div>
    );
}

// ─── Metric Pill Component ───
function MetricPill({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
    return (
        <div className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-border/40 rounded-lg px-2 py-1 mr-1.5 mb-1">
            <span className="text-[9px] text-text-muted uppercase">{label}</span>
            <span className={`text-[10px] font-bold font-mono ${positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-text-main"}`}>
                {value}
            </span>
        </div>
    );
}

// ─── Score Bar Component ───
function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
    const pct = Math.min(100, Math.max(0, (score / max) * 100));
    const color = pct >= 70 ? "from-emerald-500 to-emerald-400" : pct >= 40 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";
    
    return (
        <div className="my-1.5">
            <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-text-muted">{label}</span>
                <span className="text-[10px] font-bold text-text-main font-mono">{score}/{max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Parse and render interactive elements from AI response text ───
export function formatAIResponse(content: string): React.ReactNode {
    // First, extract any structured data patterns and replace with placeholders
    const elements: React.ReactNode[] = [];
    let processedContent = content;
    
    // Detect sentiment patterns: "bullish: X%" / "bearish: X%" or "X% bullish"
    const sentimentMatch = content.match(/(?:sentiment|outlook|signal)[:\s]*(?:.*?)(\d{1,3})\s*%\s*(?:bullish|positive)/i)
        || content.match(/(\d{1,3})\s*%\s*(?:bullish|positive)/i);
    const bearishMatch = content.match(/(\d{1,3})\s*%\s*(?:bearish|negative)/i);
    
    if (sentimentMatch) {
        const bullPct = parseInt(sentimentMatch[1]);
        const bearPct = bearishMatch ? parseInt(bearishMatch[1]) : (100 - bullPct);
        elements.push(
            <SentimentBar key="sentiment" bullish={bullPct} bearish={bearPct} label="Sentiment Analysis" />
        );
    }
    
    // Detect score-like patterns: "overall score: 7/10" or "rating: 8/10"
    const scoreMatches = [...content.matchAll(/(?:(?:overall|earnings|financial|risk)\s*)?(?:score|rating|grade)[:\s]*(\d{1,2})\/(\d{1,2})/gi)];
    if (scoreMatches.length > 0) {
        elements.push(
            <div key="scores" className="my-2 rounded-lg bg-white/[0.03] border border-border/50 p-2.5">
                <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-1">Ratings</p>
                {scoreMatches.map((m, i) => {
                    const label = m[0].split(/[:\d]/)[0].trim() || "Score";
                    return <ScoreBar key={i} label={label} score={parseInt(m[1])} max={parseInt(m[2])} />;
                })}
            </div>
        );
    }
    
    // Detect key metrics: "EPS: $X.XX", "Revenue: $XB", "Market Cap: $XB", "P/E: XX"
    const metricPatterns = [
        { re: /EPS[:\s]*\$?([-\d.]+)/i, label: "EPS" },
        { re: /Revenue[:\s]*\$?([\d.]+[BMT]?)/i, label: "Revenue" },
        { re: /Market\s*Cap[:\s]*\$?([\d.]+[BMT]?)/i, label: "Mkt Cap" },
        { re: /P\/?E(?:\s*Ratio)?[:\s]*([\d.]+)/i, label: "P/E" },
        { re: /(?:EPS\s*)?Surprise[:\s]*([-+]?[\d.]+%?)/i, label: "Surprise" },
    ];
    const foundMetrics: { label: string; value: string; positive?: boolean }[] = [];
    for (const mp of metricPatterns) {
        const m = content.match(mp.re);
        if (m) {
            const val = m[1];
            const isPositive = val.startsWith("+") || (!val.startsWith("-") && parseFloat(val) > 0 && mp.label === "Surprise");
            const isNegative = val.startsWith("-");
            foundMetrics.push({ label: mp.label, value: val.startsWith("$") ? val : (mp.label !== "P/E" && mp.label !== "Surprise" ? `$${val}` : val), positive: isPositive ? true : isNegative ? false : undefined });
        }
    }
    if (foundMetrics.length >= 2) {
        elements.push(
            <div key="metrics" className="my-2 flex flex-wrap">
                {foundMetrics.map((m, i) => <MetricPill key={i} {...m} />)}
            </div>
        );
    }
    
    // Now render the text content with markdown formatting
    const blocks = processedContent.split(/\n\n+/);
    const textElements = blocks.map((block, bi) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading: ### or ## or #
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/m);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            const className = level === 1
                ? "text-sm font-bold text-text-main mt-3 mb-1"
                : level === 2
                    ? "text-xs font-bold text-text-main mt-2 mb-1"
                    : "text-xs font-semibold text-primary mt-2 mb-0.5";
            return <div key={`t-${bi}`} className={className}>{inlineFormat(text)}</div>;
        }

        // Bullet list
        if (/^[-*•]\s/.test(trimmed)) {
            const items = trimmed.split(/\n/).filter(l => l.trim());
            return (
                <ul key={`t-${bi}`} className="space-y-0.5 my-1 ml-2">
                    {items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-1.5">
                            <span className="text-primary/60 mt-0.5 text-[8px]">●</span>
                            <span>{inlineFormat(item.replace(/^[-*•]\s*/, ""))}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        // Numbered list
        if (/^\d+[.)]\s/.test(trimmed)) {
            const items = trimmed.split(/\n/).filter(l => l.trim());
            return (
                <ol key={`t-${bi}`} className="space-y-0.5 my-1 ml-2">
                    {items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-1.5">
                            <span className="text-primary/60 font-mono text-[9px] mt-0.5 w-3 shrink-0">{ii + 1}.</span>
                            <span>{inlineFormat(item.replace(/^\d+[.)]\s*/, ""))}</span>
                        </li>
                    ))}
                </ol>
            );
        }

        // Code block
        if (trimmed.startsWith("```")) {
            const code = trimmed.replace(/^```\w*\n?/, "").replace(/```$/, "").trim();
            return (
                <pre key={`t-${bi}`} className="bg-white/5 rounded-lg p-2 my-1 overflow-x-auto">
                    <code className="text-[10px] font-mono text-emerald-300">{code}</code>
                </pre>
            );
        }

        // Regular paragraph
        return <p key={`t-${bi}`} className="my-0.5">{inlineFormat(trimmed)}</p>;
    });

    // Merge: text first, then interactive elements at the end
    return (
        <>
            {textElements}
            {elements.length > 0 && <div className="mt-2 border-t border-border/30 pt-2">{elements}</div>}
        </>
    );
}

// Handle inline formatting: bold, italic, code, bold+italic
function inlineFormat(text: string): React.ReactNode {
    const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("***") && part.endsWith("***")) {
            return <strong key={i} className="font-bold italic text-text-main">{part.slice(3, -3)}</strong>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="font-bold text-text-main">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={i} className="italic text-text-main/80">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={i} className="bg-white/10 px-1 rounded text-emerald-300 text-[10px] font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
    });
}
