import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// CORS headers for production
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200)
      .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"])
      .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Max-Age", corsHeaders["Access-Control-Max-Age"])
      .end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405)
      .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .json({ error: "Method not allowed" });
    return;
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY)?.trim();
  if (!apiKey) {
    res.status(500)
      .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .setHeader("Content-Type", "application/json")
      .json({
        error: "GEMINI_API_KEY is not configured on the server. Add it in Vercel → Project Settings → Environment Variables.",
        code: "MISSING_API_KEY",
      });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    
    // Construct the Gemini API URL with the key as a query parameter
    const url = `${GEMINI_API_URL}?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    res.status(response.status)
      .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .setHeader("Content-Type", "application/json")
      .json(data);
  } catch (error) {
    console.error("[api/gemini]", error);
    res.status(500)
      .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .json({ error: error instanceof Error ? error.message : "Proxy error" });
  }
}
