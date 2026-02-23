import type { VercelRequest, VercelResponse } from "@vercel/node";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// CORS headers for production (allow your domain and localhost for dev)
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*", // Restrict to https://www.cinemanai.com in production if preferred
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
    res.status(200).setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"])
      .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Max-Age", corsHeaders["Access-Control-Max-Age"])
      .end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"]).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    res.status(500).setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"]).json({ error: "PERPLEXITY_API_KEY is not configured" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    res.status(response.status)
      .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .setHeader("Content-Type", "application/json")
      .json(data);
  } catch (error) {
    console.error("[api/perplexity]", error);
    res.status(500)
      .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
      .json({ error: error instanceof Error ? error.message : "Proxy error" });
  }
}
