/**
 * Cloudflare Pages Function: /api/omdb
 *
 * Proxies OMDB API requests so the API key stays server-side.
 * Used by both the web app (MovieCard poster fetch) and the Chrome extension
 * (background.js OMDB rating lookups for the rating overlay on Netflix/Prime/Hotstar).
 *
 * Required environment variable in Cloudflare Pages:
 *   OMDB_API_KEY  — your OMDB API key
 *
 * Query params accepted (forwarded to OMDB as-is):
 *   t        — movie title (required, OR i for IMDb id)
 *   i        — IMDb id
 *   y        — year
 *   type     — movie / series / episode
 *   plot     — short / full
 */

interface Env {
  OMDB_API_KEY?: string;
}

const OMDB_URL = 'https://www.omdbapi.com/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 200, headers: corsHeaders });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = (env.OMDB_API_KEY || '').trim();
  if (!apiKey) {
    return json(
      { error: 'OMDB_API_KEY is not configured on the server.', code: 'MISSING_API_KEY' },
      500
    );
  }

  try {
    const inUrl = new URL(request.url);
    const params = new URLSearchParams();
    // Allow only known params (defense in depth — never let callers inject &apikey=)
    for (const k of ['t', 'i', 'y', 'type', 'plot']) {
      const v = inUrl.searchParams.get(k);
      if (v) params.set(k, v);
    }
    params.set('apikey', apiKey);

    const upstream = await fetch(`${OMDB_URL}?${params.toString()}`);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Proxy error' }, 500);
  }
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
