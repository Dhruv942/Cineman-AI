/**
 * Cloudflare Pages Function: /api/watchmode
 *
 * Proxies Watchmode API requests so the API key stays server-side.
 * Used by the Chrome extension's background.js for the streaming-platform
 * lookup that powers the "Where to watch" CTA on movie cards.
 *
 * Required environment variable in Cloudflare Pages:
 *   WATCHMODE_API_KEY  — your Watchmode API key
 *
 * Query params:
 *   path     — required, the Watchmode path to call, e.g.
 *                "/search/?search_field=name&search_value=Inception"
 *                "/title/12345/sources/"
 *              We re-attach &apiKey ourselves; never pass it from the client.
 */

interface Env {
  WATCHMODE_API_KEY?: string;
}

const WATCHMODE_BASE = 'https://api.watchmode.com/v1';

// Hard allow-list of Watchmode endpoints we proxy. Prevents the proxy from
// being used as an open relay for arbitrary Watchmode calls.
const ALLOWED_PATH_PREFIXES = ['/search/', '/title/'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 200, headers: corsHeaders });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = (env.WATCHMODE_API_KEY || '').trim();
  if (!apiKey) {
    return json(
      { error: 'WATCHMODE_API_KEY is not configured on the server.', code: 'MISSING_API_KEY' },
      500
    );
  }

  try {
    const inUrl = new URL(request.url);
    const rawPath = inUrl.searchParams.get('path') || '';

    // Reject empty or non-allow-listed paths
    if (!rawPath || !ALLOWED_PATH_PREFIXES.some((p) => rawPath.startsWith(p))) {
      return json({ error: 'Unsupported Watchmode path' }, 400);
    }

    // Strip any client-supplied apiKey/apikey to avoid double-injection
    const [pathOnly, query = ''] = rawPath.split('?');
    const sp = new URLSearchParams(query);
    sp.delete('apiKey');
    sp.delete('apikey');
    sp.set('apiKey', apiKey);

    const upstreamUrl = `${WATCHMODE_BASE}${pathOnly}?${sp.toString()}`;
    const upstream = await fetch(upstreamUrl);
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // Sources change fairly slowly; 30 min cache is fine
        'Cache-Control': 'public, max-age=1800',
      },
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
