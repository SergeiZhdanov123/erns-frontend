"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { config } from "@/lib/config";
import { CashFlowDiagram } from "@/components/CashFlowDiagram";

interface CapitalMetrics {
    year: string;
    operating_cash_flow: number;
    capex: number;
    free_cash_flow: number;
    dividends_paid: number;
    share_repurchases: number;
    acquisitions: number;
    debt_repayment: number;
    debt_issuance: number;
}

interface CapitalAllocationData {
    ticker: string;
    company_name: string;
    annual_metrics: CapitalMetrics[];
}

function formatCompactCash(val: number) {
    if (val === 0) return "$0";
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    return `${sign}${(abs / 1e3).toFixed(1)}K`;
}

export default function CapitalAllocationPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CapitalAllocationData | null>(null);
    const [error, setError] = useState("");

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const ticker = searchQuery.trim().toUpperCase();
        if (!ticker) return;

        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${config.apiUrl}/company/${ticker}/capital-allocation`);
            const json = await res.json();
            if (!json.annual_metrics || json.annual_metrics.length === 0) {
                setError(`No capital allocation data found for ${ticker}.`);
                setData(null);
            } else {
                setData(json);
            }
        } catch {
            setError("Failed to fetch capital allocation data.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Capital Allocation Tracker</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Track how management allocates Free Cash Flow into Buybacks, Dividends, CapEx, and Debt.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-auto min-w-[300px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 text-sm border border-white/10 rounded-xl bg-surface/50 text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="Search ticker (e.g. MSFT)"
                    />
                    <button type="submit" className="absolute inset-y-1.5 right-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3 rounded-lg text-xs font-semibold disabled:opacity-50">
                        Analyze
                    </button>
                </form>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-sm text-text-muted font-mono animate-pulse">Pulling SEC Cashflow Statements...</p>
                </div>
            )}

            {error && (
                <div className="bg-loss/10 border border-loss/20 rounded-xl p-4 text-center">
                    <p className="text-loss text-sm font-medium">{error}</p>
                </div>
            )}

            {!loading && !data && !error && (
                <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-surface/80 flex items-center justify-center border border-white/5 shadow-inner mb-6">
                        <svg className="w-8 h-8 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-10v2h14V7H7z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-text-main mb-2">Money Movement</h2>
                    <p className="text-text-muted max-w-sm">
                        Search a company to visualize exactly where their cash comes from and where it is being spent.
                    </p>
                </div>
            )}

            {!loading && data && data.annual_metrics && (
                function() {
                    // Filter out years with all zero values and sort newest to oldest
                    const validMetrics = data.annual_metrics.filter(m => 
                        m.operating_cash_flow !== 0 || m.capex !== 0 || m.dividends_paid !== 0 || 
                        m.share_repurchases !== 0 || m.acquisitions !== 0 || m.debt_issuance !== 0 || m.debt_repayment !== 0
                    ).sort((a, b) => parseInt(b.year) - parseInt(a.year));

                    if (validMetrics.length === 0) return null;

                    return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-3xl font-black text-text-main font-mono">{data.ticker}</h2>
                                    <span className="text-base text-text-muted">{data.company_name}</span>
                                </div>
                            </div>

                            {/* Most Recent Year Flowchart */}
                            <div className="bg-surface/30 border border-white/10 rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden">


                                <div className="mb-6 relative z-10 text-center md:text-left">
                                    <h3 className="text-2xl font-black text-text-main font-mono uppercase tracking-widest">FY {validMetrics[0].year} Cash Flow</h3>
                                    <p className="text-text-muted text-sm mt-1">
                                        Complete breakdown of capital acquisition and allocation for the most recently reported fiscal year.
                                    </p>
                                </div>
                                <div className="relative z-10">
                                    <CashFlowDiagram data={validMetrics[0]} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold font-mono text-text-main pt-4 border-b border-white/5 pb-2">Historical Metrics</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {validMetrics.map((yearData, idx) => {
                            const netDebtLabel = yearData.debt_issuance + yearData.debt_repayment; // Issuance is usually +, Repayment is usually -
                            
                            return (
                                <div key={idx} className="bg-surface/40 border border-white/5 rounded-2xl p-6 shadow-sm hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                                        <h3 className="text-xl font-bold text-text-main font-mono">FY {yearData.year}</h3>
                                        <div className="text-right">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Free Cash Flow</p>
                                            <p className={`text-lg font-bold font-mono ${yearData.free_cash_flow >= 0 ? "text-green-500" : "text-loss"}`}>
                                                {formatCompactCash(yearData.free_cash_flow)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Operations Core */}
                                        <div>
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">Operations Core</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-background rounded-xl p-3 border border-white/5">
                                                    <p className="text-xs text-text-muted mb-1">Operating Cash</p>
                                                    <p className="font-mono text-sm text-text-main font-semibold">
                                                        {formatCompactCash(yearData.operating_cash_flow)}
                                                    </p>
                                                </div>
                                                <div className="bg-background rounded-xl p-3 border border-white/5">
                                                    <p className="text-xs text-text-muted mb-1">CapEx</p>
                                                    <p className="font-mono text-sm text-yellow-500 font-semibold">
                                                        {formatCompactCash(yearData.capex)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shareholder Returns */}
                                        <div>
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">Shareholder Returns</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-background rounded-xl p-3 border border-white/5 relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/50"></div>
                                                    <p className="text-xs text-text-muted mb-1 ml-1">Buybacks</p>
                                                    <p className="font-mono text-sm text-cyan-400 font-semibold ml-1">
                                                        {formatCompactCash(yearData.share_repurchases)}
                                                    </p>
                                                </div>
                                                <div className="bg-background rounded-xl p-3 border border-white/5 relative overflow-hidden">
                                                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50"></div>
                                                    <p className="text-xs text-text-muted mb-1 ml-1">Dividends Paid</p>
                                                    <p className="font-mono text-sm text-purple-400 font-semibold ml-1">
                                                        {formatCompactCash(yearData.dividends_paid)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Strategic & Debt */}
                                        <div>
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">Strategic & Financing</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-background rounded-xl p-3 border border-white/5">
                                                    <p className="text-xs text-text-muted mb-1">Acquisitions (M&A)</p>
                                                    <p className="font-mono text-sm text-text-main font-semibold">
                                                        {formatCompactCash(yearData.acquisitions)}
                                                    </p>
                                                </div>
                                                <div className="bg-background rounded-xl p-3 border border-white/5">
                                                    <p className="text-xs text-text-muted mb-1">Net Debt Flow</p>
                                                    <p className={`font-mono text-sm font-semibold ${netDebtLabel > 0 ? "text-loss" : "text-green-500"}`}>
                                                        {formatCompactCash(netDebtLabel)}
                                                        <span className="text-[10px] text-text-muted ml-1 font-sans font-normal">
                                                            {netDebtLabel > 0 ? "(Issued)" : "(Repaid)"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
                    );
                }()
            )}
        </div>
    );
}
