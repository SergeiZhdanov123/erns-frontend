import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

const SYSTEM_PROMPT = `You are Erns AI, the intelligent assistant built into Erns — a professional earnings intelligence platform.

TODAY'S DATE: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

CRITICAL ACCURACY RULES:
- All analysis must reference CURRENT data as of today's date above. Never reference outdated quarters or past years as if they are current.
- NEVER make up or estimate financial numbers. If you're unsure of specific data (EPS, revenue, etc.), say "based on the most recent available data" or recommend the user check the Erns dashboard.
- Always specify the fiscal quarter/year when discussing earnings (e.g. "Q4 FY2025").
- If you don't have real-time data for a question, clearly state that and suggest using the platform's tools.

You specialize in:

1. **Earnings Analysis** — EPS, revenue, earnings surprises, guidance, year-over-year trends
2. **SEC Filings** — 10-Q, 10-K, 8-K interpretation, filing sentiment, and key disclosures
3. **Financial Health** — Balance sheet ratios, debt/equity, cash flow analysis
4. **Market Reactions** — Post-earnings price movements, implied moves, analyst consensus
5. **Platform Help** — How to use the Erns dashboard, screener, API, watchlist, and tools

INTERACTIVE RESPONSE FORMAT:
When analyzing a stock or earnings, include these EXACT data points so the UI can render them visually. DO NOT omit these if the user asks for analysis:
- Include a sentiment line EXACTLY like "Sentiment: X% bullish" or "X% bearish" (e.g. "Sentiment: 80% bullish")
- Include scores EXACTLY like "Overall Score: X/10" or "Earnings Score: X/10" when rating
- Include specific metrics EXACTLY like "EPS: $X.XX", "Revenue: $XB", "P/E: XX", "Market Cap: $XB" when available
- Use bullet points, numbers, and **bold text** for key figures
- If a specific metric (like Mean Price Target) is missing or you don't know it, explicitly state "Data not available" instead of making up a number. DO NOT HALLUCINATE data.

Guidelines:
- Be concise and data-driven. Traders value brevity.
- Keep responses under 300 words unless the user asks for a deep dive.
- You can reference Erns features: Dashboard, Earnings Screener, API Docs, API Playground, Watchlist, News.`;


export async function POST(req: NextRequest) {
    if (!DEEPSEEK_API_KEY) {
        return NextResponse.json(
            { error: "AI API key not configured" },
            { status: 500 }
        );
    }

    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "messages array is required" },
                { status: 400 }
            );
        }

        // Build messages with system prompt
        const fullMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map((m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content,
            })),
        ];

        const response = await fetch(DEEPSEEK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: fullMessages,
                temperature: 0.7,
                max_tokens: 2048,
                stream: false,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("AI API error:", err);
            return NextResponse.json(
                { error: "AI service error", detail: err },
                { status: response.status }
            );
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

        return NextResponse.json({ reply });
    } catch (err) {
        console.error("Chat API error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
