"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { config } from "@/lib/config";
import { motion } from "framer-motion";

const BACKEND = config.apiUrl;

export default function AdminPage() {
    const { user, isLoaded } = useUser();
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);

    // Only allow specific admin
    const isAdmin = isLoaded && user?.primaryEmailAddress?.emailAddress === "nickgotgameon@gmail.com";

    if (!isLoaded) return <div className="p-8">Loading...</div>;

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-text-main mb-2">Access Denied</h2>
                <p className="text-sm text-text-muted">You do not have permission to view this page.</p>
            </div>
        );
    }

    const handleSend = async () => {
        if (!subject || !body) {
            setStatus({ type: "error", message: "Subject and body are required." });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch(`${BACKEND}/admin/broadcast`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": user?.primaryEmailAddress?.emailAddress || "",
                },
                body: JSON.stringify({ subject, body }),
            });

            const data = await res.json();
            
            if (res.ok) {
                setStatus({ type: "success", message: `Successfully sent broadcast to ${data.users_targeted} users.` });
                setSubject("");
                setBody("");
            } else {
                setStatus({ type: "error", message: data.detail || "Failed to send broadcast." });
            }
        } catch (err) {
            setStatus({ type: "error", message: "Network error occurred." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-text-main font-mono mb-2">Admin Broadcast Center</h1>
                    <p className="text-sm text-text-muted">Send formatted email updates to all registered Erns users.</p>
                </div>

                {status && (
                    <div className={`p-4 rounded-xl mb-6 border ${status.type === "success" ? "bg-profit/10 border-profit/30 text-profit" : "bg-loss/10 border-loss/30 text-loss"}`}>
                        {status.message}
                    </div>
                )}

                <div className="bg-surface border border-border rounded-xl p-6 space-y-6 shadow-xl">
                    <div>
                        <label className="block text-sm font-semibold text-text-main mb-2">Subject Line</label>
                        <input 
                            type="text" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors"
                            placeholder="Erns Weekly Update: New AI Features"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-main mb-2 flex items-center justify-between">
                            Email Body 
                            <span className="text-[10px] text-text-muted font-normal">Markdown Supported</span>
                        </label>
                        <textarea 
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none min-h-[300px] transition-colors"
                            placeholder="Type your message here... You can use **bold** or ## headers."
                        />
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button 
                            onClick={handleSend}
                            disabled={loading || !subject || !body}
                            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending Broadcast...
                                </>
                            ) : (
                                "Send to All Users"
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
