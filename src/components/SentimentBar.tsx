import { motion } from "framer-motion";

interface SentimentBarProps {
    score: number; // 1-100
    bullishPoints: string[];
    bearishPoints: string[];
    bottomLine: string;
}

export function SentimentBar({ score, bullishPoints, bearishPoints, bottomLine }: SentimentBarProps) {
    const isBullish = score >= 50;
    
    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-surface border border-border rounded-xl">
                <div className="text-sm text-text-muted mb-2 font-medium uppercase tracking-widest">
                    AI Sentiment Score
                </div>
                <div className="relative w-full max-w-sm h-6 bg-surface/50 rounded-full overflow-hidden border border-border/50 mb-3">
                    <div className="absolute inset-0 flex">
                        <div className="w-1/2 h-full bg-loss/10" />
                        <div className="w-1/2 h-full bg-profit/10" />
                    </div>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute top-0 left-0 h-full rounded-full ${isBullish ? 'bg-gradient-to-r from-profit/80 to-profit' : 'bg-gradient-to-r from-loss/80 to-loss'}`}
                    />
                    {/* Center Marker */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-background mix-blend-overlay" />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono">
                        <span className={isBullish ? "text-profit" : "text-loss"}>{score}</span>
                        <span className="text-text-muted/40">/100</span>
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${isBullish ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"}`}>
                        {isBullish ? "Bullish" : "Bearish"}
                    </span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-profit/20 bg-gradient-to-br from-profit/5 to-transparent">
                    <h5 className="flex items-center gap-2 font-semibold text-profit mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                        </svg>
                        Bullish Catalysts
                    </h5>
                    <ul className="space-y-2">
                        {bullishPoints.map((pt, i) => (
                            <li key={i} className="text-sm text-text-muted flex gap-2">
                                <span className="text-profit mt-0.5">•</span>
                                <span>{pt}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-5 rounded-xl border border-loss/20 bg-gradient-to-br from-loss/5 to-transparent">
                    <h5 className="flex items-center gap-2 font-semibold text-loss mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                        </svg>
                        Bearish Risks
                    </h5>
                    <ul className="space-y-2">
                        {bearishPoints.map((pt, i) => (
                            <li key={i} className="text-sm text-text-muted flex gap-2">
                                <span className="text-loss mt-0.5">•</span>
                                <span>{pt}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="p-5 bg-surface rounded-xl border border-border">
                <h5 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Bottom Line</h5>
                <p className="text-sm text-text-main leading-relaxed">{bottomLine}</p>
            </div>
        </div>
    );
}
