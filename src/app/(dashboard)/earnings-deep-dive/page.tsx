"use client";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { config } from "@/lib/config";

// ─── Types ───
interface Quarter { fy:number; fp:string; period_end?:string; filed?:string; eps_basic?:number; eps_diluted?:number; revenue?:number; net_income?:number; }
interface FinData {
  ticker:string; company_name?:string; sector?:string; industry?:string; description?:string; website?:string;
  price?:number; change?:number; change_pct?:number; market_cap?:number; volume?:number;
  trailing_pe?:number; forward_pe?:number; peg_ratio?:number; price_to_book?:number; price_to_sales?:number;
  enterprise_value?:number; ev_to_revenue?:number; ev_to_ebitda?:number;
  gross_margins?:number; operating_margins?:number; profit_margins?:number; return_on_equity?:number; return_on_assets?:number;
  revenue_growth?:number; earnings_growth?:number; earnings_quarterly_growth?:number;
  total_revenue?:number; gross_profits?:number; ebitda?:number; net_income_ttm?:number;
  trailing_eps?:number; forward_eps?:number;
  operating_cashflow?:number; free_cashflow?:number; total_cash?:number; total_debt?:number;
  dividend_rate?:number; dividend_yield?:number; payout_ratio?:number;
  beta?:number; shares_outstanding?:number;
  analyst_count?:number; analyst_recommendation?:string; analyst_mean_rating?:number;
  target_low?:number; target_mean?:number; target_high?:number; target_median?:number; implied_upside_pct?:number;
  total_assets?:number; total_liabilities?:number; stockholders_equity?:number; debt_to_equity?:number; current_ratio?:number;
  quarterly_history: Quarter[];
  fiscal_year_end?:string; last_earnings_date?:string; next_earnings_date?:string;
}

// ─── Helpers ───
const fmt$ = (v?:number|null,d=1) => { if(v==null||isNaN(v)) return "—"; const a=Math.abs(v),s=v<0?"-":""; if(a>=1e12) return `${s}$${(a/1e12).toFixed(d)}T`; if(a>=1e9) return `${s}$${(a/1e9).toFixed(d)}B`; if(a>=1e6) return `${s}$${(a/1e6).toFixed(d)}M`; if(a>=1e3) return `${s}$${(a/1e3).toFixed(d)}K`; return `${s}$${a.toFixed(2)}`; };
const fmtPct = (v?:number|null) => v==null||isNaN(v) ? "—" : `${(v*100).toFixed(1)}%`;
const fmtNum = (v?:number|null,d=2) => v==null||isNaN(v) ? "—" : v.toFixed(d);
const fmtVol = (v?:number|null) => { if(!v) return "—"; if(v>=1e9) return `${(v/1e9).toFixed(1)}B`; if(v>=1e6) return `${(v/1e6).toFixed(1)}M`; if(v>=1e3) return `${(v/1e3).toFixed(0)}K`; return String(v); };
const clr = (v?:number|null) => v==null ? "text-text-main" : v>0 ? "text-emerald-400" : v<0 ? "text-red-400" : "text-text-main";

// ─── Components ───
function Stat({label,value,sub,positive,sm}:{label:string;value:string;sub?:string;positive?:boolean|null;sm?:boolean}) {
  return (<div className={`bg-surface border border-border rounded-xl ${sm?"p-3":"p-4"} hover:border-primary/30 transition-colors`}>
    <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</p>
    <p className={`${sm?"text-base":"text-xl"} font-bold font-mono mt-1 ${positive===true?"text-emerald-400":positive===false?"text-red-400":"text-text-main"}`}>{value}</p>
    {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
  </div>);
}

function HBar({data}:{data:{label:string;value:number}[]}) {
  const mx = Math.max(...data.map(d=>Math.abs(d.value)),1);
  return (<div className="space-y-1.5">{data.map((d,i)=>(
    <div key={i} className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted w-12 shrink-0 text-right font-mono">{d.label}</span>
      <div className="flex-1 h-5 rounded-md bg-white/5 overflow-hidden relative">
        <motion.div initial={{width:0}} animate={{width:`${(Math.abs(d.value)/mx)*100}%`}} transition={{duration:0.6,delay:i*0.03}}
          className={`h-full rounded-md ${d.value>=0?"bg-gradient-to-r from-emerald-600/80 to-emerald-400/80":"bg-gradient-to-r from-red-600/80 to-red-400/80"}`}/>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-white/80">{fmt$(d.value)}</span>
      </div>
    </div>
  ))}</div>);
}

function Gauge({label,value,reverse}:{label:string;value?:number|null;reverse?:boolean}) {
  if(value==null||isNaN(value)) return null;
  const pct = Math.min(100,Math.max(0,Math.abs(value)*100));
  const good = reverse ? pct>50 : pct<50;
  return (<div>
    <div className="flex items-center justify-between mb-0.5">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className={`text-[11px] font-bold font-mono ${good?"text-emerald-400":"text-amber-400"}`}>{fmtPct(value)}</span>
    </div>
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1}}
        className={`h-full rounded-full bg-gradient-to-r ${good?"from-emerald-500 to-emerald-400":"from-amber-500 to-amber-400"}`}/>
    </div>
  </div>);
}

function MetricRow({label,value,color}:{label:string;value:string;color?:string}) {
  return (<div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
    <span className="text-xs text-text-muted">{label}</span>
    <span className={`text-sm font-bold font-mono ${color||"text-text-main"}`}>{value}</span>
  </div>);
}

function PriceTargetBar({low,mean,high,current}:{low?:number;mean?:number;high?:number;current?:number}) {
  if(!low||!high||!current) return null;
  const min=low*0.9, max=high*1.1, range=max-min;
  const curPct=((current-min)/range)*100;
  const meanPct=mean?((mean-min)/range)*100:50;
  return (<div className="mt-3">
    <div className="relative h-6 rounded-full bg-white/5 overflow-visible">
      <div className="absolute h-full rounded-full bg-gradient-to-r from-red-500/30 via-amber-500/30 to-emerald-500/30" style={{left:`${((low-min)/range)*100}%`,width:`${((high-low)/range)*100}%`}}/>
      {mean && <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{left:`${meanPct}%`}}/>}
      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-lg" style={{left:`${curPct}%`}}/>
    </div>
    <div className="flex justify-between mt-1 text-[9px] text-text-muted font-mono">
      <span>${low.toFixed(0)}</span>
      {mean && <span className="text-amber-400">Mean: ${mean.toFixed(0)}</span>}
      <span>${high.toFixed(0)}</span>
    </div>
  </div>);
}

// ─── Main Page ───
export default function EarningsDeepDivePage() {
  const [searchInput,setSearchInput]=useState("");
  const [data,setData]=useState<FinData|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [tab,setTab]=useState<"overview"|"earnings"|"valuation"|"balance"|"cash"|"analysts">("overview");

  const fetchData=useCallback(async(t:string)=>{
    const u=t.toUpperCase().trim(); if(!u) return;
    setLoading(true); setError(null); setTab("overview");
    try {
      const res=await fetch(`${config.apiUrl}/company/${u}/full-financials`);
      if(!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch { setError(`Could not load data for ${u}`); }
    finally { setLoading(false); }
  },[]);

  const handleSearch=(e:React.FormEvent)=>{ e.preventDefault(); if(searchInput.trim()) fetchData(searchInput); };

  // Derived quarterly data
  // Only show the most recent 8 quarters (2 years) for clean, relevant charts
  const qh = useMemo(()=> (data?.quarterly_history||[]).slice(-8),[data]);
  const epsChartData = useMemo(()=> qh.map(q=>({label:`${q.fp}'${String(q.fy).slice(-2)}`,value:q.eps_diluted??q.eps_basic??0})),[qh]);
  const revChartData = useMemo(()=> qh.map(q=>({label:`${q.fp}'${String(q.fy).slice(-2)}`,value:q.revenue??0})),[qh]);
  const niChartData = useMemo(()=> qh.map(q=>({label:`${q.fp}'${String(q.fy).slice(-2)}`,value:q.net_income??0})),[qh]);

  // QoQ growth for latest quarter
  const latestQ = qh.length>0 ? qh[qh.length-1] : null;
  const prevYearQ = qh.length>4 ? qh[qh.length-5] : null; // same quarter last year

  const d = data; // shorthand

  return (<>
    {/* Search */}
    <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-6">
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
          <input type="text" value={searchInput} onChange={e=>setSearchInput(e.target.value.toUpperCase())} placeholder="Enter ticker (AAPL, MSFT, TSLA)..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-main text-sm font-mono placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"/>
        </div>
        <button type="submit" disabled={loading||!searchInput.trim()} className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all disabled:opacity-50">
          {loading?<span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Loading</span>:"Analyze"}
        </button>
      </form>
      <div className="flex gap-2 mt-3 flex-wrap">
        {["AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","META","JPM","V","WMT"].map(t=>(
          <button key={t} onClick={()=>{setSearchInput(t);fetchData(t);}} className="px-3 py-1 text-xs font-mono bg-white/[0.03] border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary/30 transition-all">{t}</button>
        ))}
      </div>
    </motion.div>

    {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">{error}</div>}

    {!d && !loading && (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
        </div>
        <h2 className="text-lg font-bold text-text-main mb-2">Earnings Deep Dive</h2>
        <p className="text-sm text-text-muted max-w-md">Complete financial analysis — earnings history, revenue trends, margins, valuation multiples, analyst consensus, balance sheet, cash flows, and AI insights.</p>
      </motion.div>
    )}

    {loading && <div className="space-y-4"><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-24 bg-surface/50 rounded-xl animate-pulse border border-border"/>)}</div><div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-48 bg-surface/50 rounded-xl animate-pulse border border-border"/>)}</div></div>}

    {d && !loading && (
      <AnimatePresence mode="wait"><motion.div key={d.ticker} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-main flex items-center gap-3">
              <span className="font-mono text-primary">{d.ticker}</span>
              {d.company_name && <span className="text-text-muted text-lg font-normal">{d.company_name}</span>}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {d.sector && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{d.sector}</span>}
              {d.industry && <span className="text-xs bg-white/5 text-text-muted px-2 py-0.5 rounded-full">{d.industry}</span>}
              {d.next_earnings_date && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Next Earnings: {d.next_earnings_date}</span>}
            </div>
          </div>
          {d.price!=null && (<div className="text-right">
            <p className="text-2xl font-bold font-mono text-text-main">${d.price.toFixed(2)}</p>
            <p className={`text-sm font-mono font-semibold ${clr(d.change)}`}>{d.change!=null?`${d.change>=0?"+":""}${d.change.toFixed(2)} (${d.change_pct?.toFixed(2)}%)`:"—"}</p>
            {d.volume!=null && <p className="text-[10px] text-text-muted">Vol: {fmtVol(d.volume)}</p>}
          </div>)}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 overflow-x-auto">
          {([["overview","📊","Overview"],["earnings","💰","Earnings"],["valuation","📐","Valuation"],["balance","🏦","Balance Sheet"],["cash","💸","Cash Flow"],["analysts","🎯","Analysts"]] as const).map(([k,ico,lbl])=>(
            <button key={k} onClick={()=>setTab(k as any)} className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${tab===k?"bg-primary text-primary-foreground":"text-text-muted hover:text-text-main hover:bg-white/5"}`}>
              <span>{ico}</span><span className="hidden sm:inline">{lbl}</span>
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {tab==="overview" && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Market Cap" value={fmt$(d.market_cap)} sm/>
            <Stat label="Revenue (TTM)" value={fmt$(d.total_revenue)} sm/>
            <Stat label="Net Income (TTM)" value={fmt$(d.net_income_ttm)} positive={d.net_income_ttm!=null?d.net_income_ttm>0:null} sm/>
            <Stat label="Trailing EPS" value={d.trailing_eps!=null?`$${fmtNum(d.trailing_eps)}`:"—"} positive={d.trailing_eps!=null?d.trailing_eps>0:null} sm/>
            <Stat label="Forward EPS" value={d.forward_eps!=null?`$${fmtNum(d.forward_eps)}`:"—"} sub={d.trailing_eps&&d.forward_eps?`${((d.forward_eps/d.trailing_eps-1)*100).toFixed(1)}% growth`:"Guidance"} sm/>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="P/E (Trailing)" value={fmtNum(d.trailing_pe)} sm/>
            <Stat label="P/E (Forward)" value={fmtNum(d.forward_pe)} sm/>
            <Stat label="Revenue Growth" value={fmtPct(d.revenue_growth)} positive={d.revenue_growth!=null?d.revenue_growth>0:null} sm/>
            <Stat label="Earnings Growth" value={fmtPct(d.earnings_growth)} positive={d.earnings_growth!=null?d.earnings_growth>0:null} sm/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"/>Margins</h3>
              <div className="space-y-2">
                <Gauge label="Gross Margin" value={d.gross_margins} reverse/>
                <Gauge label="Operating Margin" value={d.operating_margins} reverse/>
                <Gauge label="Net Margin" value={d.profit_margins} reverse/>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400"/>Returns</h3>
              <div className="space-y-2">
                <MetricRow label="Return on Equity" value={fmtPct(d.return_on_equity)} color={d.return_on_equity&&d.return_on_equity>0.15?"text-emerald-400":"text-amber-400"}/>
                <MetricRow label="Return on Assets" value={fmtPct(d.return_on_assets)} color={d.return_on_assets&&d.return_on_assets>0.05?"text-emerald-400":"text-amber-400"}/>
                <MetricRow label="Beta" value={fmtNum(d.beta)}/>
                {d.dividend_yield!=null && <MetricRow label="Dividend Yield" value={`${(d.dividend_yield*100).toFixed(2)}%`} color="text-cyan-400"/>}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"/>Company Info</h3>
              <div className="space-y-2 text-xs">
                {d.sector && <MetricRow label="Sector" value={d.sector}/>}
                {d.industry && <MetricRow label="Industry" value={d.industry}/>}
                {d.shares_outstanding && <MetricRow label="Shares Out" value={fmtVol(d.shares_outstanding)}/>}
                {d.fiscal_year_end && <MetricRow label="Fiscal Year End" value={d.fiscal_year_end}/>}
                {d.last_earnings_date && <MetricRow label="Last Earnings" value={d.last_earnings_date}/>}
              </div>
            </div>
          </div>
          {d.description && <div className="bg-surface border border-border rounded-xl p-5"><h3 className="text-sm font-bold text-text-main mb-2">About</h3><p className="text-xs text-text-muted leading-relaxed">{d.description.slice(0,600)}{d.description.length>600?"...":""}</p></div>}
        </motion.div>}

        {/* ─── EARNINGS ─── */}
        {tab==="earnings" && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Trailing EPS" value={d.trailing_eps!=null?`$${fmtNum(d.trailing_eps)}`:"—"} positive={d.trailing_eps!=null?d.trailing_eps>0:null} sm/>
            <Stat label="Forward EPS (Est)" value={d.forward_eps!=null?`$${fmtNum(d.forward_eps)}`:"—"} sub="Analyst consensus" sm/>
            <Stat label="EPS Growth (Guidance)" value={d.trailing_eps&&d.forward_eps?`${((d.forward_eps/d.trailing_eps-1)*100).toFixed(1)}%`:"—"} positive={d.trailing_eps&&d.forward_eps?(d.forward_eps>d.trailing_eps):null} sm/>
            <Stat label="Q/Q Earnings Growth" value={fmtPct(d.earnings_quarterly_growth)} positive={d.earnings_quarterly_growth!=null?d.earnings_quarterly_growth>0:null} sm/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">EPS History (Quarterly)</h3>
              {epsChartData.length>0 ? <HBar data={epsChartData}/> : <p className="text-xs text-text-muted text-center py-6">No EPS history</p>}
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">Revenue History (Quarterly)</h3>
              {revChartData.length>0 ? <HBar data={revChartData}/> : <p className="text-xs text-text-muted text-center py-6">No revenue history</p>}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-text-main mb-3">Net Income History (Quarterly)</h3>
            {niChartData.length>0 ? <HBar data={niChartData}/> : <p className="text-xs text-text-muted text-center py-6">No data</p>}
          </div>
          {/* Quarterly Table */}
          {qh.length>0 && <div className="bg-surface border border-border rounded-xl p-5 overflow-x-auto">
            <h3 className="text-sm font-bold text-text-main mb-3">Quarterly Earnings Table</h3>
            <table className="w-full text-xs"><thead><tr className="text-text-muted border-b border-border">
              <th className="text-left py-2 px-2">Period</th><th className="text-right py-2 px-2">EPS</th><th className="text-right py-2 px-2">Revenue</th><th className="text-right py-2 px-2">Net Income</th><th className="text-right py-2 px-2">Margin</th><th className="text-right py-2 px-2">Filed</th>
            </tr></thead><tbody>{qh.slice().reverse().slice(0,8).map((q,i)=>{
              const margin = q.revenue&&q.net_income ? (q.net_income/q.revenue) : null;
              return (<tr key={i} className="border-b border-border/20 hover:bg-white/[0.02]">
                <td className="py-2 px-2 font-mono font-semibold text-primary">{q.fp} FY{q.fy}</td>
                <td className={`py-2 px-2 text-right font-mono font-bold ${q.eps_diluted&&q.eps_diluted>0?"text-emerald-400":"text-red-400"}`}>${fmtNum(q.eps_diluted??q.eps_basic)}</td>
                <td className="py-2 px-2 text-right font-mono">{fmt$(q.revenue)}</td>
                <td className={`py-2 px-2 text-right font-mono ${q.net_income&&q.net_income>0?"text-emerald-400":"text-red-400"}`}>{fmt$(q.net_income)}</td>
                <td className={`py-2 px-2 text-right font-mono ${margin&&margin>0?"text-emerald-400":"text-red-400"}`}>{margin!=null?`${(margin*100).toFixed(1)}%`:"—"}</td>
                <td className="py-2 px-2 text-right text-text-muted">{q.filed||"—"}</td>
              </tr>);
            })}</tbody></table>
          </div>}
          {/* YoY comparison */}
          {latestQ && prevYearQ && <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-text-main mb-3">Year-over-Year Comparison ({latestQ.fp})</h3>
            <div className="grid grid-cols-3 gap-4">
              {[{label:"EPS",cur:latestQ.eps_diluted,prev:prevYearQ.eps_diluted},{label:"Revenue",cur:latestQ.revenue,prev:prevYearQ.revenue},{label:"Net Income",cur:latestQ.net_income,prev:prevYearQ.net_income}].map(({label,cur,prev})=>{
                const growth = cur&&prev&&prev!==0 ? ((cur-prev)/Math.abs(prev)) : null;
                return (<div key={label} className="text-center">
                  <p className="text-[10px] text-text-muted uppercase">{label} YoY</p>
                  <p className={`text-lg font-bold font-mono ${growth!=null?(growth>0?"text-emerald-400":"text-red-400"):"text-text-main"}`}>{growth!=null?`${growth>0?"+":""}${(growth*100).toFixed(1)}%`:"—"}</p>
                  <p className="text-[9px] text-text-muted">{label==="EPS"?`$${fmtNum(cur)} vs $${fmtNum(prev)}`:label==="Revenue"?`${fmt$(cur)} vs ${fmt$(prev)}`:`${fmt$(cur)} vs ${fmt$(prev)}`}</p>
                </div>);
              })}
            </div>
          </div>}
        </motion.div>}

        {/* ─── VALUATION ─── */}
        {tab==="valuation" && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Trailing P/E" value={fmtNum(d.trailing_pe)} sm/>
            <Stat label="Forward P/E" value={fmtNum(d.forward_pe)} sm/>
            <Stat label="PEG Ratio" value={fmtNum(d.peg_ratio)} sm/>
            <Stat label="P/B Ratio" value={fmtNum(d.price_to_book)} sm/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">Valuation Multiples</h3>
              <MetricRow label="P/S Ratio" value={fmtNum(d.price_to_sales)}/>
              <MetricRow label="EV/Revenue" value={fmtNum(d.ev_to_revenue)}/>
              <MetricRow label="EV/EBITDA" value={fmtNum(d.ev_to_ebitda)}/>
              <MetricRow label="Enterprise Value" value={fmt$(d.enterprise_value)}/>
              <MetricRow label="Market Cap" value={fmt$(d.market_cap)}/>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">Earnings Guidance</h3>
              <MetricRow label="Trailing EPS" value={d.trailing_eps!=null?`$${fmtNum(d.trailing_eps)}`:"—"}/>
              <MetricRow label="Forward EPS (Consensus)" value={d.forward_eps!=null?`$${fmtNum(d.forward_eps)}`:"—"} color="text-cyan-400"/>
              <MetricRow label="Implied EPS Growth" value={d.trailing_eps&&d.forward_eps?`${((d.forward_eps/d.trailing_eps-1)*100).toFixed(1)}%`:"—"} color={d.trailing_eps&&d.forward_eps&&d.forward_eps>d.trailing_eps?"text-emerald-400":"text-red-400"}/>
              <MetricRow label="Revenue Growth (YoY)" value={fmtPct(d.revenue_growth)} color={d.revenue_growth&&d.revenue_growth>0?"text-emerald-400":"text-red-400"}/>
              <MetricRow label="Earnings Growth (YoY)" value={fmtPct(d.earnings_growth)} color={d.earnings_growth&&d.earnings_growth>0?"text-emerald-400":"text-red-400"}/>
            </div>
          </div>
          {d.dividend_rate!=null && <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-text-main mb-3">Dividends</h3>
            <div className="grid grid-cols-3 gap-4">
              <MetricRow label="Dividend Rate" value={`$${fmtNum(d.dividend_rate)}`} color="text-cyan-400"/>
              <MetricRow label="Dividend Yield" value={d.dividend_yield!=null?`${(d.dividend_yield*100).toFixed(2)}%`:"—"} color="text-cyan-400"/>
              <MetricRow label="Payout Ratio" value={d.payout_ratio!=null?`${(d.payout_ratio*100).toFixed(1)}%`:"—"}/>
            </div>
          </div>}
        </motion.div>}

        {/* ─── BALANCE SHEET ─── */}
        {tab==="balance" && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Total Assets" value={fmt$(d.total_assets)} positive sm/>
            <Stat label="Total Liabilities" value={fmt$(d.total_liabilities)} positive={false} sm/>
            <Stat label="Stockholders' Equity" value={fmt$(d.stockholders_equity)} positive={d.stockholders_equity!=null?d.stockholders_equity>0:null} sm/>
            <Stat label="Current Ratio" value={fmtNum(d.current_ratio)} positive={d.current_ratio!=null?d.current_ratio>1:null} sm/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">Balance Sheet Composition</h3>
              <div className="space-y-3">
                {[{l:"Assets",v:d.total_assets,c:"primary"},{l:"Liabilities",v:d.total_liabilities,c:"loss"},{l:"Cash",v:d.total_cash,c:"cyan"},{l:"Debt",v:d.total_debt,c:"amber"}].map(({l,v,c})=>{
                  const mx = Math.max(d.total_assets||0,d.total_liabilities||0,1);
                  const pct = v ? (Math.abs(v)/mx)*100 : 0;
                  const colors:Record<string,string> = {primary:"from-emerald-500 to-emerald-400",loss:"from-red-500 to-red-400",cyan:"from-cyan-500 to-cyan-400",amber:"from-amber-500 to-amber-400"};
                  return (<div key={l} className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted w-14 shrink-0">{l}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1}} className={`h-full rounded-full bg-gradient-to-r ${colors[c]}`}/>
                    </div>
                    <span className="text-[10px] font-mono text-text-main w-16 text-right">{fmt$(v)}</span>
                  </div>);
                })}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">Key Ratios</h3>
              <MetricRow label="Debt-to-Equity" value={d.debt_to_equity!=null?`${d.debt_to_equity.toFixed(1)}%`:"—"} color={d.debt_to_equity&&d.debt_to_equity>100?"text-red-400":"text-emerald-400"}/>
              <MetricRow label="Current Ratio" value={fmtNum(d.current_ratio)} color={d.current_ratio&&d.current_ratio>1?"text-emerald-400":"text-red-400"}/>
              <MetricRow label="Total Cash" value={fmt$(d.total_cash)}/>
              <MetricRow label="Total Debt" value={fmt$(d.total_debt)}/>
              {d.total_cash!=null&&d.total_debt!=null && <MetricRow label="Net Cash" value={fmt$(d.total_cash-d.total_debt)} color={d.total_cash>d.total_debt?"text-emerald-400":"text-red-400"}/>}
            </div>
          </div>
        </motion.div>}

        {/* ─── CASH FLOW ─── */}
        {tab==="cash" && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Stat label="Operating Cash Flow" value={fmt$(d.operating_cashflow)} positive={d.operating_cashflow!=null?d.operating_cashflow>0:null} sm/>
            <Stat label="Free Cash Flow" value={fmt$(d.free_cashflow)} positive={d.free_cashflow!=null?d.free_cashflow>0:null} sm/>
            <Stat label="Cash on Hand" value={fmt$(d.total_cash)} positive sm/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">Cash Flow Analysis</h3>
              <MetricRow label="Operating Cash Flow" value={fmt$(d.operating_cashflow)} color={d.operating_cashflow&&d.operating_cashflow>0?"text-emerald-400":"text-red-400"}/>
              <MetricRow label="Free Cash Flow" value={fmt$(d.free_cashflow)} color={d.free_cashflow&&d.free_cashflow>0?"text-emerald-400":"text-red-400"}/>
              <MetricRow label="CapEx (est)" value={d.operating_cashflow!=null&&d.free_cashflow!=null?fmt$(d.operating_cashflow-d.free_cashflow):"—"}/>
              {d.free_cashflow&&d.market_cap && <MetricRow label="FCF Yield" value={`${((d.free_cashflow/d.market_cap)*100).toFixed(2)}%`} color="text-cyan-400"/>}
              {d.total_debt&&d.free_cashflow&&d.free_cashflow>0 && <MetricRow label="Debt Payoff (at FCF)" value={`${(d.total_debt/d.free_cashflow).toFixed(1)} years`}/>}
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-text-main mb-3">Cash Conversion</h3>
              {d.net_income_ttm&&d.operating_cashflow && <MetricRow label="OCF / Net Income" value={`${((d.operating_cashflow/d.net_income_ttm)*100).toFixed(0)}%`} color={d.operating_cashflow>d.net_income_ttm?"text-emerald-400":"text-amber-400"}/>}
              {d.total_revenue&&d.free_cashflow && <MetricRow label="FCF / Revenue" value={`${((d.free_cashflow/d.total_revenue)*100).toFixed(1)}%`}/>}
              {d.dividend_rate&&d.shares_outstanding&&d.free_cashflow && <MetricRow label="Dividends / FCF" value={`${((d.dividend_rate*d.shares_outstanding/d.free_cashflow)*100).toFixed(1)}%`}/>}
              <MetricRow label="EBITDA" value={fmt$(d.ebitda)}/>
            </div>
          </div>
        </motion.div>}

        {/* ─── ANALYSTS ─── */}
        {tab==="analysts" && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Recommendation" value={(d.analyst_recommendation||"—").toUpperCase()} positive={d.analyst_recommendation==="buy"||d.analyst_recommendation==="strongBuy"?true:d.analyst_recommendation==="sell"?false:null} sm/>
            <Stat label="Analyst Count" value={String(d.analyst_count||"—")} sm/>
            <Stat label="Mean Rating" value={d.analyst_mean_rating!=null?fmtNum(d.analyst_mean_rating):"—"} sub="1=Strong Buy, 5=Sell" sm/>
            <Stat label="Implied Upside" value={d.implied_upside_pct!=null?`${d.implied_upside_pct>0?"+":""}${d.implied_upside_pct.toFixed(1)}%`:"—"} positive={d.implied_upside_pct!=null?d.implied_upside_pct>0:null} sm/>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-text-main mb-3">Price Targets</h3>
            <div className="grid grid-cols-4 gap-4 mb-3">
              <MetricRow label="Low" value={d.target_low!=null?`$${d.target_low.toFixed(0)}`:"—"} color="text-red-400"/>
              <MetricRow label="Mean" value={d.target_mean!=null?`$${d.target_mean.toFixed(0)}`:"—"} color="text-amber-400"/>
              <MetricRow label="Median" value={d.target_median!=null?`$${d.target_median.toFixed(0)}`:"—"}/>
              <MetricRow label="High" value={d.target_high!=null?`$${d.target_high.toFixed(0)}`:"—"} color="text-emerald-400"/>
            </div>
            <PriceTargetBar low={d.target_low} mean={d.target_mean} high={d.target_high} current={d.price}/>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-text-main mb-3">Forward Guidance</h3>
            <MetricRow label="Forward EPS Estimate" value={d.forward_eps!=null?`$${fmtNum(d.forward_eps)}`:"—"} color="text-cyan-400"/>
            <MetricRow label="Trailing EPS" value={d.trailing_eps!=null?`$${fmtNum(d.trailing_eps)}`:"—"}/>
            <MetricRow label="Implied EPS Growth" value={d.trailing_eps&&d.forward_eps?`${((d.forward_eps/d.trailing_eps-1)*100).toFixed(1)}%`:"—"} color={d.trailing_eps&&d.forward_eps&&d.forward_eps>d.trailing_eps?"text-emerald-400":"text-red-400"}/>
            <MetricRow label="Revenue Growth (YoY)" value={fmtPct(d.revenue_growth)} color={d.revenue_growth&&d.revenue_growth>0?"text-emerald-400":"text-red-400"}/>
          </div>
        </motion.div>}


        <div className="text-center py-3"><p className="text-[10px] text-text-muted">Data sourced from SEC EDGAR XBRL & Yahoo Finance • {d.last_earnings_date && `Last earnings: ${d.last_earnings_date}`}</p></div>
      </motion.div></AnimatePresence>
    )}
  </>);
}
