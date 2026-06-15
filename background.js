/**
 * CineMan Background Service Worker
 *
 * Imports:
 *   - tag-taxonomy.js  → Tag definitions, buildTagsFromTMDB()
 *   - tmdb-service.js  → TMDB API (search, details, credits, keywords, similar)
 *   - taste-engine.js  → Taste profile building + scoring
 *
 * Own services:
 *   - OMDB ratings (for IMDb/RT badges)
 *   - Watchmode streaming providers
 *   - Chrome history extraction
 *   - Message handler for all content script requests
 */

// ==========================================
// IMPORT MODULES
// ==========================================
importScripts('tag-taxonomy.js', 'tmdb-service.js', 'taste-engine.js');

// ==========================================
// LOGGER (env-gated; quiet in production)
// ==========================================
// Toggle dev logging by setting chrome.storage.local.set({ cineman_debug: true })
// in DevTools. In production builds we ship with this flag off and only errors
// surface in the console.
const cmLogger = (() => {
  let _debug = false;
  try {
    chrome.storage.local.get('cineman_debug', (r) => { _debug = !!r.cineman_debug; });
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.cineman_debug) _debug = !!changes.cineman_debug.newValue;
    });
  } catch (e) { /* SW outside chrome context: shouldn't happen */ }
  const fmt = (a) => (typeof a === 'string' ? a : a);
  return {
    log:   (...a) => { if (_debug) console.log('[CineMan]', ...a.map(fmt)); },
    warn:  (...a) => { if (_debug) console.warn('[CineMan]', ...a.map(fmt)); },
    error: (...a) => { console.error('[CineMan]', ...a.map(fmt)); },
    isDebug: () => _debug,
  };
})();

// Clean up stale null TMDB caches on startup so failed enrichments get retried
chrome.storage.local.get(null, (all) => {
  const keysToRemove = [];
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith('tmdb_') && value && value.data === null) {
      keysToRemove.push(key);
    }
  }
  if (keysToRemove.length > 0) {
    chrome.storage.local.remove(keysToRemove);
    cmLogger.log('Cleared ' + keysToRemove.length + ' stale null TMDB cache entries');
  }
});

// ==========================================
// API CONFIGURATIONS
// ==========================================
//
// IMPORTANT: API keys are NEVER bundled with the extension.
// The extension calls our Cloudflare Pages proxies which inject the keys
// server-side. To override the proxy host (e.g. for local dev), set
// chrome.storage.local.set({ cineman_proxy_origin: 'http://localhost:8788' }).

const DEFAULT_PROXY_ORIGIN = 'https://www.cinemanai.com';
let _proxyOrigin = DEFAULT_PROXY_ORIGIN;
try {
  chrome.storage.local.get('cineman_proxy_origin', (r) => {
    if (r.cineman_proxy_origin && typeof r.cineman_proxy_origin === 'string') {
      _proxyOrigin = r.cineman_proxy_origin.replace(/\/$/, '');
    }
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.cineman_proxy_origin && changes.cineman_proxy_origin.newValue) {
      _proxyOrigin = String(changes.cineman_proxy_origin.newValue).replace(/\/$/, '');
    }
  });
} catch (e) { /* SW outside chrome context: shouldn't happen */ }
const proxyUrl = (path) => `${_proxyOrigin}${path}`;

// Well-known streaming platforms (for Watchmode filtering)
const POPULAR_PLATFORMS = new Map([
  ['netflix', 'Netflix'],
  ['prime video', 'Prime Video'],
  ['amazon prime video', 'Prime Video'],
  ['amazon', 'Prime Video'],
  ['disney+', 'Disney+'],
  ['disney+ hotstar', 'Disney+ Hotstar'],
  ['hotstar', 'Disney+ Hotstar'],
  ['jiocinema', 'JioCinema'],
  ['zee5', 'ZEE5'],
  ['sonyliv', 'SonyLIV'],
  ['sony liv', 'SonyLIV'],
  ['voot', 'Voot'],
  ['mubi', 'MUBI'],
  ['apple tv+', 'Apple TV+'],
  ['appletv', 'Apple TV+'],
  ['apple tv', 'Apple TV+'],
  ['hbo max', 'HBO Max'],
  ['max', 'MAX'],
  ['hulu', 'Hulu'],
  ['peacock', 'Peacock'],
  ['paramount+', 'Paramount+'],
  ['youtube premium', 'YouTube Premium'],
  ['crunchyroll', 'Crunchyroll'],
  ['lionsgate play', 'Lionsgate Play'],
  ['discovery+', 'Discovery+'],
  ['aha', 'Aha'],
  ['sun nxt', 'Sun NXT'],
  ['erosnow', 'Eros Now'],
  ['mx player', 'MX Player'],
]);

// ==========================================
// SERVICE WORKER KEEPALIVE
// ==========================================
// MV3 service workers shut down after ~30s idle. Long-running message handlers
// (like getPersonalizedRecommendations or processHistoryAndBuildProfile) can be
// killed mid-flight, which causes the message port to close and the content
// script to hang. We bump the SW alive every 25s by reading storage while a
// long task is in flight.
let _keepaliveCount = 0;
let _keepaliveTimer = null;
function startKeepalive() {
  _keepaliveCount++;
  if (_keepaliveTimer) return;
  _keepaliveTimer = setInterval(() => {
    // Reading storage resets the SW idle timer
    try { chrome.storage.local.get('__cineman_keepalive', () => {}); } catch (e) {}
  }, 25000);
}
function stopKeepalive() {
  _keepaliveCount = Math.max(0, _keepaliveCount - 1);
  if (_keepaliveCount === 0 && _keepaliveTimer) {
    clearInterval(_keepaliveTimer);
    _keepaliveTimer = null;
  }
}
async function withKeepalive(fn) {
  startKeepalive();
  try { return await fn(); }
  finally { stopKeepalive(); }
}

// ==========================================
// CHROME HISTORY EXTRACTION
// ==========================================

function extractViewingStats(rawHistory) {
  const map = new Map();
  rawHistory.forEach(item => {
    const url = (item.url || '').toLowerCase();
    let platform = null;
    let action = null;

    if (url.includes('netflix.com')) platform = 'Netflix';
    else if (url.includes('primevideo.com') || url.includes('amazon.com/prime')) platform = 'Amazon Prime';
    else return;

    if (url.includes('/watch')) action = 'watch';
    else if (url.includes('/title') || url.includes('/detail')) action = 'open';
    else return;

    const title = (item.title || '')
      .replace(/\s*-\s*(Netflix|Prime Video|Amazon).*$/i, '')
      .replace(/\s*\|.*$/i, '')
      .replace(/^Watch\s+/i, '')
      .trim();

    const genericTitles = [
      'netflix', 'prime video', 'amazon prime', 'amazon', 'disney+',
      'hulu', 'hbo max', 'account', 'settings', 'profile', 'home',
      'browse', 'search', 'watch', 'my list', 'continue watching',
    ];

    const titleLower = title.toLowerCase();
    if (!title || title.length < 2 || genericTitles.includes(titleLower) ||
        titleLower.startsWith('account') || titleLower.startsWith('settings') ||
        titleLower.startsWith('profile')) {
      return;
    }

    const key = `${title.toLowerCase()}_${platform}`;
    if (!map.has(key)) {
      map.set(key, { title, platform, open_count: 0, watch_count: 0, last_timestamp: item.lastVisitTime });
    }

    const obj = map.get(key);
    if (action === 'open') obj.open_count++;
    if (action === 'watch') obj.watch_count++;
    if (item.lastVisitTime > obj.last_timestamp) obj.last_timestamp = item.lastVisitTime;
  });

  return Array.from(map.values());
}

async function hasHistoryPermission() {
  return new Promise(resolve => {
    try {
      chrome.permissions.contains({ permissions: ['history'] }, (granted) => resolve(!!granted));
    } catch (e) { resolve(false); }
  });
}

async function extractAndBuildProfile() {
  // history is now an optional permission — never auto-scan without it
  if (!(await hasHistoryPermission())) {
    cmLogger.log('extractAndBuildProfile: history permission not granted, skipping scan');
    return null;
  }
  return new Promise(resolve => {
    chrome.history.search({
      text: '',
      maxResults: 500,
      startTime: Date.now() - 90 * 24 * 60 * 60 * 1000, // last 90 days
    }, async (results) => {
      const stats = extractViewingStats(results);
      cmLogger.log(`Found ${stats.length} titles in Chrome history`);

      // Convert to format expected by taste engine
      const historyItems = stats.map(item => ({
        title: item.title,
        signal: item.watch_count >= 2 ? 'rewatched' : 'watched',
        completionPercent: item.watch_count >= 2 ? 95 : item.watch_count === 1 ? 70 : 40,
        date: new Date(item.last_timestamp).toISOString(),
      }));

      // Only build profile if TMDB key is configured
      if (TMDB_KEY) {
        const profile = await processHistoryAndBuildProfile(historyItems, (current, total, title) => {
          cmLogger.log(`[${current}/${total}] Enriching "${title}"...`);
        });
        cmLogger.log('Taste profile built from Chrome history');
        resolve(profile);
      } else {
        cmLogger.log('TMDB key not set — saving raw history only');
        chrome.storage.local.set({ cinemanViewingHistory: { history: historyItems } });
        resolve(null);
      }
    });
  });
}

// ==========================================
// OMDB RATING SERVICE
// ==========================================

async function fetchOMDBRating(title) {
  const cacheKey = `omdb_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  try {
    const cached = await new Promise(resolve => {
      chrome.storage.local.get(cacheKey, result => resolve(result[cacheKey]));
    });

    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp;
      if (!cached.data) {
        // Failed lookups: retry after 6 hours
        if (age < 6 * 60 * 60 * 1000) return cached.data;
      } else {
        // Smart TTL: new movies refresh weekly, older ones monthly
        const movieYear = parseInt(cached.data.year) || 0;
        const curYear = new Date().getFullYear();
        let maxAge;
        if (movieYear >= curYear) maxAge = 7 * 24 * 60 * 60 * 1000;       // New release: 7 days
        else if (movieYear >= curYear - 2) maxAge = 14 * 24 * 60 * 60 * 1000; // Recent: 14 days
        else maxAge = 30 * 24 * 60 * 60 * 1000;                               // Older: 30 days
        if (age < maxAge) return cached.data;
      }
    }
  } catch (e) { /* cache miss */ }

  const url = proxyUrl(`/api/omdb?t=${encodeURIComponent(title)}`);

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.Response === 'False') {
      try { chrome.storage.local.set({ [cacheKey]: { data: null, timestamp: Date.now() } }); } catch (e) {}
      return null;
    }

    const imdb = data.imdbRating || 'N/A';
    let rt = 'N/A';
    if (data.Ratings && Array.isArray(data.Ratings)) {
      const rtEntry = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
      if (rtEntry) rt = rtEntry.Value;
    }
    const metacritic = data.Metascore && data.Metascore !== 'N/A' ? data.Metascore : null;

    const result = { imdb, rt, metacritic, title: data.Title, year: data.Year, type: data.Type };

    try { chrome.storage.local.set({ [cacheKey]: { data: result, timestamp: Date.now() } }); } catch (e) {}
    return result;
  } catch (error) {
    cmLogger.error('OMDB network error:', error);
    return null;
  }
}

// ==========================================
// LIGHTWEIGHT GENRE TASTE SCORER
// Scores a movie against the taste profile using only its TMDB genre_ids.
// No extra API calls — used when we already have raw TMDB data (e.g. similar movies).
// Returns 0-100 or null if no profile data for these genres.
// ==========================================

function quickGenreTasteScore(genreIds, tasteProfile) {
  if (!tasteProfile || !tasteProfile.tags || !Array.isArray(genreIds) || genreIds.length === 0) return null;
  let total = 0, count = 0;
  for (const id of genreIds) {
    const genreName = TMDB_GENRE_MAP[id];
    if (!genreName) continue;
    const key = `genre::${genreName}`;
    const profileTag = tasteProfile.tags[key];
    if (profileTag) {
      total += profileTag.score * profileTag.confidence;
      count++;
    }
  }
  if (count === 0) return null;
  const avg = total / count;
  // Map [-1, 1] → [0, 100], apply same spread curve as full engine
  const raw = ((avg + 1) / 2) * 100;
  const centered = raw - 50;
  const sign = centered >= 0 ? 1 : -1;
  const spread = sign * Math.pow(Math.abs(centered) / 50, 0.75) * 50 + 50;
  return Math.round(Math.max(0, Math.min(100, spread)));
}

// ==========================================
// PREFERENCE → TMDB FILTER MAPPINGS
// These bridge the onboarding preferences to TMDB Discover parameters.
// ==========================================

// OTT platform name (as stored in StableUserPreferences) → TMDB watch provider IDs
const OTT_TO_TMDB_PROVIDER = {
  'Netflix':              [8],
  'Amazon Prime Video':   [9, 119],
  'Disney+':              [337],
  'HBO Max (Max)':        [384, 1899],
  'Hulu':                 [15],
  'Apple TV+':            [350],
  'Paramount+':           [531],
  'Peacock':              [386],
  'Crunchyroll':          [283],
  'MUBI':                 [11],
  // Indian platforms
  'JioCinema':            [220],
  'SonyLIV':              [237],
  'ZEE5':                 [232],
  'Voot':                 [121],
  'Lionsgate Play':       [196],
  'Eros Now':             [218],
  'Sun NXT':              [309],
  'Aha':                  [532],
  'Discovery+':           [510],
  'YouTube Premium':      [188],
};

// Era string → { gte, lte } year strings for TMDB discover date params
const ERA_TO_YEAR_RANGE = {
  '2020s':                { gte: '2020-01-01', lte: null },
  '2010s':                { gte: '2010-01-01', lte: '2019-12-31' },
  '2000s':                { gte: '2000-01-01', lte: '2009-12-31' },
  '1990s':                { gte: '1990-01-01', lte: '1999-12-31' },
  '1980s':                { gte: '1980-01-01', lte: '1989-12-31' },
  '1970s':                { gte: '1970-01-01', lte: '1979-12-31' },
  'Classics (pre-1970s)': { gte: null,         lte: '1969-12-31' },
};

// Duration string → TMDB runtime params (movies only; TV uses episode runtime)
const DURATION_TO_RUNTIME = {
  'Short (Under 90 min)':  { lte: 89,  gte: null },
  'Medium (90-120 min)':   { lte: 120, gte: 90   },
  'Long (Over 120 min)':   { lte: null, gte: 121 },
};

// ==========================================
// TMDB GENRE ID MAPPING (for discover API)
// ==========================================
const GENRE_NAME_TO_TMDB_ID = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
  'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878, 'Thriller': 53,
  'War': 10752, 'Western': 37, 'Musical': 10402, 'Superhero': 28,
  'Sport': 99,
};

/**
 * tmdbDiscoverByGenres
 * @param {string[]} genreNames - Genre names from user preferences
 * @param {string} mediaType - 'movie' or 'series'
 * @param {number} page
 * @param {object} filters - Optional preference-based filters:
 *   {
 *     language: string,           // TMDB language code e.g. 'en', 'ko'
 *     yearGte: string,            // e.g. '2010-01-01'
 *     yearLte: string,            // e.g. '2019-12-31'
 *     runtimeGte: number,         // movie runtime min
 *     runtimeLte: number,         // movie runtime max
 *     watchProviderIds: number[], // TMDB provider IDs
 *     watchRegion: string,        // 2-letter country code
 *     excludedGenreIds: number[], // TMDB genre IDs to exclude
 *   }
 */
async function tmdbDiscoverByGenres(genreNames, mediaType, page = 1, filters = {}) {
  const ids = genreNames
    .map(g => GENRE_NAME_TO_TMDB_ID[g])
    .filter(Boolean);
  if (!ids.length) return [];
  const type = mediaType === 'series' ? 'tv' : 'movie';

  // Base quality filter
  let url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}`
    + `&with_genres=${ids.join(',')}`
    + `&sort_by=vote_average.desc`
    + `&vote_count.gte=200&vote_average.gte=6.5`
    + `&language=en-US&page=${page}`;

  // ── Original language filter ──
  if (filters.language && filters.language !== 'any') {
    url += `&with_original_language=${filters.language}`;
  }

  // ── Era / year range ──
  const dateGteParam = type === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte';
  const dateLteParam = type === 'tv' ? 'first_air_date.lte' : 'primary_release_date.lte';
  if (filters.yearGte) url += `&${dateGteParam}=${filters.yearGte}`;
  if (filters.yearLte) url += `&${dateLteParam}=${filters.yearLte}`;

  // ── Runtime filter (movies only — TV runtime is per episode) ──
  if (type === 'movie') {
    if (filters.runtimeGte) url += `&with_runtime.gte=${filters.runtimeGte}`;
    if (filters.runtimeLte) url += `&with_runtime.lte=${filters.runtimeLte}`;
  }

  // ── OTT / Watch providers ──
  if (filters.watchProviderIds && filters.watchProviderIds.length > 0 && filters.watchRegion) {
    url += `&with_watch_providers=${filters.watchProviderIds.join('|')}`;
    url += `&watch_region=${filters.watchRegion}`;
    url += `&with_watch_monetization_types=flatrate`;
  }

  // ── Excluded genres ──
  if (filters.excludedGenreIds && filters.excludedGenreIds.length > 0) {
    url += `&without_genres=${filters.excludedGenreIds.join(',')}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    return (data.results || []).map(m => ({
      title: m.title || m.name || '',
      year: (m.release_date || m.first_air_date || '').substring(0, 4),
      poster_path: m.poster_path || null,
      overview: m.overview || '',
      vote_average: m.vote_average || 0,
      audienceLiked: m.vote_average ? Math.round(m.vote_average * 10) : null,
    })).filter(m => m.title);
  } catch (e) {
    cmLogger.error('TMDB discover failed:', e);
    return [];
  }
}

// ==========================================
// WATCHMODE STREAMING SERVICE
// ==========================================

// Watchmode country code → 2-letter ISO mapping (matches our COUNTRIES list)
const COUNTRY_TO_WATCHMODE_REGION = {
  'US': 'US', 'GB': 'GB', 'CA': 'CA', 'AU': 'AU',
  'IN': 'IN', 'DE': 'DE', 'FR': 'FR', 'ES': 'ES',
  'JP': 'JP', 'KR': 'KR', 'BR': 'BR', 'MX': 'MX',
  'any': 'US', // default to US for global
};

// In-memory streaming cache to avoid repeat Watchmode calls (expires after 30 min)
const _streamCache = new Map();
const STREAM_CACHE_TTL = 30 * 60 * 1000;

async function getStreamingPlatforms(movieTitle, userCountry) {
  const country = COUNTRY_TO_WATCHMODE_REGION[userCountry] || COUNTRY_TO_WATCHMODE_REGION['IN'] || 'IN';
  const cacheKey = `${movieTitle.toLowerCase()}::${country}`;

  // Return from cache if fresh
  const cached = _streamCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < STREAM_CACHE_TTL) return cached.data;

  try {
    const searchVariations = [
      movieTitle,
      movieTitle.replace(/[:–—]/g, '').replace(/\s+/g, ' ').trim(),
      movieTitle.split(/[:–—\-]/)[0].trim(),
    ];

    let titleResults = [];
    for (const searchTerm of searchVariations) {
      const wmPath = `/search/?search_field=name&search_value=${encodeURIComponent(searchTerm)}`;
      const searchUrl = proxyUrl(`/api/watchmode?path=${encodeURIComponent(wmPath)}`);
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) continue;
      const searchData = await searchResponse.json();
      titleResults = searchData.title_results || [];
      if (titleResults.length > 0) break;
    }

    if (titleResults.length === 0) {
      _streamCache.set(cacheKey, { data: [], ts: Date.now() });
      return [];
    }

    const watchmodeId = titleResults[0].id;
    const wmSourcesPath = `/title/${watchmodeId}/sources/`;
    const sourcesUrl = proxyUrl(`/api/watchmode?path=${encodeURIComponent(wmSourcesPath)}`);
    const sourcesResponse = await fetch(sourcesUrl);
    if (!sourcesResponse.ok) {
      _streamCache.set(cacheKey, { data: [], ts: Date.now() });
      return [];
    }

    const allSources = await sourcesResponse.json();

    // Priority: user's country subscription → user's country any type → US subscription
    let sources = allSources.filter(s => s.region === country && s.type === 'sub');
    if (sources.length === 0) sources = allSources.filter(s => s.region === country);
    if (sources.length === 0 && country !== 'US') {
      sources = allSources.filter(s => s.region === 'US' && s.type === 'sub');
    }

    const seen = new Set();
    const uniqueSources = [];
    for (const source of sources) {
      const rawName = (source.name || '').trim().toLowerCase();
      const normalizedName = POPULAR_PLATFORMS.get(rawName) || source.name;
      if (!normalizedName || seen.has(normalizedName)) continue;
      seen.add(normalizedName);
      // Use Watchmode's deep-link URL (e.g. netflix.com/title/12345) when available
      uniqueSources.push({
        name: normalizedName,
        web_url: source.web_url || `https://www.google.com/search?q=watch+${encodeURIComponent(movieTitle)}+on+${encodeURIComponent(normalizedName)}`
      });
    }

    _streamCache.set(cacheKey, { data: uniqueSources, ts: Date.now() });
    return uniqueSources;
  } catch (error) {
    cmLogger.warn('Watchmode API failed:', error);
    return [];
  }
}

// ==========================================
// HELPER: Open CineMan App Tab
// ==========================================

function openCineManApp() {
  const appUrl = chrome.runtime.getURL('index.html');
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find(t => t.url && t.url.startsWith(appUrl));
    if (existingTab) {
      chrome.tabs.update(existingTab.id, { active: true });
      chrome.windows.update(existingTab.windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: appUrl });
    }
  });
}

// ==========================================
// EVENTS
// ==========================================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    cmLogger.log('installed');
    extractAndBuildProfile();
    // Open the in-extension landing/onboarding tab so first-time users see what
    // they got. Without this, users who installed from the Web Store see nothing
    // happen and forget about it.
    openCineManApp();
  }
});

chrome.runtime.onStartup.addListener(() => {
  extractAndBuildProfile();
});

chrome.action.onClicked.addListener(() => {
  cmLogger.log('Extension clicked, opening app...');
  openCineManApp();
});

// ==========================================
// MESSAGE HANDLERS
// ==========================================

/**
 * Wrap an async message handler so the port never closes silently:
 * - guarantees `sendResponse` is called (with a standardized {success, data?, error?} shape)
 * - catches both sync throws and rejected promises
 * - logs the originating action so we can diagnose without console.* spam in callers
 */
function safeHandler(action, asyncFn, sendResponse) {
  Promise.resolve()
    .then(() => asyncFn())
    .then((data) => {
      // If the handler already returned a {success: ...} envelope, pass it through.
      if (data && typeof data === 'object' && 'success' in data) {
        sendResponse(data);
      } else {
        sendResponse({ success: true, data });
      }
    })
    .catch((err) => {
      cmLogger.error(`[${action}]`, err);
      sendResponse({
        success: false,
        error: (err && err.message) || String(err) || 'Unknown error',
      });
    });
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  // ---- Open CineMan popup with pre-filled search (from content script) ----
  if (req.action === 'openPopupWithSearch') {
    // Store the search intent, then open the popup
    chrome.storage.session.set({
      initialSearch: { tab: req.tab, query: req.query, type: req.type || 'movie' }
    });
    openCineManApp();
    sendResponse({ success: true });
    return true;
  }

  // ---- Chrome History Extraction ----
  if (req.action === 'extractViewingHistory') {
    safeHandler('extractViewingHistory', async () => {
      await extractAndBuildProfile();
      return { success: true };
    }, sendResponse);
    return true;
  }


  // ---- Lightweight Card Taste Score (for rating-overlay badge) ----
  if (req.action === 'getCardTasteScore') {
    const title = req.title || '';
    if (!title) { sendResponse({ success: false, error: 'No title' }); return true; }

    (async () => {
      try {
        // 1. Check if user has a taste profile
        const profile = await loadTasteProfile();
        if (!profile || !profile.tags || Object.keys(profile.tags).length === 0) {
          sendResponse({ success: true, data: { hasProfile: false, score: null } });
          return;
        }

        // 2. Check score cache (30-day TTL)
        const cacheKey = title.toLowerCase().trim();
        const cachedScore = await getCachedTasteScore(cacheKey);
        if (cachedScore && cachedScore.score !== null && cachedScore.score !== undefined) {
          sendResponse({ success: true, data: {
            hasProfile: true,
            score: cachedScore.score,
            confidence: cachedScore.confidence || 'medium',
            fromCache: true
          }});
          return;
        }

        // 3. Full TMDB enrichment for accurate taste scoring (uses cached results when available)
        const enriched = await tmdbEnrichTitle(title);
        if (!enriched) {
          sendResponse({ success: true, data: { hasProfile: true, score: null } });
          return;
        }

        // 4. Full taste match scoring (genre + cast + director + keywords + style)
        const result = scoreTasteMatch(enriched, profile);
        const score = result.score;

        if (score === null || score === undefined) {
          sendResponse({ success: true, data: { hasProfile: true, score: null } });
          return;
        }

        // 5. Determine confidence based on profile maturity
        const totalTitles = profile.totalTitles || 0;
        let confidence = 'low';
        if (totalTitles >= 30) confidence = 'high';
        else if (totalTitles >= 15) confidence = 'medium';

        // 6. Cache the score
        await saveTasteScoreToCache(cacheKey, {
          score,
          confidence,
          hasProfile: true,
          title: enriched.title || title,
          year: enriched.year || ''
        });

        sendResponse({ success: true, data: {
          hasProfile: true,
          score,
          confidence
        }});
      } catch (err) {
        cmLogger.error('Card taste score failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ---- Batch Card Taste Scores ----
  if (req.action === 'batchCardTasteScores') {
    const titles = req.titles || [];
    if (titles.length === 0) { sendResponse({ success: true, data: {} }); return true; }

    (async () => {
      try {
        const profile = await loadTasteProfile();
        if (!profile || !profile.tags || Object.keys(profile.tags).length === 0) {
          const noProfile = {};
          titles.forEach(t => { noProfile[t] = { hasProfile: false, score: null }; });
          sendResponse({ success: true, data: noProfile });
          return;
        }

        const results = {};
        const totalTitles = profile.totalTitles || 0;
        let confidence = 'low';
        if (totalTitles >= 30) confidence = 'high';
        else if (totalTitles >= 15) confidence = 'medium';

        for (const title of titles) {
          try {
            // Check cache
            const cacheKey = title.toLowerCase().trim();
            const cachedScore = await getCachedTasteScore(cacheKey);
            if (cachedScore && cachedScore.score !== null && cachedScore.score !== undefined) {
              results[title] = { hasProfile: true, score: cachedScore.score, confidence: cachedScore.confidence || confidence, fromCache: true };
              continue;
            }

            // TMDB search + details
            const searchResult = await tmdbSearch(title);
            if (!searchResult || !searchResult.id) {
              results[title] = { hasProfile: true, score: null };
              continue;
            }

            const details = await tmdbGetDetails(searchResult.id, searchResult.type);
            const genreIds = details?.genres?.map(g => g.id) || [];

            if (genreIds.length === 0) {
              results[title] = { hasProfile: true, score: null };
              continue;
            }

            const score = quickGenreTasteScore(genreIds, profile);
            if (score !== null) {
              await saveTasteScoreToCache(cacheKey, { score, confidence, hasProfile: true, title: searchResult.title || title, year: searchResult.year || '' });
              results[title] = { hasProfile: true, score, confidence };
            } else {
              results[title] = { hasProfile: true, score: null };
            }
          } catch (e) {
            results[title] = { hasProfile: true, score: null };
          }
        }

        sendResponse({ success: true, data: results });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ---- OMDB Ratings (for rating-overlay.js) ----
  if (req.action === 'fetchOMDBRating') {
    const title = req.title || '';
    if (!title) { sendResponse({ success: false, error: 'No title' }); return true; }
    safeHandler('fetchOMDBRating', async () => {
      const data = await fetchOMDBRating(title);
      return data ? { success: true, data } : { success: false, error: 'Not found' };
    }, sendResponse);
    return true;
  }


  // ==========================================
  // NEW: Taste Engine Endpoints
  // ==========================================

  // ---- "Will I like this?" (Taste-based, no LLM) ----
  if (req.action === 'tasteScoremovie') {
    const movieTitle = req.movieTitle || '';
    const userCountry = req.country || 'IN';
    if (!movieTitle) { sendResponse({ success: false, error: 'No title' }); return true; }

    (async () => {
      try {
        // Fetch taste score, ratings, and streaming sources in parallel
        const [tasteResult, omdbData, streamingSources] = await Promise.all([
          quickTasteScore(movieTitle),
          fetchOMDBRating(movieTitle),
          getStreamingPlatforms(movieTitle, userCountry),
        ]);

        // Fetch trailer key separately (needs tmdb_id from tasteResult, cached 7 days)
        let youtubeTrailerId = null;
        if (tasteResult.tmdb_id) {
          try {
            youtubeTrailerId = await tmdbGetVideos(tasteResult.tmdb_id, tasteResult.tmdb_type || 'movie');
          } catch (e) { /* non-critical */ }
        }

        sendResponse({
          success: true,
          data: {
            title: tasteResult.title || movieTitle,
            year: tasteResult.year || '',
            director: tasteResult.director || '',
            imdbRating: omdbData?.imdb || '',
            rottenTomatoes: omdbData?.rt || '',
            genres: tasteResult.genres || [],
            tasteMatch: tasteResult.score,
            hasProfile: tasteResult.hasProfile,
            synopsis: tasteResult.overview || '',
            reasons: tasteResult.reasons || [],
            poster: tasteResult.poster_path ? tmdbPosterUrl(tasteResult.poster_path, 'w342') : null,
            streamingSources,
            cast: tasteResult.cast || [],
            runtime: tasteResult.runtime || null,
            tagline: tasteResult.tagline || '',
            matchedTags: tasteResult.matchedTags || [],
            mismatchedTags: tasteResult.mismatchedTags || [],
            youtubeTrailerId,
          },
        });
      } catch (err) {
        cmLogger.error('Taste score failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true;
  }

  // ---- "More like this" (TMDB similar, no LLM) ----
  if (req.action === 'getSimilarMovies') {
    const movieTitle = req.movieTitle || '';
    const userCountry = req.country || 'IN';
    if (!movieTitle) { sendResponse({ success: false, error: 'No title' }); return true; }

    (async () => {
      try {
        // Search for the movie first
        const searchResult = await tmdbSearch(movieTitle);
        if (!searchResult) {
          sendResponse({ success: false, error: `Could not find "${movieTitle}"` });
          return;
        }

        // Get similar/recommended titles
        const similar = await tmdbGetSimilar(searchResult.id, searchResult.type);

        // Load taste profile for personalised similar-movie ranking
        const tasteProfileForSimilar = await loadTasteProfile();

        // Score each similar item with fast genre-only taste score,
        // then sort by composite: 55% taste + 45% quality
        const scoredSimilar = similar.map(s => {
          const tasteScore = quickGenreTasteScore(s.genre_ids || [], tasteProfileForSimilar);
          const qualityScore = (s.vote_average || 5) * 10;
          const composite = tasteScore !== null
            ? tasteScore * 0.55 + qualityScore * 0.45
            : qualityScore;
          return { ...s, _tasteScore: tasteScore, _composite: composite };
        });
        scoredSimilar.sort((a, b) => b._composite - a._composite);

        // Build results quickly — basic info first, enrich what we can with a timeout
        const top12 = scoredSimilar.slice(0, 12);
        const enrichedSimilar = [];

        // Helper: race a promise against a timeout
        const withTimeout = (promise, ms) => Promise.race([promise, new Promise(r => setTimeout(() => r(null), ms))]);

        for (const s of top12) {
          const title = s.title || s.name || '';
          if (!title) continue;

          // Basic info always available (no API calls needed)
          const entry = {
            title,
            year: s.year || (s.release_date || s.first_air_date || '').substring(0, 4),
            poster: s.poster_path ? tmdbPosterUrl(s.poster_path, 'w342') : null,
            overview: s.overview || '',
            genres: (s.genre_ids || []).map(id => TMDB_GENRE_MAP[id] || '').filter(Boolean).map(humanizeTag),
            imdbRating: s.vote_average ? s.vote_average.toFixed(1) : '',
            rottenTomatoes: '',
            streamingSources: [],
            audienceLiked: s.vote_average ? Math.round(s.vote_average * 10) : null,
            tasteMatch: s._tasteScore,
            youtubeTrailerId: null,
          };

          // Try to enrich with OMDB (2 second timeout per item)
          try {
            const omdbData = await withTimeout(fetchOMDBRating(title), 2000);
            if (omdbData) {
              entry.imdbRating = omdbData.imdb || entry.imdbRating;
              entry.rottenTomatoes = omdbData.rt || '';
            }
          } catch (e) { /* skip */ }

          enrichedSimilar.push(entry);
        }

        sendResponse({
          success: true,
          data: {
            sourceTitle: searchResult.title,
            sourceYear: searchResult.year,
            similar: enrichedSimilar,
          },
        });
      } catch (err) {
        cmLogger.error('Similar movies failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true;
  }

  // ---- Process Netflix History (from scraper content script) ----
  if (req.action === 'processNetflixHistory') {
    const rawHistory = req.history || [];
    if (rawHistory.length === 0) { sendResponse({ success: false, error: 'Empty history' }); return true; }

    cmLogger.log(`Received ${rawHistory.length} items from Netflix history scraper`);

    // Respond IMMEDIATELY — don't make the user wait
    sendResponse({ success: true, profileStats: { totalTitles: rawHistory.length, totalTags: 0, processing: true } });

    // Process in background — saves progress continuously. Wrap in keepalive
    // so the SW isn't killed mid-enrichment.
    withKeepalive(() => processHistoryAndBuildProfile(rawHistory, (current, total, title) => {
      cmLogger.log(`[${current}/${total}] "${title}"`);
    })).then(profile => {
      cmLogger.log(`Profile complete! ${profile.totalTitles} titles, ${Object.keys(profile.tags).length} tags`);
    }).catch(err => {
      cmLogger.error('History processing failed:', err);
    });

    return false; // response already sent synchronously
  }

  // ---- Get Taste Profile Summary ----
  if (req.action === 'getTasteProfile') {
    safeHandler('getTasteProfile', async () => {
      const profile = await loadTasteProfile();
      if (!profile) return { success: false, error: 'No profile built yet' };
      return { success: true, data: getProfileSummary(profile) };
    }, sendResponse);
    return true;
  }

  // ---- Legacy: getPersonalizedRecommendation (now uses taste engine) ----
  if (req.action === 'getPersonalizedRecommendation') {
    const movieTitle = req.movieTitle || 'Unknown Movie';

    (async () => {
      try {
        const [tasteResult, streamingSources, omdbData] = await Promise.all([
          quickTasteScore(movieTitle),
          getStreamingPlatforms(movieTitle),
          fetchOMDBRating(movieTitle),
        ]);

        sendResponse({
          success: true,
          data: {
            title: tasteResult.title || movieTitle,
            year: tasteResult.year || '',
            director: tasteResult.director || '',
            imdbRating: omdbData?.imdb || tasteResult.vote_average?.toString() || '',
            rottenTomatoes: omdbData?.rt || '',
            tasteMatch: tasteResult.score,
            hasProfile: tasteResult.hasProfile !== false,
            genres: tasteResult.genres || [],
            synopsis: tasteResult.overview || 'Info unavailable.',
            reasons: tasteResult.reasons || [],
            explanation: tasteResult.reasons?.[0] || '',
            streamingSources,
            cast: tasteResult.cast || [],
            matchedTags: tasteResult.matchedTags || [],
            mismatchedTags: tasteResult.mismatchedTags || [],
          },
        });
      } catch (err) {
        cmLogger.error('Recommendation flow failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true;
  }

  // ---- Streaming Platforms ----
  if (req.action === 'getStreamingPlatforms') {
    const title = req.movieTitle || '';
    if (!title) { sendResponse({ success: false, error: 'No title' }); return true; }
    safeHandler('getStreamingPlatforms', async () => {
      const sources = await getStreamingPlatforms(title);
      return { success: true, data: sources };
    }, sendResponse);
    return true;
  }

  // ---- Batch personalized recommendations (replaces Gemini streaming) ----
  if (req.action === 'getPersonalizedRecommendations') {
    const count = req.count || 6;
    const userCountry = req.country || req.preferences?.country || 'IN';

    withKeepalive(() => (async () => {
      try {
        // ---- Build excluded set: from request + from saved feedback ----
        const storedData = await new Promise(r =>
          chrome.storage.local.get([
            'cineman_enriched_history',
            'cineman_taste_profile',
            'cineSuggestMovieFeedback_v1',
          ], r)
        );
        const feedbackList = Array.isArray(storedData.cineSuggestMovieFeedback_v1)
          ? storedData.cineSuggestMovieFeedback_v1
          : [];
        const ratedTitles = new Set(feedbackList.map(f => (f.title || '').toLowerCase()));
        const excludedTitles = new Set([
          ...(req.excludedTitles || []).map(t => t.toLowerCase()),
          ...ratedTitles,
        ]);

        const enrichedHistory = storedData.cineman_enriched_history || [];
        const tasteProfile = storedData.cineman_taste_profile;

        // ---- Build genre → most-recently-watched title map (for "Because you watched X") ----
        // Sorted history oldest-first so later entries overwrite with more recent watches.
        const genreToRecentTitle = {};
        const sortedHistory = [...enrichedHistory].sort((a, b) => {
          const aDate = a.watchDate ? new Date(a.watchDate).getTime() : 0;
          const bDate = b.watchDate ? new Date(b.watchDate).getTime() : 0;
          return aDate - bDate; // oldest first; newer writes win
        });
        for (const item of sortedHistory) {
          for (const tagEntry of (item.enrichedData?.tags || [])) {
            if (tagEntry.category === 'genre' && item.title) {
              genreToRecentTitle[tagEntry.tag] = item.title;
            }
          }
        }

        // ---- Build enrichment helper ----
        const buildMovieEntry = async (title, fallbackYear, fallbackPoster, fallbackOverview, fallbackAudienceLiked) => {
          let tasteResult, omdbData, streamingSources;
          try {
            [tasteResult, omdbData, streamingSources] = await Promise.all([
              quickTasteScore(title).catch(e => ({ score: null, hasProfile: false, reasons: [], title })),
              fetchOMDBRating(title).catch(() => null),
              getStreamingPlatforms(title, userCountry).catch(() => []),
            ]);
          } catch (e) {
            tasteResult = { score: null, hasProfile: false, reasons: [], title };
            omdbData = null;
            streamingSources = [];
          }
          // Derive audienceLiked from TMDB vote_average (from taste engine) or fallback
          const audienceLiked = tasteResult.vote_average
            ? Math.round(tasteResult.vote_average * 10)
            : (fallbackAudienceLiked || null);

          // "Because you watched X" — find the most recent history item sharing primary genre
          const primaryGenreRaw = (tasteResult.genres || [])[0] || '';
          const primaryGenreKey = primaryGenreRaw.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const becauseOf = genreToRecentTitle[primaryGenreKey] || null;

          // Trailer: fetch YouTube key using the TMDB ID from the taste result (cached 7 days)
          let youtubeTrailerId = null;
          if (tasteResult.tmdb_id) {
            try {
              youtubeTrailerId = await tmdbGetVideos(tasteResult.tmdb_id, tasteResult.tmdb_type || 'movie');
            } catch (e) { /* non-critical */ }
          }

          return {
            title: tasteResult.title || title,
            year: tasteResult.year || fallbackYear || '',
            director: tasteResult.director || '',
            imdbRating: omdbData?.imdb || '',
            rottenTomatoes: omdbData?.rt || '',
            tasteMatch: tasteResult.score,
            hasProfile: tasteResult.hasProfile,
            genres: tasteResult.genres || [],
            synopsis: tasteResult.overview || fallbackOverview || 'Synopsis unavailable.',
            reasons: tasteResult.reasons || [],
            poster: tasteResult.poster_path
              ? tmdbPosterUrl(tasteResult.poster_path, 'w342')
              : (fallbackPoster ? tmdbPosterUrl(fallbackPoster, 'w342') : null),
            streamingSources,
            audienceLiked,
            becauseOf,
            durationMinutes: tasteResult.runtime || null,
            youtubeTrailerId,
            numberOfSeasons: tasteResult.number_of_seasons || null,
          };
        };

        const requestedGenres = (req.preferences?.genres && req.preferences.genres.length > 0)
          ? req.preferences.genres
          : [];
        const mediaType = req.preferences?.mediaType || 'movie';

        // ---- Content-type preference: if user strongly prefers series, adjust mediaType ----
        const profileData = tasteProfile && typeof tasteProfile === 'object' ? tasteProfile : null;
        const contentTypePref = profileData?.contentTypePreference || 'both';
        // Only override if user didn't explicitly choose — and preference is strong
        const effectiveMediaType = (mediaType === 'movie' && contentTypePref === 'series')
          ? 'series'
          : (mediaType === 'series' && contentTypePref === 'movie')
          ? 'movie'
          : mediaType;

        // ---- Build TMDB filter params from ALL stable + session preferences ----
        const stablePrefs = req.preferences || {};

        // Language: use first non-"any" preferred language
        const prefLangs = stablePrefs.preferredLanguages || [];
        const primaryLang = prefLangs.find(l => l && l !== 'any') || null;

        // Era: pick first non-"Any" era selection
        const prefEras = stablePrefs.era || [];
        const primaryEra = prefEras.find(e => e && e !== 'Any') || null;
        const yearRange = primaryEra ? (ERA_TO_YEAR_RANGE[primaryEra] || {}) : {};

        // Duration (movies only)
        const prefDurations = stablePrefs.movieDuration || [];
        const primaryDuration = prefDurations.find(d => d && d !== 'Any') || null;
        const runtimeRange = primaryDuration ? (DURATION_TO_RUNTIME[primaryDuration] || {}) : {};

        // OTT platforms → TMDB provider IDs
        const prefPlatforms = (stablePrefs.ottPlatforms || []).filter(p => p !== 'Other');
        const providerIds = prefPlatforms.flatMap(p => OTT_TO_TMDB_PROVIDER[p] || []);
        const watchRegion = (stablePrefs.country && stablePrefs.country !== 'any')
          ? stablePrefs.country : null;

        // Excluded genres (from session preferences)
        const sessionExcludedGenres = req.preferences?.excludedGenres || [];
        const excludedGenreIds = sessionExcludedGenres
          .map(g => GENRE_NAME_TO_TMDB_ID[g])
          .filter(Boolean);

        // Seasons preference (client-side post-filter for TV)
        const prefSeasons = stablePrefs.preferredNumberOfSeasons || [];
        const primarySeasonPref = prefSeasons.find(s => s && s !== 'Any') || null;

        const discoverFilters = {
          language:         primaryLang,
          yearGte:          yearRange.gte || null,
          yearLte:          yearRange.lte || null,
          runtimeGte:       runtimeRange.gte || null,
          runtimeLte:       runtimeRange.lte || null,
          watchProviderIds: providerIds.length > 0 ? providerIds : null,
          watchRegion:      providerIds.length > 0 ? watchRegion : null,
          excludedGenreIds: excludedGenreIds.length > 0 ? excludedGenreIds : null,
        };

        let results = [];

        // ---- PRIMARY: When genres are specified, use TMDB Discover (genre-accurate) ----
        if (requestedGenres.length > 0) {
          try {
            const discoverItems = await tmdbDiscoverByGenres(requestedGenres, effectiveMediaType, 1, discoverFilters);
            const filtered = discoverItems
              .filter(m => !excludedTitles.has((m.title || '').toLowerCase()))
              .slice(0, count + 6);

            const settled = await Promise.allSettled(
              filtered.map(m => buildMovieEntry(m.title, m.year, m.poster_path, m.overview, m.audienceLiked))
            );
            const fulfilled = settled.filter(r => r.status === 'fulfilled');
            // If >50% of enrichment failed, surface to caller so we can show an error
            if (filtered.length >= 4 && fulfilled.length < filtered.length / 2) {
              cmLogger.error(`Enrichment failure rate: ${filtered.length - fulfilled.length}/${filtered.length} failed`);
              sendResponse({ success: false, error: 'Recommendations enrichment is failing. Please try again later.' });
              return;
            }
            results = fulfilled.map(r => r.value).slice(0, count);
          } catch (e) {
            cmLogger.error('Genre discover failed:', e);
          }
        } else {
          // ---- NO GENRES: Score from viewing history ----
          let candidates = enrichedHistory
            .map(item => item.title || '')
            .filter(t => t && !excludedTitles.has(t.toLowerCase()));
          candidates = [...new Set(candidates)];

          if (tasteProfile) {
            const profile = typeof tasteProfile === 'string' ? JSON.parse(tasteProfile) : tasteProfile;
            const scored = candidates.slice(0, 80).map(title => {
              try {
                const score = profile.tags
                  ? Object.values(profile.tags).reduce((sum, w) => sum + (Number(w.score) || 0), 0) / Math.max(Object.keys(profile.tags).length, 1)
                  : Math.random();
                return { title, score };
              } catch (e) { return { title, score: 0 }; }
            });
            scored.sort((a, b) => b.score - a.score);
            candidates = scored.map(s => s.title);
          } else {
            for (let i = candidates.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
          }

          const historySlice = candidates.slice(0, count + 8);
          const settled = await Promise.allSettled(
            historySlice.map(title => buildMovieEntry(title, '', null, ''))
          );
          const fulfilled = settled.filter(r => r.status === 'fulfilled');
          if (historySlice.length >= 4 && fulfilled.length < historySlice.length / 2) {
            cmLogger.error(`History enrichment failure rate: ${historySlice.length - fulfilled.length}/${historySlice.length} failed`);
          }
          results = fulfilled.map(r => r.value).slice(0, count);
        }

        // ---- FALLBACK: TMDB popular (genre-filtered if genres specified) ----
        if (results.length < count) {
          try {
            const needed = count - results.length;
            let fallbackItems = [];

            if (requestedGenres.length > 0) {
              // Try page 2 of the same genre discover with same filters
              fallbackItems = await tmdbDiscoverByGenres(requestedGenres, effectiveMediaType, 2, discoverFilters);
            } else {
              // No genre specified — use trending instead of generic popular, still apply filters
              const type = effectiveMediaType === 'series' ? 'tv' : 'movie';
              let fallbackUrl = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_KEY}&sort_by=vote_average.desc&vote_count.gte=200&vote_average.gte=6.5&language=en-US&page=1`;
              if (discoverFilters.language && discoverFilters.language !== 'any') {
                fallbackUrl += `&with_original_language=${discoverFilters.language}`;
              }
              if (discoverFilters.watchProviderIds?.length && discoverFilters.watchRegion) {
                fallbackUrl += `&with_watch_providers=${discoverFilters.watchProviderIds.join('|')}&watch_region=${discoverFilters.watchRegion}&with_watch_monetization_types=flatrate`;
              }
              if (discoverFilters.excludedGenreIds?.length) {
                fallbackUrl += `&without_genres=${discoverFilters.excludedGenreIds.join(',')}`;
              }
              const popRes = await fetch(fallbackUrl);
              const popData = await popRes.json();
              fallbackItems = (popData.results || []).map(m => ({
                title: m.title || m.name || '',
                year: (m.release_date || m.first_air_date || '').substring(0, 4),
                poster_path: m.poster_path || null,
                overview: m.overview || '',
              }));
            }

            const filtered = fallbackItems
              .filter(m =>
                !excludedTitles.has((m.title || '').toLowerCase()) &&
                !results.some(r => r.title.toLowerCase() === (m.title || '').toLowerCase())
              )
              .slice(0, needed + 4);

            const fallbackSettled = await Promise.allSettled(
              filtered.map(m => buildMovieEntry(m.title, m.year, m.poster_path, m.overview))
            );
            const fallbackResults = fallbackSettled
              .filter(r => r.status === 'fulfilled')
              .map(r => r.value)
              .slice(0, needed);
            results.push(...fallbackResults);
          } catch (e) {
            cmLogger.error('Fallback discover failed:', e);
          }
        }

        // ---- Season count post-filter (TV only, client-side) ----
        // TMDB Discover doesn't support filtering by number_of_seasons, so we filter after enrichment.
        if (effectiveMediaType === 'series' && primarySeasonPref && results.length > 0) {
          const filtered = results.filter(r => {
            if (!r.numberOfSeasons) return true; // unknown → keep
            const s = r.numberOfSeasons;
            if (primarySeasonPref.startsWith('Short'))  return s <= 3;
            if (primarySeasonPref.startsWith('Medium')) return s >= 4 && s <= 7;
            if (primarySeasonPref.startsWith('Long'))   return s >= 8;
            return true;
          });
          // Only apply filter if it leaves a reasonable number of results
          if (filtered.length >= Math.min(3, results.length)) results = filtered;
        }

        // ---- Diversity control (no specific genre requested) ----
        // When results come from taste profile (not a user genre pick), cap any single
        // genre cluster at 60% of cards so users discover new territories.
        if (requestedGenres.length === 0 && results.length > 3) {
          const maxFromSameGenre = Math.ceil(results.length * 0.6);
          const genreCounts = {};
          const diverse = [];
          const overflow = [];
          for (const r of results) {
            const pg = (r.genres || [])[0] || '_unknown';
            genreCounts[pg] = (genreCounts[pg] || 0) + 1;
            if (genreCounts[pg] <= maxFromSameGenre) {
              diverse.push(r);
            } else {
              overflow.push(r);
            }
          }
          // Refill to original count with overflow if we have slots
          while (diverse.length < results.length && overflow.length > 0) {
            diverse.push(overflow.shift());
          }
          results = diverse;
        }

        // ---- Context-aware sort (time of day / day of week) ----
        // On weekday evenings prefer shorter content without removing longer ones.
        const currentHour = new Date().getHours();
        const currentDay = new Date().getDay(); // 0 = Sun, 6 = Sat
        const isWeekend = currentDay === 0 || currentDay === 6;
        const isWeekdayEvening = !isWeekend && currentHour >= 18 && currentHour <= 22;
        if (isWeekdayEvening) {
          results.sort((a, b) => {
            const aShort = !a.durationMinutes || a.durationMinutes <= 120;
            const bShort = !b.durationMinutes || b.durationMinutes <= 120;
            if (aShort && !bShort) return -1;
            if (!aShort && bShort) return 1;
            return 0;
          });
        }

        sendResponse({ success: true, data: results });
      } catch (err) {
        cmLogger.error('getPersonalizedRecommendations failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    })());
    return true;
  }
});
