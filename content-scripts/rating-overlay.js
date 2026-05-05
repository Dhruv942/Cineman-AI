/*************************************************************
 * CineMan — Rating Overlay (Netflix & Prime Video)
 * Shows IMDb & Rotten Tomatoes scores ALWAYS VISIBLE (top-right)
 * 
 * PREMIUM GLASSMORPHISM DESIGN
 *************************************************************/

(function () {
    "use strict";

    if (window.__cinemanRatingOverlay) return;
    window.__cinemanRatingOverlay = true;

    console.log("CineMan: 🎬 Rating Overlay Active");

    // ==========================================
    // Platform Detection
    // ==========================================
    const hostname = window.location.hostname;
    let PLATFORM = "unknown";

    if (hostname.includes("netflix.com")) {
        PLATFORM = "netflix";
    } else if (hostname.includes("primevideo.com") || hostname.includes("amazon.")) {
        PLATFORM = "prime";
    } else if (hostname.includes("hotstar.com") || hostname.includes("jiohotstar.com")) {
        PLATFORM = "hotstar";
    }

    const ratingsCache = {};
    const tasteScoreCache = {};
    let hasTasteProfile = false;
    let tasteProfileTitles = 0; // Number of titles in the profile
    const MIN_TITLES_FOR_TASTE = 10; // Don't show taste match until profile has enough data
    let cachePreloaded = false;

    // Helper: should we show taste match scores on cards?
    function shouldShowTasteMatch() {
        return hasTasteProfile && tasteProfileTitles >= MIN_TITLES_FOR_TASTE;
    }

    // Preload ALL cached ratings + taste scores into memory on startup (one-time read)
    chrome.storage.local.get(null, (allData) => {
        let omdbCount = 0;
        let tasteCount = 0;

        // Load OMDB ratings cache
        for (const [key, value] of Object.entries(allData)) {
            if (key.startsWith('omdb_') && value && value.data && value.timestamp) {
                // Reconstruct the title from cache key and store by original title
                const title = value.data.title || key.replace('omdb_', '').replace(/_/g, ' ');
                ratingsCache[title] = value.data;
                omdbCount++;
            }
        }

        // Load taste score cache
        const scoreCache = allData.cineman_score_cache || {};
        for (const [titleKey, entry] of Object.entries(scoreCache)) {
            if (entry && entry.score !== undefined) {
                tasteScoreCache[entry.title || titleKey] = entry;
                tasteCount++;
            }
        }

        // Load taste profile status
        const profile = allData.cineman_taste_profile;
        if (profile && profile.tags && Object.keys(profile.tags).length > 0) {
            hasTasteProfile = true;
            tasteProfileTitles = profile.totalTitles || 0;
            console.log("CineMan: 🎯 Taste profile loaded (" + tasteProfileTitles + " titles, " + (tasteProfileTitles >= MIN_TITLES_FOR_TASTE ? "showing taste match" : "need " + (MIN_TITLES_FOR_TASTE - tasteProfileTitles) + " more for taste match") + ")");
        } else {
            console.log("CineMan: No taste profile found — showing IMDb/RT ratings");
        }

        cachePreloaded = true;
        console.log("CineMan: 📦 Preloaded " + omdbCount + " OMDB ratings + " + tasteCount + " taste scores from cache");
    });

    // Listen for taste profile changes (e.g., user syncs Netflix history)
    // AND user-rated feedback so taste scores reflect new ratings immediately.
    let lastProfileBuildDate = null;
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.cineman_taste_profile) {
            const newProfile = changes.cineman_taste_profile.newValue;
            if (newProfile && newProfile.tags && Object.keys(newProfile.tags).length > 0) {
                // Only refresh if the profile actually changed (new build date)
                if (newProfile.buildDate && newProfile.buildDate !== lastProfileBuildDate) {
                    lastProfileBuildDate = newProfile.buildDate;
                    hasTasteProfile = true;
                    tasteProfileTitles = newProfile.totalTitles || 0;
                    Object.keys(tasteScoreCache).forEach(k => delete tasteScoreCache[k]);
                    refreshAllCardBadges();
                }
            }
        }
        // When the user rates a movie, drop the cached score(s) for it so the
        // overlay re-fetches an up-to-date number on the next render.
        if (changes.cineSuggestMovieFeedback_v1) {
            const newFb = changes.cineSuggestMovieFeedback_v1.newValue || [];
            const oldFb = changes.cineSuggestMovieFeedback_v1.oldValue || [];
            const oldSet = new Set(oldFb.map(f => (f.title || '').toLowerCase()));
            const changed = newFb.filter(f => !oldSet.has((f.title || '').toLowerCase()));
            for (const f of changed) {
                const key = (f.title || '').toLowerCase().trim();
                if (tasteScoreCache[key]) delete tasteScoreCache[key];
                if (tasteScoreCache[f.title]) delete tasteScoreCache[f.title];
            }
            if (changed.length > 0) refreshAllCardBadges();
        }
    });

    // ==========================================
    // Fade-out Settings (stored in chrome.storage)
    // ==========================================
    let fadeSettings = {
        enabled: false,
        minImdb: 5.0,
        minRt: 40,
    };

    // Load fade settings from storage
    chrome.storage.local.get(['cineman_fade_settings'], (data) => {
        if (data.cineman_fade_settings) {
            fadeSettings = { ...fadeSettings, ...data.cineman_fade_settings };
        }
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.cineman_fade_settings) {
            fadeSettings = { ...fadeSettings, ...changes.cineman_fade_settings.newValue };
            // Re-apply fade to all existing cards
            document.querySelectorAll('[data-cineman-imdb], [data-cineman-rt]').forEach(card => {
                applyFadeout(card);
            });
        }
    });

    // ==========================================
    // Title Extraction
    // ==========================================
    function extractTitle(card) {
        let title = null;

        // CRITICAL: Exclude hero/billboard sections (the big sliders at the top)
        if (PLATFORM === "netflix") {
            if (card.closest(".billboard-row, .hero-vignette, .billboard, .volatile-billboard-animations-container")) return null;
            // Exclude navigation, footer, and non-content sections
            if (card.closest("nav, header, footer, [role='navigation'], [role='banner'], .pinning-header-container, .search-box, .notifications")) return null;
        } else if (PLATFORM === "hotstar") {
            if (card.closest("nav, header, footer, [role='navigation'], [role='banner']")) return null;
            const rect = card.getBoundingClientRect();
            if (rect.width > 700) return null;
        } else if (PLATFORM === "prime") {
            // Very aggressive exclusion for anything that looks like a main banner/carousel
            if (card.closest(".av-hero-section, [data-automation-id*='hero'], .merch-hero, .u-hero, .tst-hero-banner, .carousel-container, [class*='Hero'], [class*='Banner'], .dynamic-hero")) {
                return null;
            }
            // Exclude navigation, footer, and non-content sections
            if (card.closest("nav, header, footer, [role='navigation'], [role='banner']")) return null;
            // Exclude "Watch in Your Language" and other category rows
            if (card.innerText && (card.innerText.toLowerCase().includes("language") || card.innerText.toLowerCase().includes("browse by"))) {
                // We'll check the individual item below as well
            }

            // If the card is too large, it's likely a hero banner
            const rect = card.getBoundingClientRect();
            if (rect.width > 600) return null;
        }

        // UNIVERSAL: Skip cards that are too small (likely UI elements, not movie cards)
        const cardRect = card.getBoundingClientRect();
        if (cardRect.width < 80 || cardRect.height < 80) return null;
        // Skip cards that are not visible
        if (cardRect.width === 0 || cardRect.height === 0) return null;

        if (PLATFORM === "netflix") {
            // Try common Netflix title locations - prefer aria-label on links with href to actual content
            const contentLink = card.querySelector("a[aria-label][href*='/watch'], a[aria-label][href*='/title']");
            if (contentLink) {
                const label = contentLink.getAttribute("aria-label");
                if (label && !["Play", "More Info", "Back", "Close", "Search", "Notifications", "Account"].includes(label)) {
                    title = label;
                }
            }

            if (!title) {
                const ariaEl = card.querySelector("a[aria-label], [aria-label]");
                if (ariaEl) {
                    const label = ariaEl.getAttribute("aria-label");
                    // Stricter exclusion list for Netflix UI elements
                    const excludedLabels = ["Play", "More Info", "Back", "Close", "Search", "Notifications",
                        "Account", "Menu", "Audio & Subtitles", "Episodes", "Trailers & More",
                        "My List", "Browse", "Home", "New & Popular", "Categories", "My Netflix"];
                    if (label && label.length > 1 && label.length < 100 && !excludedLabels.includes(label)) {
                        title = label;
                    }
                }
            }

            if (!title) {
                const img = card.querySelector("img[alt]");
                if (img && img.alt && img.alt.length > 1 && img.alt.length < 100) {
                    // Exclude common non-title image alts
                    const altLower = img.alt.toLowerCase();
                    if (!["netflix", "logo", "avatar", "profile", "icon", "background"].some(kw => altLower.includes(kw))) {
                        title = img.getAttribute("alt");
                    }
                }
            }

            // Removed overly broad fallback that grabbed innerText from any slider-item
        } else if (PLATFORM === "hotstar") {
            // Hotstar/JioCinema: try aria-label, then img alt, then text
            const ariaEl = card.querySelector("[aria-label]");
            if (ariaEl) {
                const label = ariaEl.getAttribute("aria-label");
                if (label && label.length > 1 && !["Play", "Watch", "More", "Home", "Search"].includes(label)) title = label;
            }
            if (!title) {
                const img = card.querySelector("img[alt]");
                if (img && img.alt && img.alt.length > 1 && !img.alt.toLowerCase().includes("hotstar") && !img.alt.toLowerCase().includes("jio")) title = img.alt;
            }
            if (!title) {
                const titleEl = card.querySelector("[class*='title'], [class*='Title'], h3, h4");
                if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 1) title = titleEl.textContent.trim();
            }
        } else if (PLATFORM === "prime") {
            // Priority 1: Aria label
            const ariaEl = card.querySelector("[aria-label]");
            if (ariaEl) {
                const label = ariaEl.getAttribute("aria-label");
                if (label && !["Play", "Watch", "Join Prime", "More"].includes(label)) title = label;
            }

            // Priority 2: Automation ID for title
            if (!title) {
                const titleEl = card.querySelector("[data-automation-id*='title'], [data-testid*='title'], .tst-video-title");
                if (titleEl) title = titleEl.innerText;
            }

            // Priority 3: Image alt
            if (!title) {
                const img = card.querySelector("img[alt]");
                if (img && img.alt && img.alt.length > 1) title = img.alt;
            }

            // Priority 4: Search for details/movie links
            if (!title) {
                const link = card.querySelector("a[href*='/detail/'], a[href*='/gp/video/'], a[href*='/movie/']");
                if (link && link.innerText) title = link.innerText;
            }

            // Fallback: Just grab the first bit of text
            if (!title && card.innerText && card.innerText.length < 100) {
                title = card.innerText.split('\n')[0];
            }
        }

        if (title) {
            // CLEANING & BLOCKING CATEGORIES
            const originalTitle = title.trim();

            // Block Language selector cards (Watch in Hindi, English, etc.)
            const categoryKeywords = ["language", "hindi", "english", "tamil", "telugu", "malayalam", "kannada", "marathi", "bengali", "gujarati", "punjabi", "category", "genre", "browsing", "view all", "see all"];
            const lowerTitle = originalTitle.toLowerCase();

            // Block Netflix/Prime UI elements that are not movie titles
            const uiKeywords = ["my list", "continue watching", "new & popular", "browse", "search",
                "home", "notifications", "account", "sign in", "sign out", "profiles",
                "more info", "play", "audio & subtitles", "episodes", "trailers & more",
                "top 10", "trending now", "because you watched", "watch it again",
                "categories", "settings", "help center", "manage profiles"];
            if (uiKeywords.some(kw => lowerTitle === kw || lowerTitle.startsWith(kw + " "))) {
                return null;
            }

            // If the title is just a language or contains "Watch in [Language]"
            if (categoryKeywords.some(kw => lowerTitle === kw || lowerTitle === `watch in ${kw}` || lowerTitle === `in ${kw}`)) {
                return null;
            }

            // Block titles that are just numbers (e.g., row numbers, episode numbers)
            if (/^\d+$/.test(originalTitle)) return null;

            title = title
                .replace(/^\s*(Watch|Play|Stream|Buy|Rent|In)\s+/i, "")
                .replace(/\s*[-\u2013\u2014:]\s*(Netflix|Prime Video|Amazon|Official Trailer|MX Player|Hindi|Tamil|Telugu).*$/i, "")
                .replace(/\s*\(.*?\)\s*$/, "")
                .replace(/\s*\|.*$/, "")
                .replace(/Season\s*\d+/i, "")
                .replace(/S\d+\s*$/i, "")
                .trim();

            // Re-check after cleaning
            if (categoryKeywords.some(kw => title.toLowerCase() === kw)) return null;
            if (uiKeywords.some(kw => title.toLowerCase() === kw)) return null;
        }

        return title && title.length > 1 ? title : null;
    }

    // ==========================================
    // Inject Styles (Premium Glassmorphism Design)
    // ==========================================
    const style = document.createElement("style");
    style.textContent = `
    /* Poppins @import removed — blocked by Netflix/Prime CSP. Using system font fallback. */

    .cineman-rating-badge {
      position: absolute !important;
      top: 8px !important;
      right: 8px !important;
      z-index: 999999 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 6px !important;
      pointer-events: none !important;
      opacity: 0;
      transform: translateY(-5px) scale(0.9);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .cineman-rating-badge.cineman-visible {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
    }
    /* Subtle pop effect on hover of the card */
    [style*="relative"]:hover > .cineman-rating-badge.cineman-visible,
    .boxart-container:hover .cineman-rating-badge.cineman-visible,
    .title-card-container:hover .cineman-rating-badge.cineman-visible,
    .tst-video-card:hover .cineman-rating-badge.cineman-visible,
    .AvCard:hover .cineman-rating-badge.cineman-visible,
    ._1E_w9C:hover .cineman-rating-badge.cineman-visible,
    .slider-item:hover .cineman-rating-badge.cineman-visible {
      transform: translateY(2px) scale(1.05) !important;
    }
    .cineman-pill {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 5px 10px !important;
      border-radius: 10px !important;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      position: relative !important;
      overflow: hidden !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.1) !important;
      background: linear-gradient(135deg, rgba(20, 20, 20, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%) !important;
      backdrop-filter: blur(14px) saturate(200%) !important;
      -webkit-backdrop-filter: blur(14px) saturate(200%) !important;
      min-width: 52px !important;
    }
    .cineman-pill-imdb { border: 1px solid rgba(245, 197, 24, 0.5) !important; }
    .cineman-pill-rt { border: 1px solid rgba(250, 50, 10, 0.5) !important; }
    
    /* Premium Shine Animation */
    .cineman-pill::after {
      content: '' !important;
      position: absolute !important;
      top: -50% !important;
      left: -50% !important;
      width: 200% !important;
      height: 200% !important;
      background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.15) 50%, transparent 55%) !important;
      animation: cineman-shine 4s infinite linear !important;
      pointer-events: none !important;
    }
    @keyframes cineman-shine {
      0% { transform: translate(-30%, -30%); }
      100% { transform: translate(30%, 30%); }
    }
    .cineman-pill-label {
      font-size: 10px !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.8px !important;
      line-height: 1 !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
    }
    .cineman-pill-imdb .cineman-pill-label { color: #f5c518 !important; }
    .cineman-pill-rt .cineman-pill-label { font-size: 14px !important; margin-right: -2px !important; }
    .cineman-pill-value {
      font-size: 14px !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      color: #fff !important;
      text-shadow: 0 1px 3px rgba(0,0,0,1) !important;
    }
    .cineman-pill-imdb .cineman-pill-value { color: #f5c518 !important; }
    .cineman-pill-rt .cineman-pill-value { color: #ff4d2d !important; }

    /* Taste Match Pill */
    .cineman-pill-taste {
      border: 1px solid rgba(34, 197, 94, 0.5) !important;
      position: relative !important;
    }
    .cineman-pill-taste.taste-high { border-color: rgba(34, 197, 94, 0.6) !important; }
    .cineman-pill-taste.taste-medium { border-color: rgba(245, 158, 11, 0.6) !important; }
    .cineman-pill-taste.taste-low { border-color: rgba(239, 68, 68, 0.5) !important; }
    .cineman-pill-taste .cineman-pill-label {
      color: #a78bfa !important;
      font-size: 8px !important;
      letter-spacing: 0.5px !important;
    }
    .cineman-pill-taste .cineman-pill-value {
      font-weight: 900 !important;
    }
    .cineman-pill-taste.taste-high .cineman-pill-value { color: #22c55e !important; }
    .cineman-pill-taste.taste-medium .cineman-pill-value { color: #f59e0b !important; }
    .cineman-pill-taste.taste-low .cineman-pill-value { color: #ef4444 !important; }
    /* Pulse glow on high taste match */
    @keyframes cineman-taste-glow {
      0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 0 rgba(34,197,94,0.3) !important; }
      50% { box-shadow: 0 4px 15px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 8px 3px rgba(34,197,94,0.15) !important; }
    }
    .cineman-pill-taste.taste-high {
      animation: cineman-taste-glow 3s ease-in-out infinite !important;
    }

    /* CineMan Action Icon */
    .cineman-action-icon {
      position: absolute !important;
      top: 8px !important;
      left: 8px !important;
      z-index: 999998 !important;
      opacity: 0 !important;
      transform: scale(0.8) !important;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      cursor: pointer !important;
      pointer-events: auto !important;
    }
    /* Show on card hover */
    [style*="relative"]:hover > .cineman-action-icon,
    .boxart-container:hover .cineman-action-icon,
    .title-card-container:hover .cineman-action-icon,
    .slider-item:hover .cineman-action-icon,
    .tst-video-card:hover .cineman-action-icon,
    .AvCard:hover .cineman-action-icon,
    ._1E_w9C:hover .cineman-action-icon,
    [data-testid='card']:hover .cineman-action-icon,
    article:hover .cineman-action-icon,
    [class*='card-container']:hover .cineman-action-icon,
    [class*='CardContainer']:hover .cineman-action-icon,
    [class*='tray-item']:hover .cineman-action-icon,
    [class*='TrayItem']:hover .cineman-action-icon {
      opacity: 1 !important;
      transform: scale(1) !important;
    }
    /* Fade-out for low-rated titles */
    .cineman-faded {
      opacity: 0.25 !important;
      filter: grayscale(60%) !important;
      transition: opacity 0.4s ease, filter 0.4s ease !important;
    }
    .cineman-faded:hover {
      opacity: 0.85 !important;
      filter: grayscale(20%) !important;
    }
    .cineman-faded .cineman-rating-badge {
      opacity: 1 !important;
      filter: none !important;
    }
    /* IMDb clickable link */
    .cineman-pill-imdb.cineman-clickable {
      cursor: pointer !important;
      pointer-events: auto !important;
      transition: transform 0.15s ease, box-shadow 0.15s ease !important;
    }
    .cineman-pill-imdb.cineman-clickable:hover {
      transform: scale(1.08) !important;
      box-shadow: 0 4px 18px rgba(245, 197, 24, 0.5) !important;
    }
    /* Hide CineMan overlays on hero/billboard */
    .billboard-row .cineman-rating-badge,
    .billboard-row .cineman-action-icon,
    .hero-vignette .cineman-rating-badge,
    .hero-vignette .cineman-action-icon,
    .billboard .cineman-rating-badge,
    .billboard .cineman-action-icon,
    [class*='billboard'] .cineman-rating-badge,
    [class*='billboard'] .cineman-action-icon,
    [class*='hero'] .cineman-rating-badge,
    [class*='hero'] .cineman-action-icon {
      display: none !important;
    }
    /* Netflix preview modal CineMan overlay */
    .cineman-modal-overlay {
      display: inline-flex !important;
      gap: 8px !important;
      align-items: center !important;
      flex-wrap: wrap !important;
    }
    .cineman-action-btn {
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      width: 100% !important;
      padding: 7px 12px !important;
      border: none !important;
      background: transparent !important;
      color: #e2e8f0 !important;
      font-family: 'Poppins', sans-serif !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      border-radius: 6px !important;
      transition: background 0.15s !important;
      white-space: nowrap !important;
    }
    .cineman-action-btn:hover {
      background: rgba(139, 92, 246, 0.4) !important;
      color: #fff !important;
    }
    .cineman-action-menu {
      display: none;
      position: absolute !important;
      top: 100% !important;
      left: 0 !important;
      margin-top: 4px !important;
      min-width: 160px !important;
      background: rgba(15, 23, 42, 0.97) !important;
      border: 1px solid rgba(139, 92, 246, 0.4) !important;
      border-radius: 10px !important;
      padding: 4px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
      z-index: 999999 !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
    }
    .cineman-action-icon:hover .cineman-action-menu,
    .cineman-action-icon.cineman-menu-open .cineman-action-menu {
      display: block !important;
    }
    .cineman-icon-circle {
      width: 32px !important;
      height: 32px !important;
      border-radius: 50% !important;
      background: linear-gradient(135deg, rgba(88, 28, 135, 0.95), rgba(139, 92, 246, 0.95)) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 3px 12px rgba(88, 28, 135, 0.5) !important;
      border: 1px solid rgba(255,255,255,0.15) !important;
      cursor: pointer !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
    }
    .cineman-icon-circle:hover {
      transform: scale(1.1) !important;
      box-shadow: 0 4px 16px rgba(139, 92, 246, 0.7) !important;
    }
    .cineman-icon-circle img {
      width: 18px !important;
      height: 18px !important;
      border-radius: 50% !important;
    }
    .cineman-icon-circle span {
      font-size: 14px !important;
      line-height: 1 !important;
    }
  `;
    document.head.appendChild(style);

    // ==========================================
    // Badge Injection
    // ==========================================
    function injectCineManIcon(card, container, title) {
        if (card.querySelector(".cineman-action-icon")) return;

        const iconWrap = document.createElement("div");
        iconWrap.className = "cineman-action-icon";

        // Try to get the extension icon, fallback to emoji
        let iconContent = '<span>🎬</span>';
        try {
            const iconUrl = chrome.runtime.getURL('icons/icon32.png');
            iconContent = `<img src="${iconUrl}" alt="CineMan" />`;
        } catch (e) {}

        const safeTitle = (title || '').replace(/"/g, '&quot;');
        const tasteButton = shouldShowTasteMatch() ? '' : `
                <button class="cineman-action-btn cineman-taste-check" data-title="${safeTitle}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    Will I like this?
                </button>`;

        iconWrap.innerHTML = `
            <div class="cineman-icon-circle">${iconContent}</div>
            <div class="cineman-action-menu">
                <button class="cineman-action-btn cineman-find-similar" data-title="${safeTitle}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    More like this
                </button>
                ${tasteButton}
            </div>
        `;

        // Click handlers — show in-page popups
        iconWrap.querySelector('.cineman-find-similar').addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            showSimilarPopupInPage(e.currentTarget.dataset.title);
        });

        const tasteBtnEl = iconWrap.querySelector('.cineman-taste-check');
        if (tasteBtnEl) {
            tasteBtnEl.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                showTastePopupInPage(e.currentTarget.dataset.title);
            });
        }

        container.appendChild(iconWrap);
    }

    function applyFadeout(card) {
        if (!fadeSettings.enabled) {
            card.classList.remove('cineman-faded');
            return;
        }
        const imdbStr = card.getAttribute('data-cineman-imdb');
        const rtStr = card.getAttribute('data-cineman-rt');
        const imdbVal = imdbStr ? parseFloat(imdbStr) : null;
        const rtVal = rtStr ? parseInt(rtStr) : null;

        let shouldFade = false;
        if (imdbVal !== null && imdbVal < fadeSettings.minImdb) shouldFade = true;
        if (rtVal !== null && rtVal < fadeSettings.minRt) shouldFade = true;

        if (shouldFade) {
            card.classList.add('cineman-faded');
        } else {
            card.classList.remove('cineman-faded');
        }
    }

    function injectBadge(card, ratings, tasteData) {
        if (card.querySelector(".cineman-rating-badge")) return;

        const badge = document.createElement("div");
        badge.className = "cineman-rating-badge";

        const title = extractTitle(card);
        let pills = "";

        // Taste match pill (shown first, top position)
        if (tasteData && tasteData.hasProfile && tasteData.score !== null && tasteData.score !== undefined) {
            const score = tasteData.score;
            const tier = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
            pills += '<div class="cineman-pill cineman-pill-taste taste-' + tier + '" title="CineMan Taste Match"><span class="cineman-pill-label">MATCH</span><span class="cineman-pill-value">' + score + '%</span></div>';
            card.setAttribute('data-cineman-taste', String(score));
        }

        // IMDb pill
        if (ratings && ratings.imdb && ratings.imdb !== "N/A") {
            const imdbSearchUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(title || '')}&s=tt`;
            pills += `<a href="${imdbSearchUrl}" target="_blank" rel="noopener noreferrer" class="cineman-pill cineman-pill-imdb cineman-clickable" title="Open on IMDb" style="text-decoration:none !important;"><span class="cineman-pill-label">IMDb</span><span class="cineman-pill-value">${ratings.imdb}</span></a>`;
            card.setAttribute('data-cineman-imdb', ratings.imdb);
        }

        // RT pill
        if (ratings && ratings.rt && ratings.rt !== "N/A") {
            const rtNum = parseInt(ratings.rt);
            const rtIcon = rtNum >= 60 ? "🍅" : "🤢";
            pills += `<div class="cineman-pill cineman-pill-rt"><span class="cineman-pill-label">${rtIcon}</span><span class="cineman-pill-value">${ratings.rt}</span></div>`;
            card.setAttribute('data-cineman-rt', ratings.rt);
        }

        if (!pills) return;
        badge.innerHTML = pills;

        // Search for known movie card containers only
        let container = card.querySelector(".boxart-container, .ptrack-content, .title-card-container, .boxart-rounded, .title-card, .tst-video-card, .AvCard-Link, ._1E_w9C_link, ._2y6-uC_link, [data-automation-id*='container']");

        // Fallback: try to find an image container that's clearly a movie poster/thumbnail
        if (!container) {
            const img = card.querySelector("img[alt]");
            if (img && img.parentElement) {
                // Only use if parent looks like a media container (has reasonable dimensions)
                const parentRect = img.parentElement.getBoundingClientRect();
                if (parentRect.width >= 80 && parentRect.height >= 80) {
                    container = img.parentElement;
                }
            }
        }

        // If still no container, skip this card entirely rather than attaching to random elements
        if (!container) {
            console.log("CineMan: No suitable container found for badge, skipping");
            return;
        }

        container.style.position = "relative";
        container.style.overflow = "visible";
        container.appendChild(badge);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                badge.classList.add("cineman-visible");
                // Apply fade-out based on rating thresholds
                applyFadeout(card);
            });
        });
    }

    function fetchRatings(title) {
        return new Promise((resolve) => {
            // Check exact match first, then case-insensitive
            if (ratingsCache[title] !== undefined) {
                resolve(ratingsCache[title]);
                return;
            }
            const titleLower = title.toLowerCase();
            for (const [key, val] of Object.entries(ratingsCache)) {
                if (key.toLowerCase() === titleLower) {
                    ratingsCache[title] = val; // Cache the alias too
                    resolve(val);
                    return;
                }
            }

            chrome.runtime.sendMessage(
                { action: "fetchOMDBRating", title: title },
                (response) => {
                    if (chrome.runtime.lastError || !response || !response.success) {
                        resolve(null);
                        return;
                    }
                    ratingsCache[title] = response.data;
                    resolve(response.data);
                }
            );
        });
    }

    function fetchTasteScore(title) {
        return new Promise((resolve) => {
            if (tasteScoreCache[title] !== undefined) {
                resolve(tasteScoreCache[title]);
                return;
            }
            // Case-insensitive lookup from preloaded cache
            const titleLower = title.toLowerCase().trim();
            for (const [key, val] of Object.entries(tasteScoreCache)) {
                if (key.toLowerCase().trim() === titleLower) {
                    tasteScoreCache[title] = val;
                    resolve(val);
                    return;
                }
            }
            chrome.runtime.sendMessage(
                { action: "getCardTasteScore", title: title },
                (response) => {
                    if (chrome.runtime.lastError || !response || !response.success) {
                        resolve(null);
                        return;
                    }
                    tasteScoreCache[title] = response.data;
                    resolve(response.data);
                }
            );
        });
    }

    // Batch fetch taste scores for multiple titles
    function batchFetchTasteScores(titles) {
        // Filter out already-cached titles
        const uncached = titles.filter(t => tasteScoreCache[t] === undefined);
        if (uncached.length === 0) return Promise.resolve();

        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { action: "batchCardTasteScores", titles: uncached },
                (response) => {
                    if (chrome.runtime.lastError || !response || !response.success) {
                        resolve();
                        return;
                    }
                    // Merge into cache
                    Object.entries(response.data || {}).forEach(([title, data]) => {
                        tasteScoreCache[title] = data;
                    });
                    resolve();
                }
            );
        });
    }

    // Refresh all existing badges to show taste scores (called when profile changes)
    function refreshAllCardBadges() {
        document.querySelectorAll('.cineman-rating-badge').forEach(badge => badge.remove());
        document.querySelectorAll('[data-cineman-processed]').forEach(el => el.removeAttribute('data-cineman-processed'));
        document.querySelectorAll('[data-cineman-imdb]').forEach(el => el.removeAttribute('data-cineman-imdb'));
        document.querySelectorAll('[data-cineman-rt]').forEach(el => el.removeAttribute('data-cineman-rt'));
        document.querySelectorAll('[data-cineman-taste]').forEach(el => el.removeAttribute('data-cineman-taste'));
        processedCards = new WeakSet();
        processingQueue = [];
        isProcessing = false;
        tastePassRunning = false;
        setTimeout(scanCards, 100);
    }

    async function processCard(card) {
        const title = extractTitle(card);
        if (!title || card.hasAttribute('data-cineman-processed') || card.querySelector(".cineman-rating-badge")) return;
        card.setAttribute('data-cineman-processed', '1');

        // Verify the card has a visible image
        const img = card.querySelector("img");
        if (img) {
            const imgRect = img.getBoundingClientRect();
            if (imgRect.width < 50 || imgRect.height < 50) {
                card.removeAttribute('data-cineman-processed');
                return;
            }
        } else {
            card.removeAttribute('data-cineman-processed');
            return;
        }

        // Skip if a parent/child card already has a badge (prevents nested card duplicates)
        if (card.closest('[data-cineman-imdb], [data-cineman-rt]')) return;

        // Fetch OMDB ratings (cached — fast)
        const ratings = await fetchRatings(title);
        if (ratings && !card.querySelector(".cineman-rating-badge")) {
            injectBadge(card, ratings, null);
        }
    }

    function getCardSelectors() {
        if (PLATFORM === "netflix") {
            return [".slider-item", ".title-card-container", ".ptrack-content", ".titleCard", ".title-card", "[data-testid='title-card']"];
        } else if (PLATFORM === "prime") {
            return [
                "[data-testid='card']",
                ".DVWebNode-detail-card",
                "article",
                ".tst-video-card",
                ".AvCard",
                "._1E_w9C",
                "[data-automation-id*='card']",
                "._2y6-uC",
                ".p-card",
                "[data-card-id]",
                ".grid-card"
            ];
        } else if (PLATFORM === "hotstar") {
            // Hotstar/JioCinema common card selectors
            return [
                "[class*='card-container']",
                "[class*='CardContainer']",
                "[class*='tray-item']",
                "[class*='TrayItem']",
                "[class*='content-card']",
                "[class*='ContentCard']",
                "li[class*='item']",
                "[data-testid*='card']",
                "[class*='thumbnail']",
                "[class*='Thumbnail']"
            ];
        }
        return [];
    }

    let processedCards = new WeakSet();
    let processingQueue = [];
    let isProcessing = false;

    async function processQueue() {
        if (isProcessing) return;
        isProcessing = true;
        const cardsProcessed = [];
        while (processingQueue.length > 0) {
            const card = processingQueue.shift();
            if (card && !card.querySelector(".cineman-rating-badge")) {
                await processCard(card);
                cardsProcessed.push(card);
                await new Promise(r => setTimeout(r, 60));
            }
        }
        isProcessing = false;

        // After all IMDb badges are shown, fetch taste scores sequentially (top-to-bottom)
        if (shouldShowTasteMatch() && cardsProcessed.length > 0) {
            runTasteScorePass(cardsProcessed);
        }
    }

    let tastePassRunning = false;
    async function runTasteScorePass(cards) {
        if (tastePassRunning) return;
        tastePassRunning = true;

        // Sort cards by vertical position so top-of-page cards get scored first
        const sorted = cards
            .filter(c => c.isConnected && c.querySelector('.cineman-rating-badge'))
            .sort((a, b) => {
                const ra = a.getBoundingClientRect();
                const rb = b.getBoundingClientRect();
                return ra.top - rb.top;
            });

        for (const card of sorted) {
            if (!card.isConnected) continue;
            const badge = card.querySelector('.cineman-rating-badge');
            if (!badge || badge.querySelector('.cineman-pill-taste')) continue;

            const title = extractTitle(card);
            if (!title) continue;

            try {
                const tasteData = await fetchTasteScore(title);
                if (tasteData && tasteData.hasProfile && tasteData.score !== null && tasteData.score !== undefined) {
                    // Re-check badge still exists and no taste pill yet
                    const currentBadge = card.querySelector('.cineman-rating-badge');
                    if (currentBadge && !currentBadge.querySelector('.cineman-pill-taste')) {
                        const score = tasteData.score;
                        const tier = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
                        const tastePill = document.createElement('div');
                        tastePill.className = 'cineman-pill cineman-pill-taste taste-' + tier;
                        tastePill.title = 'CineMan Taste Match';
                        tastePill.innerHTML = '<span class="cineman-pill-label">MATCH</span><span class="cineman-pill-value">' + score + '%</span>';
                        currentBadge.insertBefore(tastePill, currentBadge.firstChild);
                        card.setAttribute('data-cineman-taste', String(score));
                    }
                }
            } catch (e) { /* skip this card */ }
        }

        tastePassRunning = false;
    }

    function scanCards() {
        const selectors = getCardSelectors();
        if (selectors.length === 0) return;

        if (PLATFORM === "unknown") {
            const host = window.location.hostname;
            if (host.includes("netflix")) PLATFORM = "netflix";
            else if (host.includes("primevideo") || host.includes("amazon.")) PLATFORM = "prime";
            else if (host.includes("hotstar.com") || host.includes("jiohotstar.com")) PLATFORM = "hotstar";
        }

        const cards = document.querySelectorAll(selectors.join(", "));
        let added = false;
        cards.forEach((card) => {
            if (card.querySelector(".cineman-rating-badge")) return;

            if (!processedCards.has(card)) {
                processedCards.add(card);
                processingQueue.push(card);
                added = true;
            }
            // Removed: re-adding already-processed cards to queue
            // This was causing infinite reprocessing and badges appearing on random elements
        });
        if (added && !isProcessing) processQueue();
    }

    function startObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            for (const m of mutations) {
                if (m.addedNodes.length > 0) { shouldScan = true; break; }
            }
            if (shouldScan) {
                clearTimeout(startObserver._d);
                startObserver._d = setTimeout(() => { scanCards(); scanNetflixPreviewModal(); scanNetflixBobCards(); }, 300);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ==========================================
    // Netflix Expanded Preview Modal Overlay
    // ==========================================
    function scanNetflixPreviewModal() {
        if (PLATFORM !== "netflix") return;

        // Netflix uses multiple modal types: previewModal, jawBoneContainer, bob-card, mini-modal
        // Use only specific top-level selectors to avoid matching nested children
        const modalSelectors = [
            '.previewModal--container',
            '.jawBoneContainer',
            '[data-uia="previewModal"]',
            '[data-uia="preview-modal"]',
        ];

        const modals = document.querySelectorAll(modalSelectors.join(', '));
        modals.forEach(modal => {
            // Skip if already injected — check both this element and any ancestor/descendant
            if (modal.querySelector('.cineman-modal-overlay')) return;
            if (modal.closest('.cineman-modal-overlay')) return;
            // Skip if a parent modal already has our overlay (prevents nested matches)
            if (modal.parentElement && modal.parentElement.closest(modalSelectors.join(', '))?.querySelector('.cineman-modal-overlay')) return;

            // Extract title from the modal
            let title = null;

            // Try strong-text title element (Netflix uses <strong> or <h3> or .previewModal--player-titleTreatment-logo)
            const logoImg = modal.querySelector('[class*="titleTreatment"] img, [class*="title-treatment"] img, .title-logo img');
            if (logoImg) {
                title = logoImg.getAttribute('alt') || null;
            }

            // Blocklist: these are NOT movie/show titles
            const titleBlocklist = ['episodes', 'more like this', 'trailers & more', 'about', 'details', 'overview', 'cast', 'related', 'new & popular', 'my list', 'browse', 'home', 'next episode', 'new episode', 'continue watching', 'play', 'resume', 'audio & subtitles'];

            if (!title) {
                // Try specific Netflix title selectors first (more precise)
                const titleEl = modal.querySelector('[class*="title-text"], [class*="titleText"], [data-uia*="title"]');
                if (titleEl) {
                    const text = titleEl.textContent.trim();
                    if (text && text.length > 1 && text.length < 100 && !titleBlocklist.includes(text.toLowerCase()) && !/^S\d+:?E\d+/i.test(text)) {
                        title = text;
                    }
                }
            }

            if (!title) {
                // Try strong/h3 but skip episode labels, tab names
                const candidates = modal.querySelectorAll('strong, h3, h2');
                for (const el of candidates) {
                    const text = el.textContent.trim();
                    if (text && text.length > 1 && text.length < 100
                        && !titleBlocklist.includes(text.toLowerCase())
                        && !/^S\d+:?E\d+/i.test(text)
                        && !/^"/.test(text)
                        && !/^(Episode|Next Episode|New Episode|Continue)/i.test(text)) {
                        title = text;
                        break;
                    }
                }
            }

            // Try aria-label on the modal itself
            if (!title) {
                const ariaLabel = modal.getAttribute('aria-label') || '';
                if (ariaLabel && ariaLabel.length > 1 && ariaLabel.length < 100 && !titleBlocklist.includes(ariaLabel.toLowerCase())) title = ariaLabel;
            }

            // Try finding the closest link with aria-label
            if (!title) {
                const link = modal.querySelector('a[aria-label]');
                if (link) {
                    const label = link.getAttribute('aria-label');
                    if (label && !["Play", "Resume", "More Info", "Close", "Episodes"].includes(label)) title = label;
                }
            }

            if (!title) return;

            // Clean Netflix UI prefixes from extracted title
            title = title
                .replace(/^About\s+/i, '')
                .replace(/^Details\s+(about|for|of)\s+/i, '')
                .replace(/^More\s+(about|like)\s+/i, '')
                .trim();

            if (!title || title.length < 2) return;

            // Create the CineMan overlay for the modal
            const overlay = document.createElement('div');
            overlay.className = 'cineman-modal-overlay';
            overlay.style.cssText = `
                display: flex !important;
                gap: 8px !important;
                padding: 8px 16px !important;
                z-index: 999999 !important;
                pointer-events: auto !important;
            `;

            // Try to get the extension icon
            let iconContent = '<span style="font-size:14px;line-height:1">🎬</span>';
            try {
                const iconUrl = chrome.runtime.getURL('icons/icon32.png');
                iconContent = `<img src="${iconUrl}" alt="CineMan" style="width:16px;height:16px;border-radius:50%" />`;
            } catch (e) {}

            // Hide any card-level CineMan icons inside this modal to prevent duplicates
            modal.querySelectorAll('.cineman-action-icon').forEach(el => el.style.display = 'none');

            const safeTitleModal = (title).replace(/"/g, '&quot;');
            const tasteBtnModal = shouldShowTasteMatch() ? '' : `
                <button class="cineman-modal-btn cineman-taste-check" data-title="${safeTitleModal}" style="
                    display: inline-flex !important; align-items: center !important; gap: 6px !important;
                    padding: 8px 16px !important; border: 1px solid rgba(139, 92, 246, 0.5) !important; border-radius: 24px !important;
                    background: rgba(139, 92, 246, 0.15) !important;
                    color: #e2e8f0 !important; font-family: 'Poppins', sans-serif !important; font-size: 13px !important;
                    font-weight: 600 !important; cursor: pointer !important;
                    backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important;
                    transition: transform 0.2s, background 0.2s !important; pointer-events: auto !important;
                ">♥ Will I like this?</button>`;

            overlay.innerHTML = `
                <button class="cineman-modal-btn cineman-find-similar" data-title="${safeTitleModal}" style="
                    display: inline-flex !important; align-items: center !important; gap: 6px !important;
                    padding: 8px 16px !important; border: none !important; border-radius: 24px !important;
                    background: linear-gradient(135deg, rgba(88, 28, 135, 0.95), rgba(139, 92, 246, 0.95)) !important;
                    color: #fff !important; font-family: 'Poppins', sans-serif !important; font-size: 13px !important;
                    font-weight: 600 !important; cursor: pointer !important;
                    box-shadow: 0 3px 12px rgba(88, 28, 135, 0.5) !important;
                    transition: transform 0.2s, box-shadow 0.2s !important; pointer-events: auto !important;
                ">${iconContent} More like this</button>
                ${tasteBtnModal}
            `;

            // Hover effects
            overlay.querySelectorAll('.cineman-modal-btn').forEach(btn => {
                btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
                btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
            });

            // Click handlers — show in-page popups
            overlay.querySelector('.cineman-find-similar').addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                showSimilarPopupInPage(e.currentTarget.dataset.title);
            });
            const modalTasteEl = overlay.querySelector('.cineman-taste-check');
            if (modalTasteEl) {
                modalTasteEl.addEventListener('click', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    showTastePopupInPage(e.currentTarget.dataset.title);
                });
            }

            // Insert buttons on same row as Play/Resume, badges below
            const buttonRow = modal.querySelector('[class*="buttonControls"], [class*="action-buttons"], [class*="ActionButtons"], [class*="button-row"]');
            if (buttonRow) {
                // Add CineMan buttons directly into the Play button row
                buttonRow.style.flexWrap = 'wrap';
                buttonRow.style.gap = '8px';
                buttonRow.appendChild(overlay);
            } else {
                // Fallback: find the info/metadata area
                const infoArea = modal.querySelector('[class*="about"], [class*="info"], [class*="metadata"], [class*="detail"]');
                if (infoArea) {
                    infoArea.insertBefore(overlay, infoArea.firstChild);
                } else {
                    modal.appendChild(overlay);
                }
            }

            // Fetch and inject rating badges below the button row
            const badgeRow = document.createElement("div");
            badgeRow.className = "cineman-rating-badge cineman-visible";
            badgeRow.style.cssText = "position: relative !important; top: auto !important; right: auto !important; display: inline-flex !important; gap: 8px !important; transform: none !important; opacity: 1 !important; margin: 4px 0 0 0 !important; flex-wrap: wrap !important; width: fit-content !important; padding: 0 16px !important;";
            if (buttonRow && buttonRow.parentElement) {
                buttonRow.parentElement.insertBefore(badgeRow, buttonRow.nextSibling);
            } else {
                overlay.parentElement.appendChild(badgeRow);
            }

            // Fetch ratings + taste score in parallel (non-blocking)
            Promise.all([
                fetchRatings(title),
                shouldShowTasteMatch() ? fetchTasteScore(title) : Promise.resolve(null)
            ]).then(([ratings, tasteData]) => {
                let pills = "";

                // Taste match pill first
                if (tasteData && tasteData.hasProfile && tasteData.score !== null && tasteData.score !== undefined) {
                    const score = tasteData.score;
                    const tier = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
                    pills += '<div class="cineman-pill cineman-pill-taste taste-' + tier + '" style="width: auto !important; flex-grow: 0 !important;" title="CineMan Taste Match"><span class="cineman-pill-label">MATCH</span><span class="cineman-pill-value">' + score + '%</span></div>';
                }

                // IMDb pill
                if (ratings && ratings.imdb && ratings.imdb !== "N/A") {
                    const imdbUrl = 'https://www.imdb.com/find/?q=' + encodeURIComponent(title || '') + '&s=tt';
                    pills += '<a href="' + imdbUrl + '" target="_blank" rel="noopener noreferrer" class="cineman-pill cineman-pill-imdb cineman-clickable" title="Open on IMDb" style="text-decoration:none !important; width: auto !important; flex-grow: 0 !important;"><span class="cineman-pill-label">IMDb</span><span class="cineman-pill-value">' + ratings.imdb + '</span></a>';
                }

                // RT pill
                if (ratings && ratings.rt && ratings.rt !== "N/A") {
                    const rtNum = parseInt(ratings.rt);
                    const rtIcon = rtNum >= 60 ? "🍅" : "🤢";
                    pills += '<div class="cineman-pill cineman-pill-rt" style="width: auto !important; flex-grow: 0 !important;"><span class="cineman-pill-label">' + rtIcon + '</span><span class="cineman-pill-value">' + ratings.rt + '</span></div>';
                }

                if (pills) badgeRow.innerHTML = pills;
            });
        });
    }


    // ==========================================
    // In-Page Popup Functions (for modal buttons)
    // ==========================================
    function removeExistingCinemanPopup() {
        document.querySelectorAll('.cineman-inpage-overlay').forEach(el => el.remove());
    }

    function createPopupShell(title, loadingText) {
        removeExistingCinemanPopup();
        const overlay = document.createElement('div');
        overlay.className = 'cineman-inpage-overlay';
        overlay.style.cssText = 'position:fixed!important;inset:0!important;z-index:99999999!important;background:rgba(0,0,0,0.75)!important;display:flex!important;align-items:center!important;justify-content:center!important;backdrop-filter:blur(4px)!important;';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        const popup = document.createElement('div');
        popup.className = 'cineman-inpage-popup';
        popup.style.cssText = 'background:#1e293b!important;border-radius:16px!important;padding:24px!important;max-width:500px!important;width:90%!important;max-height:80vh!important;overflow-y:auto!important;color:#e2e8f0!important;font-family:Poppins,sans-serif!important;box-shadow:0 25px 50px rgba(0,0,0,0.5)!important;';
        popup.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <span style="font-weight:700;font-size:14px;color:#a78bfa;">CineMan AI</span>
                <button class="cineman-inpage-close" style="background:none!important;border:none!important;color:#94a3b8!important;font-size:24px!important;cursor:pointer!important;line-height:1!important;">&times;</button>
            </div>
            <div class="cineman-inpage-body" style="text-align:center;">
                <div style="margin:32px 0;">
                    <div style="width:32px;height:32px;border:3px solid #7c3aed;border-top-color:transparent;border-radius:50%;animation:cineman-spin 0.8s linear infinite;margin:0 auto 12px;"></div>
                    <p style="color:#94a3b8;font-size:13px;">${loadingText}</p>
                </div>
            </div>
        `;
        popup.querySelector('.cineman-inpage-close').addEventListener('click', () => overlay.remove());

        // Add spin animation
        if (!document.querySelector('#cineman-spin-style')) {
            const spinStyle = document.createElement('style');
            spinStyle.id = 'cineman-spin-style';
            spinStyle.textContent = '@keyframes cineman-spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(spinStyle);
        }

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        return popup;
    }

    function showTastePopupInPage(movieTitle) {
        const popup = createPopupShell(movieTitle, 'Analyzing "' + movieTitle + '"...');
        let responded = false;
        const timeout = setTimeout(() => {
            if (responded) return;
            responded = true;
            const body = popup.querySelector('.cineman-inpage-body');
            if (body) body.innerHTML = '<div style="text-align:center;padding:24px;"><p style="font-size:36px;">⏳</p><p style="color:white;font-weight:600;margin:12px 0;">Still processing your taste profile</p><p style="color:#94a3b8;font-size:13px;">Your viewing history is being analyzed in the background. Try again in a minute.</p></div>';
        }, 8000);
        chrome.runtime.sendMessage({ action: 'tasteScoremovie', movieTitle }, (response) => {
            if (responded) return;
            responded = true;
            clearTimeout(timeout);
            const body = popup.querySelector('.cineman-inpage-body');
            if (!response || !response.success) {
                body.innerHTML = '<div style="text-align:center;padding:24px;"><p style="font-size:36px;">😕</p><p style="color:white;font-weight:600;margin:12px 0;">Couldn\'t analyze "' + movieTitle + '"</p><p style="color:#888;font-size:13px;">' + (response?.error || 'Unknown error') + '</p></div>';
                return;
            }
            const d = response.data;
            const score = d.tasteMatch;
            const hasProfile = d.hasProfile;
            if (!hasProfile || score === null) {
                body.innerHTML = '<div style="text-align:center;padding:24px;"><p style="font-size:36px;">🎯</p><p style="color:white;font-weight:600;font-size:16px;margin:12px 0 8px;">Set Up Your Taste Profile</p><p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">Sync your viewing history so CineMan can predict how well you\'ll like this.</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"><a href="https://www.netflix.com/settings/viewed/" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(229,9,20,0.85);color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Netflix History</a><a href="https://www.primevideo.com/settings/watch-history" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(0,168,225,0.85);color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Prime History</a></div></div>';
                return;
            }
            const sc = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
            const sl = score >= 75 ? "You\'ll love it!" : score >= 50 ? "Worth a watch" : "Might not be your taste";
            const genres = (d.genres || []).map(g => '<span style="display:inline-block;padding:2px 10px;background:#334155;border-radius:12px;font-size:11px;color:#c084fc;margin:2px;">' + g + '</span>').join('');
            const reasons = (d.reasons || []).map(r => '<li style="color:#94a3b8;font-size:12px;margin:4px 0;">' + r + '</li>').join('');
            const cast = (d.cast || []).slice(0, 4).join(', ');
            body.innerHTML = '<div style="text-align:center;margin-bottom:12px;"><h2 style="color:white;font-size:20px;font-weight:700;margin:0;">' + (d.title || movieTitle) + '</h2>' + (d.year ? '<span style="color:#888;font-size:13px;">' + d.year + (d.director ? ' · ' + d.director : '') + '</span>' : '') + '</div><div style="text-align:center;background:linear-gradient(135deg,rgba(' + (sc === '#22c55e' ? '34,197,94' : sc === '#f59e0b' ? '245,158,11' : '239,68,68') + ',0.12),rgba(102,126,234,0.08));border:1px solid rgba(' + (sc === '#22c55e' ? '34,197,94' : sc === '#f59e0b' ? '245,158,11' : '239,68,68') + ',0.25);border-radius:16px;padding:20px 16px;margin-bottom:14px;"><div style="font-size:48px;font-weight:900;color:' + sc + ';letter-spacing:-2px;">' + score + '%</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.45);margin:4px 0 6px;">taste match</div><div style="font-size:14px;font-weight:600;color:' + sc + ';">' + sl + '</div></div>' + (genres ? '<div style="margin-bottom:10px;text-align:center;">' + genres + '</div>' : '') + (d.synopsis ? '<p style="font-size:13px;color:#aaa;margin:10px 0;line-height:1.5;">' + d.synopsis.substring(0, 200) + '</p>' : '') + (cast ? '<p style="font-size:12px;color:#777;margin:4px 0;">Cast: ' + cast + '</p>' : '') + (reasons ? '<ul style="padding-left:16px;margin:8px 0;">' + reasons + '</ul>' : '');

            // Persist the taste score on ALL matching card badges on the page
            const tier = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
            document.querySelectorAll('.cineman-rating-badge').forEach(badge => {
                // Find the card this badge belongs to
                const card = badge.closest('[data-cineman-processed]');
                if (!card) return;
                const cardTitle = extractTitle(card);
                if (!cardTitle || cardTitle.toLowerCase() !== movieTitle.toLowerCase()) return;
                // Add taste pill if not already present
                if (badge.querySelector('.cineman-pill-taste')) return;
                const tastePill = document.createElement('div');
                tastePill.className = 'cineman-pill cineman-pill-taste taste-' + tier;
                tastePill.title = 'CineMan Taste Match';
                tastePill.innerHTML = '<span class="cineman-pill-label">MATCH</span><span class="cineman-pill-value">' + score + '%</span>';
                badge.insertBefore(tastePill, badge.firstChild);
                card.setAttribute('data-cineman-taste', String(score));
            });

            // Also cache the score for future page loads
            tasteScoreCache[movieTitle] = { hasProfile: true, score: score, confidence: 'medium' };
        });
    }

    function showSimilarPopupInPage(movieTitle) {
        const popup = createPopupShell(movieTitle, 'Finding movies like "' + movieTitle + '"...');
        popup.style.maxWidth = '600px';
        let responded = false;
        const timeout = setTimeout(() => {
            if (responded) return;
            responded = true;
            const body = popup.querySelector('.cineman-inpage-body');
            if (body) body.innerHTML = '<div style="text-align:center;padding:24px;"><p style="font-size:36px;">⏳</p><p style="color:white;font-weight:600;margin:12px 0;">Still processing</p><p style="color:#94a3b8;font-size:13px;">Your taste profile is being built in the background. Try again in a minute.</p></div>';
        }, 10000);
        chrome.runtime.sendMessage({ action: 'getSimilarMovies', movieTitle }, (response) => {
            if (responded) return;
            responded = true;
            clearTimeout(timeout);
            const body = popup.querySelector('.cineman-inpage-body');
            if (!response || !response.success) {
                body.innerHTML = '<div style="text-align:center;padding:24px;"><p style="font-size:36px;">🤔</p><p style="color:white;font-weight:600;margin:12px 0;">Couldn\'t find similar titles</p><p style="color:#888;font-size:13px;">' + (response?.error || 'Unknown error') + '</p></div>';
                return;
            }
            const similar = (response.data?.similar || response.data || []);
            if (similar.length === 0) {
                body.innerHTML = '<div style="text-align:center;padding:24px;"><p style="font-size:36px;">🤔</p><p style="color:white;font-weight:600;margin:12px 0;">No similar titles found</p></div>';
                return;
            }
            let html = '<h3 style="color:white;font-size:16px;margin:0 0 12px;text-align:center;">More like "' + movieTitle + '"</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
            similar.slice(0, 9).forEach(m => {
                const poster = m.poster || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="185" height="278" fill="%23222"><rect width="185" height="278"/><text x="50%" y="50%" fill="%23555" text-anchor="middle" dy=".3em" font-size="14">No Poster</text></svg>');
                html += '<div style="text-align:center;"><img src="' + poster + '" style="width:100%;border-radius:8px;aspect-ratio:2/3;object-fit:cover;" onerror="this.style.background=\'#334155\'" /><p style="color:white;font-size:11px;font-weight:600;margin:4px 0 0;line-clamp:2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (m.title || '') + '</p><p style="color:#888;font-size:10px;margin:0;">' + (m.year || '') + '</p></div>';
            });
            html += '</div>';
            body.innerHTML = html;
        });
    }


    // ==========================================
    // Netflix Bob Cards (mid-sized hover cards)
    // ==========================================
    function scanNetflixBobCards() {
        if (PLATFORM !== "netflix") return;
        const bobSelectors = [
            '.bob-container',
            '[class*="bob-card"]',
            '[class*="mini-modal"]',
        ];
        const bobs = document.querySelectorAll(bobSelectors.join(', '));
        bobs.forEach(bob => {
            // Skip empty bob-containers (not yet populated by Netflix on hover)
            if (bob.children.length === 0) return;
            // Skip if already inside a preview modal
            if (bob.closest('.previewModal--container, [data-uia="previewModal"], .jawBoneContainer')) return;
            // Skip if already injected
            if (bob.querySelector('.cineman-modal-overlay')) return;
            if (bob.closest('.cineman-modal-overlay')) return;

            const bobBlocklist = ['episodes', 'more like this', 'trailers & more', 'about', 'details', 'overview', 'cast', 'related', 'next episode', 'new episode', 'continue watching', 'play', 'resume', 'my list', 'audio & subtitles'];

            let title = null;
            const logoImg = bob.querySelector('[class*="titleTreatment"] img, .title-logo img');
            if (logoImg) title = logoImg.getAttribute('alt') || null;

            if (!title) {
                // Try specific title selectors first
                const titleEl = bob.querySelector('[class*="title-text"], [class*="titleText"]');
                if (titleEl) {
                    const text = titleEl.textContent.trim();
                    if (text && text.length > 1 && text.length < 100 && !bobBlocklist.includes(text.toLowerCase()) && !/^S\d+:?E\d+/i.test(text)) title = text;
                }
            }

            if (!title) {
                // Try strong/h3 but filter aggressively
                const candidates = bob.querySelectorAll('strong, h3, h2');
                for (const el of candidates) {
                    const text = el.textContent.trim();
                    if (text && text.length > 1 && text.length < 100
                        && !bobBlocklist.includes(text.toLowerCase())
                        && !/^S\d+:?E\d+/i.test(text)
                        && !/^"/.test(text)
                        && !/^(Episode|Next Episode|New Episode|Continue)/i.test(text)) {
                        title = text;
                        break;
                    }
                }
            }

            if (!title) {
                const link = bob.querySelector('a[aria-label]');
                if (link) {
                    const label = link.getAttribute('aria-label');
                    if (label && !["Play", "Resume", "More Info", "Close", "Episodes"].includes(label)) title = label;
                }
            }
            if (!title) return;

            // Clean Netflix UI prefixes
            title = title.replace(/^About\s+/i, '').replace(/^Details\s+(about|for|of)\s+/i, '').replace(/^More\s+(about|like)\s+/i, '').trim();
            if (!title || title.length < 2) return;

            // Create compact overlay for bob cards
            const overlay = document.createElement('div');
            overlay.className = 'cineman-modal-overlay';
            overlay.style.cssText = 'display:flex!important;gap:6px!important;padding:6px 10px!important;z-index:999999!important;pointer-events:auto!important;flex-wrap:wrap!important;';

            let iconContent = '<span style="font-size:12px;line-height:1">🎬</span>';
            try {
                const iconUrl = chrome.runtime.getURL('icons/icon32.png');
                iconContent = '<img src="' + iconUrl + '" alt="CineMan" style="width:14px;height:14px;border-radius:50%" />';
            } catch (e) {}

            // Hide any small-card icons inside
            bob.querySelectorAll('.cineman-action-icon').forEach(el => el.style.display = 'none');

            const safeT = (title).replace(/"/g, '&quot;');
            const tasteBtn = shouldShowTasteMatch() ? '' : '<button class="cineman-modal-btn cineman-taste-check" data-title="' + safeT + '" style="display:inline-flex!important;align-items:center!important;gap:4px!important;padding:5px 12px!important;border:1px solid rgba(139,92,246,0.5)!important;border-radius:16px!important;background:rgba(139,92,246,0.15)!important;color:#e2e8f0!important;font-family:Poppins,sans-serif!important;font-size:11px!important;font-weight:600!important;cursor:pointer!important;backdrop-filter:blur(8px)!important;pointer-events:auto!important;">♥ Will I like this?</button>';
            overlay.innerHTML = '<button class="cineman-modal-btn cineman-find-similar" data-title="' + safeT + '" style="display:inline-flex!important;align-items:center!important;gap:4px!important;padding:5px 12px!important;border:none!important;border-radius:16px!important;background:linear-gradient(135deg,rgba(88,28,135,0.95),rgba(139,92,246,0.95))!important;color:#fff!important;font-family:Poppins,sans-serif!important;font-size:11px!important;font-weight:600!important;cursor:pointer!important;pointer-events:auto!important;">' + iconContent + ' More like this</button>' + tasteBtn;

            overlay.querySelector('.cineman-find-similar').addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                showSimilarPopupInPage(e.currentTarget.dataset.title);
            });
            const bobTasteEl = overlay.querySelector('.cineman-taste-check');
            if (bobTasteEl) {
                bobTasteEl.addEventListener('click', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    showTastePopupInPage(e.currentTarget.dataset.title);
                });
            }

            // Insert near action buttons or at end
            const buttonRow = bob.querySelector('[class*="buttonControls"], [class*="action-buttons"], [class*="ActionButtons"]');
            if (buttonRow) {
                buttonRow.style.display = 'flex';
                buttonRow.style.flexWrap = 'wrap';
                buttonRow.style.gap = '6px';
                buttonRow.appendChild(overlay);
            } else {
                bob.appendChild(overlay);
            }
        });
    }

    function init() {
        console.log("CineMan: 🎬 Initializing Rating Overlay for " + PLATFORM);
        setTimeout(scanCards, 1000);
        setTimeout(scanCards, 3000);
        setTimeout(scanCards, 6000);
        startObserver();
        setInterval(() => { scanCards(); scanNetflixPreviewModal(); scanNetflixBobCards(); }, 6000); // Safety heartbeat
    }

    init();
})();
