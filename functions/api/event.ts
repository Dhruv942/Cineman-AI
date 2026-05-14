/**
 * Cloudflare Pages Function: /api/event
 *
 * Proxies analytics events to the Google Apps Script webhook so the webhook
 * URL never needs to be reachable directly from the extension (keeping
 * connect-src in manifest.json scoped to https://www.cinemanai.com).
 *
 * Used by:
 *  - The Chrome extension's onInstalled handler (install_completed event)
 *  - Any future server-attributed events that should not be client-fetched
 *
 * The public website analytics snippet still posts to the webhook directly
 * (no CSP constraint there). This endpoint exists for callers that cannot.
 *
 * Required environment variable in Cloudflare Pages:
 *   ANALYTICS_WEBHOOK_URL — Google Apps Script webhook full URL
 *
 * Accepts: POST with JSON body { event, properties?, source? }
 * Returns: { ok: true } (or error). Failures are non-fatal for the caller.
 */

interface Env {
  ANALYTICS_WEBHOOK_URL?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 200, headers: corsHeaders });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const webhook = (env.ANALYTICS_WEBHOOK_URL || '').trim();
  if (!webhook) {
    return json({ error: 'ANALYTICS_WEBHOOK_URL is not configured.', code: 'MISSING_WEBHOOK' }, 500);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Body must be valid JSON.' }, 400);
  }

  if (!payload || typeof payload !== 'object') {
    return json({ error: 'Body must be a JSON object.' }, 400);
  }

  const body = payload as Record<string, unknown>;
  if (typeof body.event !== 'string' || !body.event) {
    return json({ error: 'event (string) is required.' }, 400);
  }

  // Defense-in-depth size cap. Apps Script will silently truncate huge payloads
  // anyway; reject early so the caller gets a real error.
  const serialized = JSON.stringify({
    event: body.event,
    properties: body.properties || {},
    source: body.source || 'extension',
    timestamp: new Date().toISOString(),
  });
  if (serialized.length > 8192) {
    return json({ error: 'Payload too large (>8KB).' }, 413);
  }

  try {
    // no-store fetch; we do not need the upstream response body and don't want it cached.
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: serialized,
    });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Proxy error' }, 502);
  }
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
