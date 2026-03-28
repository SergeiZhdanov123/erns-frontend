"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface CashFlowDiagramProps {
    data: {
        operating_cash_flow: number;
        capex: number;
        dividends_paid: number;
        share_repurchases: number;
        acquisitions: number;
        debt_repayment: number;
        debt_issuance: number;
    };
}

function formatCompactCash(val: number) {
    if (val === 0) return "$0";
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    return `${sign}${(abs / 1e3).toFixed(1)}K`;
}

export function CashFlowDiagram({ data }: CashFlowDiagramProps) {
    // 1. Prepare raw absolute values (cashflows are often recorded as negatives, we want magnitudes)
    const ocf = Math.max(0, data.operating_cash_flow);
    const debt_issued = Math.abs(data.debt_issuance); // assuming issuance is recorded as positive or we take absolute
    const capex = Math.abs(data.capex);
    const buybacks = Math.abs(data.share_repurchases);
    const dividends = Math.abs(data.dividends_paid);
    const acquisitions = Math.abs(data.acquisitions);
    const debt_repaid = Math.abs(data.debt_repayment);

    // Calculate balancing reserve flow
    const total_inflows = ocf + debt_issued;
    const total_outflows = capex + buybacks + dividends + acquisitions + debt_repaid;

    let drawn_reserves = 0;
    let added_reserves = 0;

    if (total_outflows > total_inflows) {
        drawn_reserves = total_outflows - total_inflows;
    } else {
        added_reserves = total_inflows - total_outflows;
    }

    const total_volume = Math.max(total_inflows + drawn_reserves, total_outflows + added_reserves);

    // Nodes definition
    const sources = [
        { id: "ocf", label: "Operating Cash Flow", amount: ocf, color: "stroke-green-500", text: "text-green-500" },
        { id: "debt_in", label: "Debt Issued", amount: debt_issued, color: "stroke-loss", text: "text-loss" },
        { id: "res_in", label: "Drawn Reserves", amount: drawn_reserves, color: "stroke-text-muted", text: "text-text-muted" },
    ].filter(s => s.amount > 0);

    const uses = [
        { id: "capex", label: "Capital Exp. (CapEx)", amount: capex, color: "stroke-yellow-500", text: "text-yellow-500" },
        { id: "buybacks", label: "Share Buybacks", amount: buybacks, color: "stroke-cyan-400", text: "text-cyan-400" },
        { id: "dividends", label: "Dividends Paid", amount: dividends, color: "stroke-purple-400", text: "text-purple-400" },
        { id: "acquisitions", label: "Acquisitions (M&A)", amount: acquisitions, color: "stroke-blue-500", text: "text-blue-500" },
        { id: "debt_out", label: "Debt Repaid", amount: debt_repaid, color: "stroke-green-400", text: "text-green-400" },
        { id: "res_out", label: "Added to Reserves", amount: added_reserves, color: "stroke-text-muted", text: "text-text-muted" },
    ].filter(u => u.amount > 0);

    // Geometry
    const svgWidth = 800;
    const svgHeight = 500;
    const maxStroke = 35; // Thinned lines down from 90 to prevent overlapping
    const minStroke = 2; // minimum thickness line

    // Layout left side
    let leftY = 0;
    const leftNodes = sources.map(s => {
        const height = Math.max(minStroke, Math.min(maxStroke, (s.amount / total_volume) * (svgHeight - 100)));
        const yCenter = leftY + height / 2;
        leftY += height + 30; // 30px gap
        return { ...s, y: yCenter, height };
    });

    // Layout right side
    let rightY = 0;
    const rightNodes = uses.map(u => {
        const height = Math.max(minStroke, Math.min(maxStroke, (u.amount / total_volume) * (svgHeight - 100)));
        const yCenter = rightY + height / 2;
        rightY += height + 30;
        return { ...u, y: yCenter, height };
    });

    // Center node (Treasury)
    const centerY = Math.max(leftY, rightY) / 2;
    const centerX = svgWidth / 2;

    // Center layout
    const totalHeightPixels = Math.max(leftY, rightY, 200);
    const svgWrapperHeight = totalHeightPixels + 60;

    return (
        <div className="w-full relative py-8 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
                <svg viewBox={`0 0 ${svgWidth} ${svgWrapperHeight}`} className="w-full h-auto max-h-[80vh] overflow-visible">
                    {/* Draw Paths from sources to center */}
                    {leftNodes.map((node, i) => {
                        const pathId = `path-L-${i}`;
                        const startX = 150;
                        const startY = node.y;
                        const endX = centerX - 40;
                        const endY = centerY;
                        
                        return (
                            <g key={pathId}>
                                <path
                                    d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                                    fill="none"
                                    className={`${node.color} opacity-20`}
                                    strokeWidth={node.height}
                                    strokeLinecap="round"
                                />
                                <motion.path
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                    transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                                    d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                                    fill="none"
                                    className={`${node.color}`}
                                    strokeWidth={node.height}
                                    strokeLinecap="round"
                                />
                            </g>
                        );
                    })}

                    {/* Draw Paths from center to uses */}
                    {rightNodes.map((node, i) => {
                        const pathId = `path-R-${i}`;
                        const startX = centerX + 40;
                        const startY = centerY;
                        const endX = svgWidth - 150;
                        const endY = node.y;
                        
                        return (
                            <g key={pathId}>
                                <path
                                    d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                                    fill="none"
                                    stroke="currentColor"
                                    className={`${node.text} opacity-20`}
                                    strokeWidth={node.height}
                                    strokeLinecap="round"
                                />
                                <motion.path
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.6 }}
                                    transition={{ duration: 1.5, delay: 0.8 + i * 0.2, ease: "easeOut" }}
                                    d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                                    fill="none"
                                    stroke="currentColor"
                                    className={`${node.text}`}
                                    strokeWidth={node.height}
                                    strokeLinecap="round"
                                />
                            </g>
                        );
                    })}

                    {/* Center Node (Corporate Operations) */}
                    <circle cx={centerX} cy={centerY} r={55} className="fill-surface stroke-white/10" strokeWidth={2} />
                    <text x={centerX} y={centerY - 8} textAnchor="middle" dominantBaseline="middle" fill="currentColor" className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                        Corporate
                    </text>
                    <text x={centerX} y={centerY + 8} textAnchor="middle" dominantBaseline="middle" fill="currentColor" className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                        Operations
                    </text>

                    {/* Left Node Labels */}
                    {leftNodes.map((node, i) => (
                        <g key={`label-L-${i}`} transform={`translate(0, ${node.y})`}>
                            <rect x={0} y={-24} width={160} height={48} className="fill-surface border stroke-white/10 shadow-lg" rx={8} />
                            <text x={12} y={-4} fill="currentColor" className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                                {node.label}
                            </text>
                            <text x={12} y={14} fill="currentColor" className={`text-sm font-bold font-mono ${node.text}`}>
                                {formatCompactCash(node.amount)}
                            </text>
                        </g>
                    ))}

                    {/* Right Node Labels */}
                    {rightNodes.map((node, i) => (
                        <g key={`label-R-${i}`} transform={`translate(${svgWidth - 160}, ${node.y})`}>
                            <rect x={0} y={-24} width={160} height={48} className="fill-surface border stroke-white/10 shadow-lg" rx={8} />
                            <text x={12} y={-4} fill="currentColor" className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                                {node.label}
                            </text>
                            <text x={12} y={14} fill="currentColor" className={`text-sm font-bold font-mono ${node.text}`}>
                                {formatCompactCash(node.amount)}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
