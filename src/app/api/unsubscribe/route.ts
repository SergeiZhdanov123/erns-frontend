import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import crypto from "crypto";

/**
 * Unsubscribe endpoint — handles email opt-outs.
 * Uses a signed token to identify the user and type securely.
 * 
 * GET /api/unsubscribe?token=...&type=watchlist|earnings
 */

const SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "erns-unsub-fallback-secret";

export function generateUnsubToken(email: string, type: string): string {
    const payload = `${email}::${type}`;
    const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
    const encoded = Buffer.from(payload).toString("base64url");
    return `${encoded}.${sig}`;
}

function verifyUnsubToken(token: string): { email: string; type: string } | null {
    try {
        const [encoded, sig] = token.split(".");
        if (!encoded || !sig) return null;
        const payload = Buffer.from(encoded, "base64url").toString("utf-8");
        const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
        if (sig !== expectedSig) return null;
        const [email, type] = payload.split("::");
        if (!email || !type) return null;
        return { email, type };
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (!token) {
        return new NextResponse(unsubPage("Invalid Link", "The unsubscribe link is missing required parameters."), {
            status: 400,
            headers: { "Content-Type": "text/html" },
        });
    }

    const verified = verifyUnsubToken(token);
    if (!verified) {
        return new NextResponse(unsubPage("Invalid Link", "This unsubscribe link is invalid or expired."), {
            status: 400,
            headers: { "Content-Type": "text/html" },
        });
    }

    const unsubType = type || verified.type;

    try {
        await connectToDatabase();

        const update: Record<string, boolean> = {};
        if (unsubType === "watchlist") {
            update.watchlistEmailsOptOut = true;
        } else if (unsubType === "earnings") {
            update.earningsAlertsOptOut = true;
        } else {
            update.watchlistEmailsOptOut = true;
            update.earningsAlertsOptOut = true;
        }

        await User.findOneAndUpdate(
            { email: verified.email.toLowerCase() },
            { $set: update }
        );

        const label = unsubType === "watchlist" ? "Daily Watchlist Digest" :
            unsubType === "earnings" ? "Earnings Alerts" : "all Erns emails";

        return new NextResponse(
            unsubPage("Unsubscribed ✓", `You've been unsubscribed from ${label}. You can re-enable these emails anytime in your Erns dashboard settings.`),
            { status: 200, headers: { "Content-Type": "text/html" } }
        );
    } catch (error) {
        console.error("[Unsubscribe] Error:", error);
        return new NextResponse(
            unsubPage("Error", "Something went wrong. Please try again later."),
            { status: 500, headers: { "Content-Type": "text/html" } }
        );
    }
}

function unsubPage(title: string, message: string): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} — Erns</title>
<style>
body{margin:0;padding:0;background:#0a0f0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#e0e0e0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{max-width:420px;padding:48px;background:linear-gradient(135deg,#0d1a0d,#0a120a);border:1px solid #1a2e1a;border-radius:16px;text-align:center}
h1{color:#10b981;font-size:24px;margin:0 0 16px}
p{color:#b0c0b0;font-size:14px;line-height:1.6;margin:0}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
