import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email";

// GET /api/notifications — Fetch user's notifications
export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const notifications = await Notification.find({ userId: user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = await Notification.countDocuments({
            userId: user.id,
            read: false,
        });

        return NextResponse.json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// POST /api/notifications — Create a notification or mark as read
export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        await connectToDatabase();

        // Mark as read
        if (body.action === "mark-read" && body.id) {
            await Notification.findOneAndUpdate(
                { _id: body.id, userId: user.id },
                { read: true }
            );
            return NextResponse.json({ success: true });
        }

        // Mark all as read
        if (body.action === "mark-all-read") {
            await Notification.updateMany(
                { userId: user.id, read: false },
                { read: true }
            );
            return NextResponse.json({ success: true });
        }

        // Create notification (for internal use / testing)
        if (body.title && body.message) {
            const notif = await Notification.create({
                userId: user.id,
                type: body.type || "system",
                title: body.title,
                message: body.message,
                ticker: body.ticker,
            });

            // Fire-and-forget email to user's primary email
            const userEmail = user.emailAddresses?.[0]?.emailAddress;
            if (userEmail) {
                const isEarnings = body.type === "earnings_drop";
                const accentColor = isEarnings
                    ? (body.title?.includes("BEAT") ? "#10b981" : "#ef4444")
                    : "#10b981";

                sendEmail(
                    userEmail,
                    `${body.ticker ? `[${body.ticker}] ` : ""}${body.title}`,
                    `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0f0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#e0e0e0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f0a;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0d1a0d,#0a120a);border-radius:16px;border:1px solid #1a2e1a;">
<tr><td style="background:linear-gradient(135deg,${accentColor},${accentColor}cc);padding:24px 32px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">${body.title}</h1>
</td></tr>
<tr><td style="padding:28px 32px;">
${body.ticker ? `<div style="display:inline-block;padding:4px 12px;background:${accentColor}18;border:1px solid ${accentColor}33;border-radius:8px;font-size:13px;font-weight:700;color:${accentColor};font-family:monospace;margin-bottom:16px;">${body.ticker}</div>` : ""}
<p style="margin:0;font-size:14px;color:#b0c0b0;line-height:1.6;">${body.message}</p>
<div style="text-align:center;margin:24px 0;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ernsdata.com"}/dashboard" style="display:inline-block;padding:10px 28px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:13px;">Open Dashboard →</a>
</div>
</td></tr>
<tr><td style="padding:16px 32px;text-align:center;border-top:1px solid #1a2e1a;">
<p style="margin:0;color:#4a6a4a;font-size:11px;">© ${new Date().getFullYear()} Erns — ernsdata.com</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
                ).catch(() => { /* email is non-critical */ });
            }

            return NextResponse.json({ success: true, notification: notif }, { status: 201 });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Failed to process notification:", error);
        return NextResponse.json(
            { error: "Failed to process notification" },
            { status: 500 }
        );
    }
}
