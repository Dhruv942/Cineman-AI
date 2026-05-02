/**
 * Cloudflare Pages Function: /api/gemini
 * Proxies Gemini API requests so the API key stays server-side.
 */

interface Env {
  GEMINI_API_KEY?: string;
  API_KEY?: string;
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 200, headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = (env.GEMINI_API_KEY || env.API_KEY || "").trim();

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "GEMINI_API_KEY is not configured on the server. Add it in Cloudflare Pages → Settings → Environment Variables.",
        code: "MISSING_API_KEY",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.text();
    const url = `${GEMINI_API_URL}?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[functions/api/gemini]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Proxy error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Reject any other method
export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === "OPTIONS" || request.method === "POST") {
    // Handled by specific exports above
    return new Response(null, { status: 405, headers: corsHeaders });
  }
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};
