import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { clerkClient } from "@clerk/nextjs/server";
import User from "@/models/user";
import { sendEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { generateUnsubToken } from "@/app/api/unsubscribe/route";

/**
 * Daily Watchlist Digest — Cron job
 * 
 * For each user with a watchlist:
 * 1. Verifies user exists in Clerk (not deleted/banned)
 * 2. Fetches their watchlist tickers from the backend
 * 3. Gets current price/change data for each ticker
 * 4. Sends a beautifully formatted daily digest email
 * 
 * Trigger: Vercel Cron, external scheduler, or manual curl
 * Security: CRON_SECRET header required in production
 */

interface TickerData {
    ticker: string;
    company_name?: string;
    price?: number;
    change?: number;
    change_pct?: number;
    trailing_eps?: number;
    forward_eps?: number;
    revenue_growth?: number;
    analyst_recommendation?: string;
    market_cap?: number;
}

/**
 * Build a Set of active Clerk user emails.
 * Paginates through all Clerk users to get the full list.
 */
async function getActiveClerkEmails(): Promise<Set<string>> {
    const emails = new Set<string>();
    try {
        const client = await clerkClient();
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const { data: users } = await client.users.getUserList({ limit, offset });
            for (const user of users) {
                // Only include users who are not banned
                if (user.banned) continue;
                for (const ea of user.emailAddresses) {
                    emails.add(ea.emailAddress.toLowerCase());
                }
            }
            hasMore = users.length === limit;
            offset += limit;
        }
    } catch (err) {
        console.error("[Daily Watchlist] Failed to fetch Clerk users:", err);
    }
    return emails;
}

export async function GET(request: NextRequest) {
    // Verify cron secret in production
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        await connectToDatabase();

        // Get active Clerk users first — prevents sending to deleted/banned accounts
        const activeEmails = await getActiveClerkEmails();
        console.log(`[Daily Watchlist] Found ${activeEmails.size} active Clerk users`);

        // Find all users who have NOT opted out
        const users = await User.find({
            watchlistEmailsOptOut: { $ne: true },
            plan: { $exists: true, $ne: null },
        }).select("email name").lean();

        if (!users || users.length === 0) {
            return NextResponse.json({ success: true, message: "No eligible users", sent: 0 });
        }

        // Filter to only users who exist in Clerk
        const validUsers = users.filter(u => activeEmails.has(u.email.toLowerCase()));
        console.log(`[Daily Watchlist] ${validUsers.length}/${users.length} users verified in Clerk`);

        let sent = 0;
        let skipped = 0;
        const errors: string[] = [];
        for (const user of validUsers) {
            try {
                // Fetch user's watchlist from backend 
                const wlRes = await fetch(
                    `${config.apiUrl}/user/watchlist/${encodeURIComponent(user.email)}`,
                    { signal: AbortSignal.timeout(10000) }
                );

                if (!wlRes.ok) continue;
                const wlData = await wlRes.json();
                const tickers: string[] = (wlData.items || []).map((i: { ticker: string }) => i.ticker);

                if (tickers.length === 0) continue;

                // Fetch data for each ticker (limit to 10 to avoid timeouts)
                const tickerData: TickerData[] = [];
                for (const ticker of tickers.slice(0, 10)) {
                    try {
                        const res = await fetch(
                            `${config.apiUrl}/company/${ticker}/full-financials`,
                            { signal: AbortSignal.timeout(15000) }
                        );
                        if (res.ok) {
                            const d = await res.json();
                            tickerData.push({
                                ticker: d.ticker,
                                company_name: d.company_name,
                                price: d.price,
                                change: d.change,
                                change_pct: d.change_pct,
                                trailing_eps: d.trailing_eps,
                                forward_eps: d.forward_eps,
                                revenue_growth: d.revenue_growth,
                                analyst_recommendation: d.analyst_recommendation,
                                market_cap: d.market_cap,
                            });
                        }
                    } catch {
                        tickerData.push({ ticker });
                    }
                    // Small delay between requests
                    await new Promise(r => setTimeout(r, 300));
                }

                if (tickerData.length === 0) continue;

                // Generate email
                const firstName = (user.name || "").split(" ")[0] || "there";
                const unsubToken = generateUnsubToken(user.email, "watchlist");
                const unsubUrl = `${config.appUrl}/api/unsubscribe?token=${unsubToken}&type=watchlist`;
                const html = watchlistDigestHtml(firstName, tickerData, unsubUrl);

                await sendEmail(
                    user.email,
                    `📊 Your Daily Watchlist Report — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
                    html
                );
                sent++;

                // Throttle emails
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                errors.push(`${user.email}: ${err instanceof Error ? err.message : "unknown"}`);
            }
        }

        console.log(`[Daily Watchlist] Sent ${sent}/${users.length} emails`);

        return NextResponse.json({
            success: true,
            total: users.length,
            sent,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("[Daily Watchlist] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

function fmt$(v?: number | null): string {
    if (v == null || isNaN(v)) return "—";
    const a = Math.abs(v), s = v < 0 ? "-" : "";
    if (a >= 1e12) return `${s}$${(a / 1e12).toFixed(1)}T`;
    if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(1)}B`;
    if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)}M`;
    return `${s}$${a.toFixed(2)}`;
}

function watchlistDigestHtml(firstName: string, tickers: TickerData[], unsubUrl: string): string {
    const year = new Date().getFullYear();
    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const tickerRows = tickers.map(t => {
        const changeColor = (t.change_pct ?? 0) >= 0 ? "#10b981" : "#ef4444";
        const changeSign = (t.change_pct ?? 0) >= 0 ? "+" : "";
        const recColor = t.analyst_recommendation === "buy" ? "#10b981" :
            t.analyst_recommendation === "sell" ? "#ef4444" : "#f59e0b";

        return `
        <tr>
            <td style="padding:12px;border-bottom:1px solid #1a2e1a;">
                <span style="font-family:monospace;font-weight:700;color:#10b981;font-size:14px;">${t.ticker}</span>
                ${t.company_name ? `<br/><span style="font-size:11px;color:#6b8a6b;">${t.company_name}</span>` : ""}
            </td>
            <td style="padding:12px;text-align:right;border-bottom:1px solid #1a2e1a;">
                <span style="font-family:monospace;font-size:14px;color:#e0e0e0;">${t.price != null ? `$${t.price.toFixed(2)}` : "—"}</span>
            </td>
            <td style="padding:12px;text-align:right;border-bottom:1px solid #1a2e1a;">
                <span style="font-family:monospace;font-size:13px;font-weight:600;color:${changeColor};">
                    ${t.change_pct != null ? `${changeSign}${t.change_pct.toFixed(2)}%` : "—"}
                </span>
            </td>
            <td style="padding:12px;text-align:right;border-bottom:1px solid #1a2e1a;">
                <span style="font-family:monospace;font-size:13px;color:#e0e0e0;">
                    ${t.trailing_eps != null ? `$${t.trailing_eps.toFixed(2)}` : "—"}
                </span>
            </td>
            <td style="padding:12px;text-align:right;border-bottom:1px solid #1a2e1a;">
                ${t.analyst_recommendation ? `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;background:${recColor}22;color:${recColor};">${t.analyst_recommendation}</span>` : "—"}
            </td>
        </tr>`;
    }).join("");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#0a0f0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#e0e0e0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f0a;padding:40px 0;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0d1a0d 0%,#0a120a 100%);border-radius:16px;overflow:hidden;border:1px solid #1a2e1a;">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:30px 40px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">📊 Daily Watchlist Report</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${dateStr}</p>
</td></tr>

<!-- GREETING -->
<tr><td style="padding:30px 40px 10px;">
<p style="font-size:15px;color:#e0e0e0;margin:0;">Hey <strong style="color:#34d399;">${firstName}</strong>,</p>
<p style="font-size:13px;color:#7a9a7a;margin:8px 0 0;">Here's today's snapshot for your ${tickers.length} watchlist ${tickers.length === 1 ? "stock" : "stocks"}:</p>
</td></tr>

<!-- TABLE -->
<tr><td style="padding:20px 40px 30px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #1a2e1a;">
<tr style="background:#0d1a0d;">
    <th style="padding:10px 12px;text-align:left;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a2e1a;">Symbol</th>
    <th style="padding:10px 12px;text-align:right;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a2e1a;">Price</th>
    <th style="padding:10px 12px;text-align:right;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a2e1a;">Change</th>
    <th style="padding:10px 12px;text-align:right;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a2e1a;">EPS</th>
    <th style="padding:10px 12px;text-align:right;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a2e1a;">Rating</th>
</tr>
${tickerRows}
</table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 40px 30px;text-align:center;">
<a href="${config.appUrl}/dashboard"
   style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 15px rgba(16,185,129,0.3);">
Open Dashboard →
</a>
</td></tr>

<!-- FOOTER -->
<tr><td style="padding:20px 40px 30px;text-align:center;border-top:1px solid #1a2e1a;">
<p style="margin:0;color:#4a6a4a;font-size:12px;">© ${year} Erns — Built for serious investors</p>
<p style="margin:5px 0 0;color:#3a5a3a;font-size:11px;">
<a href="${unsubUrl}" style="color:#3a5a3a;text-decoration:underline;">Unsubscribe</a> from daily watchlist emails
</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}
