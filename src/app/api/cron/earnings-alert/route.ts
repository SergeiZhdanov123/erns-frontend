import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { clerkClient } from "@clerk/nextjs/server";
import User from "@/models/user";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { generateUnsubToken } from "@/app/api/unsubscribe/route";

/**
 * Earnings Alert Cron — Background checker for live earnings drops
 * 
 * This runs periodically (e.g., every 5 minutes during market hours).
 * It checks if any monitored tickers have had earnings drop.
 * When detected, it creates a notification AND sends an email.
 * 
 * Verifies user exists in Clerk (not deleted/banned) before sending.
 * 
 * Since live-earnings monitoring is client-side (localStorage), this cron
 * checks tickers from the backend watchlist that have earnings expected today.
 */

export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        await connectToDatabase();

        // Build active Clerk users set to prevent sending to deleted/banned accounts
        const getActiveClerkEmails = async () => {
            const emails = new Set<string>();
            try {
                const client = await clerkClient();
                let offset = 0;
                let hasMore = true;
                while (hasMore) {
                    const { data: cUsers } = await client.users.getUserList({ limit: 100, offset });
                    for (const u of cUsers) {
                        if (!u.banned) {
                            for (const ea of u.emailAddresses) emails.add(ea.emailAddress.toLowerCase());
                        }
                    }
                    hasMore = cUsers.length === 100;
                    offset += 100;
                }
            } catch (err) { console.error("[Earnings Alert] Clerk fetch error:", err); }
            return emails;
        };

        const activeEmails = await getActiveClerkEmails();

        // Find users who haven't opted out of earnings alerts
        const allUsers = await User.find({
            earningsAlertsOptOut: { $ne: true },
            plan: { $exists: true, $ne: null },
        }).select("email name").lean();

        // Filter to only users active in Clerk
        const users = allUsers.filter(u => activeEmails.has(u.email.toLowerCase()));

        if (!users || users.length === 0) {
            return NextResponse.json({ success: true, message: "No eligible users", sent: 0 });
        }

        // Get today's earnings calendar
        let todayTickers: string[] = [];
        try {
            const calRes = await fetch(`${config.apiUrl}/calendar/today`, {
                signal: AbortSignal.timeout(10000)
            });
            if (calRes.ok) {
                const calData = await calRes.json();
                todayTickers = (calData.events || []).map((e: { ticker: string }) => e.ticker);
            }
        } catch {
            // calendar may not be available
        }

        if (todayTickers.length === 0) {
            return NextResponse.json({ success: true, message: "No earnings today", sent: 0 });
        }

        let sent = 0;
        const errors: string[] = [];

        for (const user of users) {
            try {
                // Get user's watchlist
                const wlRes = await fetch(
                    `${config.apiUrl}/user/watchlist/${encodeURIComponent(user.email)}`,
                    { signal: AbortSignal.timeout(10000) }
                );
                if (!wlRes.ok) continue;
                const wlData = await wlRes.json();
                const userTickers: string[] = (wlData.items || []).map((i: { ticker: string }) => i.ticker);

                // Find tickers in user's watchlist that have earnings today
                const matchingTickers = todayTickers.filter(t => userTickers.includes(t));
                if (matchingTickers.length === 0) continue;

                // Check each ticker for dropped earnings
                for (const ticker of matchingTickers) {
                    try {
                        const monRes = await fetch(
                            `${config.apiUrl}/earnings/live-monitor?ticker=${ticker}`,
                            { signal: AbortSignal.timeout(10000) }
                        );
                        if (!monRes.ok) continue;
                        const monData = await monRes.json();

                        if (monData.status === "dropped") {
                            // Check if we already notified for this
                            const existing = await Notification.findOne({
                                userId: user.email, // We'll use email as fallback
                                ticker: ticker,
                                type: "earnings_drop",
                                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                            });

                            if (existing) continue; // Already notified

                            // Create notification
                            await Notification.create({
                                userId: user.email,
                                type: "earnings_drop",
                                title: `${ticker} Earnings Dropped!`,
                                message: `${monData.company_name || ticker} just reported earnings. ` +
                                    `EPS: ${monData.eps_actual || "N/A"} (Est: ${monData.eps_estimate || "N/A"})` +
                                    `${monData.beat_eps ? " — BEAT ✅" : " — MISS ❌"}`,
                                ticker: ticker,
                            });

                            // Send email
                            const firstName = (user.name || "").split(" ")[0] || "there";
                            const unsubToken = generateUnsubToken(user.email, "earnings");
                            const unsubUrl = `${config.appUrl}/api/unsubscribe?token=${unsubToken}&type=earnings`;
                            const html = earningsDropEmailHtml(firstName, monData, unsubUrl);

                            await sendEmail(
                                user.email,
                                `${monData.beat_eps ? "🟢" : "🔴"} ${ticker} Earnings Just Dropped — ${monData.beat_eps ? "BEAT" : "MISS"}`,
                                html
                            );
                            sent++;
                        }
                    } catch {
                        // Skip this ticker
                    }
                    await new Promise(r => setTimeout(r, 200));
                }
            } catch (err) {
                errors.push(`${user.email}: ${err instanceof Error ? err.message : "unknown"}`);
            }
        }

        console.log(`[Earnings Alert] Sent ${sent} notifications`);
        return NextResponse.json({ success: true, sent, errors: errors.length > 0 ? errors : undefined });
    } catch (error) {
        console.error("[Earnings Alert] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

function earningsDropEmailHtml(firstName: string, data: Record<string, unknown>, unsubUrl: string): string {
    const ticker = String(data.ticker || "");
    const company = String(data.company_name || ticker);
    const beat = Boolean(data.beat_eps);
    const epsActual = data.eps_actual ? String(data.eps_actual) : "N/A";
    const epsEst = data.eps_estimate ? String(data.eps_estimate) : "N/A";
    const revActual = data.revenue_actual ? String(data.revenue_actual) : "N/A";
    const revEst = data.revenue_estimate ? String(data.revenue_estimate) : "N/A";
    const headline = data.headline ? String(data.headline) : "";
    const year = new Date().getFullYear();
    
    const accentColor = beat ? "#10b981" : "#ef4444";
    const statusEmoji = beat ? "🟢" : "🔴";
    const statusText = beat ? "EARNINGS BEAT" : "EARNINGS MISS";

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#0a0f0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#e0e0e0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f0a;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0d1a0d 0%,#0a120a 100%);border-radius:16px;overflow:hidden;border:1px solid #1a2e1a;">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,${accentColor} 0%,${beat ? "#059669" : "#dc2626"} 100%);padding:30px 40px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${statusEmoji} ${ticker} ${statusText}</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${company}</p>
</td></tr>

<!-- BODY -->
<tr><td style="padding:30px 40px;">
<p style="font-size:15px;color:#e0e0e0;margin:0 0 20px;">Hey <strong style="color:#34d399;">${firstName}</strong>,</p>

${headline ? `<p style="font-size:14px;color:#b0c0b0;margin:0 0 20px;padding:12px;background:#0d1a0d;border-radius:8px;border-left:3px solid ${accentColor};">${headline}</p>` : ""}

<table width="100%" cellpadding="0" cellspacing="8" style="margin:0 0 20px;">
<tr>
<td width="50%" style="padding:15px;background:#0d1a0d;border-radius:10px;text-align:center;border:1px solid #1a2e1a;">
    <p style="margin:0;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;">EPS Actual</p>
    <p style="margin:4px 0 0;font-size:22px;font-weight:700;font-family:monospace;color:${accentColor};">${epsActual}</p>
</td>
<td width="50%" style="padding:15px;background:#0d1a0d;border-radius:10px;text-align:center;border:1px solid #1a2e1a;">
    <p style="margin:0;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;">EPS Estimate</p>
    <p style="margin:4px 0 0;font-size:22px;font-weight:700;font-family:monospace;color:#e0e0e0;">${epsEst}</p>
</td>
</tr>
<tr>
<td width="50%" style="padding:15px;background:#0d1a0d;border-radius:10px;text-align:center;border:1px solid #1a2e1a;">
    <p style="margin:0;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;">Revenue Actual</p>
    <p style="margin:4px 0 0;font-size:16px;font-weight:700;font-family:monospace;color:#e0e0e0;">${revActual}</p>
</td>
<td width="50%" style="padding:15px;background:#0d1a0d;border-radius:10px;text-align:center;border:1px solid #1a2e1a;">
    <p style="margin:0;font-size:10px;color:#6b8a6b;text-transform:uppercase;letter-spacing:1px;">Revenue Estimate</p>
    <p style="margin:4px 0 0;font-size:16px;font-weight:700;font-family:monospace;color:#e0e0e0;">${revEst}</p>
</td>
</tr>
</table>

<div style="text-align:center;margin:24px 0;">
<a href="${config.appUrl}/live-earnings"
   style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${accentColor},${beat ? "#059669" : "#dc2626"});color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 15px ${accentColor}44;">
View Full Details →
</a>
</div>
</td></tr>

<!-- FOOTER -->
<tr><td style="padding:20px 40px 30px;text-align:center;border-top:1px solid #1a2e1a;">
<p style="margin:0;color:#4a6a4a;font-size:12px;">© ${year} Erns — Built for serious investors</p>
<p style="margin:5px 0 0;color:#3a5a3a;font-size:11px;">
<a href="${unsubUrl}" style="color:#3a5a3a;text-decoration:underline;">Unsubscribe</a> from earnings alerts
</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}
