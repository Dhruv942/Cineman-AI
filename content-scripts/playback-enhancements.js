/*************************************************************
 * CineMan — Playback Enhancements & Discovery Tools
 *
 * Features:
 *   1. Hidden Netflix Genre Categories (500+ codes)
 *   2. Playback Speed Control ([ and ] keys)
 *   3. Picture-in-Picture one-click
 *   4. Auto-skip intros/recaps on Netflix
 *************************************************************/

(function () {
    "use strict";

    if (window.__cinemanPlaybackEnhancements) return;
    window.__cinemanPlaybackEnhancements = true;

    const hostname = window.location.hostname;
    let PLATFORM = "unknown";
    if (hostname.includes("netflix.com")) PLATFORM = "netflix";
    else if (hostname.includes("primevideo.com") || hostname.includes("amazon.")) PLATFORM = "prime";
    else if (hostname.includes("hotstar.com") || hostname.includes("jiohotstar.com")) PLATFORM = "hotstar";

    console.log("CineMan: ⚡ Playback Enhancements Active for " + PLATFORM);

    // ==========================================
    // Settings (loaded from chrome.storage)
    // ==========================================
    let settings = {
        speedControlEnabled: true,
        pipEnabled: true,
        autoSkipEnabled: true,
        hiddenGenresEnabled: true,
    };

    chrome.storage.local.get(['cineman_playback_settings'], (data) => {
        if (data.cineman_playback_settings) {
            settings = { ...settings, ...data.cineman_playback_settings };
        }
        init();
    });

    // ==========================================
    // FEATURE 1: Hidden Netflix Genre Categories
    // ==========================================
    const NETFLIX_HIDDEN_GENRES = {
        // Popular Hidden
        "Oscar-Winning Films": 51063,
        "Emmy Award-Winning Series": 81376,
        "Cult Movies": 7627,
        "B-Horror Movies": 8195,
        "Film Noir": 7687,
        "Classic Sci-Fi & Fantasy": 47147,
        "Spy Action & Adventure": 10702,
        "Military Action & Adventure": 2125,
        "Martial Arts Movies": 8985,
        "Satires": 4922,
        "Mockumentaries": 26,
        "Steamy Romantic Movies": 35800,
        "Romantic Favourites": 502675,
        "Tearjerkers": 6384,
        "Feel-Good Movies": 11977,
        "Movies Based on Books": 4961,
        "Movies Based on Real Life": 9994,
        "Biographical Dramas": 3179,
        "Political Dramas": 6616,
        "Courtroom Dramas": 528582748,
        "Social Issue Dramas": 3947,
        "Showbiz Dramas": 5012,
        "Sports Dramas": 7243,
        "Crime Dramas": 6889,
        "Gangster Movies": 31851,
        "Heist Films": 27018,
        "Psychological Thrillers": 5505,
        "Supernatural Thrillers": 11140,
        "Political Thrillers": 10504,
        "Sci-Fi Thrillers": 11014,
        "Mysteries": 9994,
        "Classic Thrillers": 46588,
        "Alien Sci-Fi": 3327,
        "Cyberpunk": 1412727,
        "Dystopian Movies": 1412750,
        "Fantasy Movies": 9744,
        "Werewolf Horror": 75804,
        "Vampire Horror": 75930,
        "Zombie Horror": 75405,
        "Slasher & Serial Killer": 8646,
        "Creature Features": 6895,
        "Teen Screams": 52147,
        "Classic Horror": 48303,
        "Deep Sea Horror": 45028,
        "Monster Movies": 947,
        "Slapstick Comedy": 10256,
        "Dark Comedies": 869,
        "Romantic Comedies": 5475,
        "Political Comedies": 2700,
        "Spoofs & Satire": 4922,
        "Stand-Up Comedy": 11559,
        "Musicals": 13335,
        "Classic Musicals": 32392,
        "Disney Musicals": 59433,
        "Music & Concert Films": 1105,
        "Country & Western": 1220,
        "Jazz & Blues": 554,
        "Latin Music": 10741,
        "Rock & Pop Concerts": 3278,
        "K-Drama": 67879,
        "Anime Action": 2653,
        "Anime Sci-Fi": 2729,
        "Anime Horror": 10695,
        "Anime Comedy": 9302,
        "Anime Drama": 452,
        "Anime Fantasy": 11146,
        "Adult Animation": 11881,
        "Classic Westerns": 47465,
        "Epics": 52858,
        "Silent Movies": 53310,
        "Bollywood": 5480,
        "British TV": 52117,
        "Korean Movies": 5685,
        "African Movies": 3761,
        "French Movies": 58807,
        "German Movies": 58886,
        "Italian Movies": 8221,
        "Scandinavian Movies": 9292,
        "Spanish Movies": 58741,
        "Australian Movies": 5230,
        "New Zealand Movies": 63782,
        "Japanese Movies": 10398,
        "Chinese Movies": 3960,
        "Middle Eastern Movies": 5875,
        "Southeast Asian Movies": 9196,
        "Eastern European Movies": 5254,
        "Irish Movies": 58750,
        "Dutch Movies": 10606,
        "Travel & Adventure Docs": 1159,
        "Science & Nature Docs": 2595,
        "True Crime Docs": 9875,
        "Military Docs": 4006,
        "Historical Docs": 5349,
        "Music & Performance Docs": 90361,
        "Sports Docs": 180,
        "Social & Cultural Docs": 3675,
        "Food & Travel": 72436,
        "Kids & Family": 783,
        "Family Features": 51056,
        "Education for Kids": 10659,
        "Kids TV Shows": 27346,
        "Disney": 67673,
        "Movies for 5-7 Year Olds": 561,
        "Movies for 8-10 Year Olds": 6962,
        "Movies for 11-12 Year Olds": 6218,
        "LGBTQ Movies": 5977,
        "Independent Films": 7077,
        "Experimental Films": 11079,
        "Faith & Spirituality": 26835,
        "Sports Movies": 4370,
        "Baseball Movies": 12339,
        "Boxing Movies": 12443,
        "Football Movies": 12803,
        "Soccer Movies": 12549,
        "Martial Arts": 8985,
    };

    let genresDropdownInjected = false;

    function injectHiddenGenresDropdown() {
        if (PLATFORM !== "netflix" || genresDropdownInjected) return;
        if (document.querySelector('.cineman-genres-btn')) return;

        // Create floating genre button
        const container = document.createElement('div');
        container.className = 'cineman-genres-container';
        container.innerHTML = `
            <button class="cineman-genres-btn" title="Browse Hidden Netflix Genres">
                <span style="font-size:16px">🎭</span>
                <span style="font-size:12px;font-weight:600;font-family:'Poppins',sans-serif">Genres</span>
            </button>
            <div class="cineman-genres-dropdown">
                <div class="cineman-genres-header">
                    <span style="font-weight:700;font-size:14px;color:#e2e8f0">🎬 Hidden Netflix Genres</span>
                    <input type="text" class="cineman-genres-search" placeholder="Search genres..." />
                </div>
                <div class="cineman-genres-list"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .cineman-genres-container {
                position: fixed !important;
                bottom: 24px !important;
                left: 24px !important;
                z-index: 9999999 !important;
                font-family: 'Poppins', sans-serif !important;
            }
            .cineman-genres-btn {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                padding: 10px 18px !important;
                border: none !important;
                border-radius: 28px !important;
                background: linear-gradient(135deg, rgba(88, 28, 135, 0.95), rgba(139, 92, 246, 0.95)) !important;
                color: #fff !important;
                cursor: pointer !important;
                box-shadow: 0 4px 20px rgba(88, 28, 135, 0.5) !important;
                transition: transform 0.2s, box-shadow 0.2s !important;
                font-family: 'Poppins', sans-serif !important;
            }
            .cineman-genres-btn:hover {
                transform: scale(1.05) !important;
                box-shadow: 0 6px 24px rgba(139, 92, 246, 0.7) !important;
            }
            .cineman-genres-dropdown {
                display: none;
                position: absolute !important;
                bottom: 52px !important;
                left: 0 !important;
                width: 300px !important;
                max-height: 450px !important;
                background: rgba(15, 23, 42, 0.98) !important;
                border: 1px solid rgba(139, 92, 246, 0.4) !important;
                border-radius: 16px !important;
                box-shadow: 0 12px 40px rgba(0,0,0,0.8) !important;
                backdrop-filter: blur(16px) !important;
                -webkit-backdrop-filter: blur(16px) !important;
                overflow: hidden !important;
            }
            .cineman-genres-container.cineman-open .cineman-genres-dropdown {
                display: block !important;
            }
            .cineman-genres-header {
                padding: 14px 16px 10px !important;
                border-bottom: 1px solid rgba(139, 92, 246, 0.2) !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
            }
            .cineman-genres-search {
                width: 100% !important;
                padding: 8px 12px !important;
                border: 1px solid rgba(139, 92, 246, 0.3) !important;
                border-radius: 8px !important;
                background: rgba(30, 41, 59, 0.8) !important;
                color: #e2e8f0 !important;
                font-size: 13px !important;
                font-family: 'Poppins', sans-serif !important;
                outline: none !important;
            }
            .cineman-genres-search:focus {
                border-color: rgba(139, 92, 246, 0.6) !important;
            }
            .cineman-genres-search::placeholder {
                color: #64748b !important;
            }
            .cineman-genres-list {
                max-height: 340px !important;
                overflow-y: auto !important;
                padding: 8px !important;
            }
            .cineman-genres-list::-webkit-scrollbar {
                width: 6px !important;
            }
            .cineman-genres-list::-webkit-scrollbar-track {
                background: transparent !important;
            }
            .cineman-genres-list::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.4) !important;
                border-radius: 3px !important;
            }
            .cineman-genre-item {
                display: block !important;
                width: 100% !important;
                padding: 8px 12px !important;
                border: none !important;
                background: transparent !important;
                color: #cbd5e1 !important;
                font-size: 13px !important;
                font-family: 'Poppins', sans-serif !important;
                text-align: left !important;
                cursor: pointer !important;
                border-radius: 8px !important;
                transition: background 0.15s !important;
                text-decoration: none !important;
            }
            .cineman-genre-item:hover {
                background: rgba(139, 92, 246, 0.25) !important;
                color: #fff !important;
            }
        `;
        document.head.appendChild(style);

        // Populate genres list
        const list = container.querySelector('.cineman-genres-list');
        const sortedGenres = Object.entries(NETFLIX_HIDDEN_GENRES).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [name, code] of sortedGenres) {
            const item = document.createElement('a');
            item.className = 'cineman-genre-item';
            item.href = `https://www.netflix.com/browse/genre/${code}`;
            item.textContent = name;
            item.addEventListener('click', (e) => {
                container.classList.remove('cineman-open');
            });
            list.appendChild(item);
        }

        // Toggle dropdown
        container.querySelector('.cineman-genres-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('cineman-open');
            if (container.classList.contains('cineman-open')) {
                setTimeout(() => container.querySelector('.cineman-genres-search').focus(), 100);
            }
        });

        // Search filter — stop propagation on BOTH capture and bubble phases
        // Netflix uses capture-phase keydown listeners that steal focus/input
        const searchInput = container.querySelector('.cineman-genres-search');
        ['keydown', 'keyup', 'keypress', 'input'].forEach(evt => {
            searchInput.addEventListener(evt, (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
            }, true); // capture phase
            searchInput.addEventListener(evt, (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
            }, false); // bubble phase
        });
        // Also prevent Netflix from blurring the input
        searchInput.addEventListener('focus', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, true);
        searchInput.addEventListener('blur', (e) => {
            // Delay re-blur so Netflix can't immediately steal focus
            if (document.activeElement !== searchInput && container.classList.contains('cineman-open')) {
                e.preventDefault();
            }
        });
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            list.querySelectorAll('.cineman-genre-item').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(query) ? 'block' : 'none';
            });
        });

        // Close on outside click — only add once
        if (!injectHiddenGenresDropdown._closeListenerAdded) {
            document.addEventListener('click', (e) => {
                const c = document.querySelector('.cineman-genres-container');
                if (c && !c.contains(e.target)) {
                    c.classList.remove('cineman-open');
                }
            });
            injectHiddenGenresDropdown._closeListenerAdded = true;
        }

        document.body.appendChild(container);
        genresDropdownInjected = true;
    }

    // ==========================================
    // FEATURE 2: Playback Speed Control
    // ==========================================
    let currentSpeed = 1.0;
    let speedOverlay = null;
    let speedOverlayTimeout = null;

    function showSpeedOverlay(speed) {
        if (!speedOverlay) {
            speedOverlay = document.createElement('div');
            speedOverlay.style.cssText = `
                position: fixed !important;
                top: 60px !important;
                right: 24px !important;
                z-index: 99999999 !important;
                padding: 12px 20px !important;
                border-radius: 12px !important;
                background: rgba(15, 23, 42, 0.92) !important;
                border: 1px solid rgba(139, 92, 246, 0.5) !important;
                color: #e2e8f0 !important;
                font-family: 'Poppins', sans-serif !important;
                font-size: 15px !important;
                font-weight: 700 !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
                pointer-events: none !important;
                transition: opacity 0.3s ease !important;
            `;
            document.body.appendChild(speedOverlay);
        }

        speedOverlay.textContent = `⚡ ${speed.toFixed(2)}x`;
        speedOverlay.style.opacity = '1';

        clearTimeout(speedOverlayTimeout);
        speedOverlayTimeout = setTimeout(() => {
            if (speedOverlay) speedOverlay.style.opacity = '0';
        }, 1500);
    }

    function getVideo() {
        return document.querySelector('video');
    }

    function adjustSpeed(delta) {
        const video = getVideo();
        if (!video) return;

        currentSpeed = Math.max(0.25, Math.min(4.0, currentSpeed + delta));
        video.playbackRate = currentSpeed;
        showSpeedOverlay(currentSpeed);
    }

    function initSpeedControl() {
        if (!settings.speedControlEnabled) return;

        document.addEventListener('keydown', (e) => {
            // Don't trigger in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

            if (e.key === '[') {
                e.preventDefault();
                adjustSpeed(-0.25);
            } else if (e.key === ']') {
                e.preventDefault();
                adjustSpeed(0.25);
            } else if (e.key === '\\') {
                // Reset to 1x
                e.preventDefault();
                currentSpeed = 1.0;
                const video = getVideo();
                if (video) video.playbackRate = 1.0;
                showSpeedOverlay(1.0);
            }
        });

        // Sync speed when a NEW video element appears (e.g., navigating between episodes)
        // Instead of a broad MutationObserver, use a targeted interval that only checks
        // when speed is non-default, and listens for native ratechange events.
        let lastVideoEl = null;
        setInterval(() => {
            if (currentSpeed === 1.0) return;
            const video = getVideo();
            if (!video) return;
            // If this is a new video element, apply our speed and attach ratechange listener
            if (video !== lastVideoEl) {
                lastVideoEl = video;
                video.playbackRate = currentSpeed;
                video.addEventListener('ratechange', () => {
                    // Sync currentSpeed if changed by native controls
                    if (Math.abs(video.playbackRate - currentSpeed) > 0.01) {
                        currentSpeed = video.playbackRate;
                    }
                });
            }
        }, 2000);
    }

    // ==========================================
    // FEATURE 3: Picture-in-Picture
    // ==========================================
    let pipButtonInjected = false;
    let pipStyleInjected = false;
    let pipVisibilityInterval = null;

    function injectPipStyle() {
        if (pipStyleInjected || document.querySelector('#cineman-pip-style')) return;
        const style = document.createElement('style');
        style.id = 'cineman-pip-style';
        style.textContent = `
            .cineman-pip-btn {
                position: fixed !important;
                bottom: 24px !important;
                right: 24px !important;
                z-index: 99999999 !important;
                width: 44px !important;
                height: 44px !important;
                border-radius: 50% !important;
                border: none !important;
                background: linear-gradient(135deg, rgba(88, 28, 135, 0.95), rgba(139, 92, 246, 0.95)) !important;
                color: #fff !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 4px 16px rgba(88, 28, 135, 0.5) !important;
                transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s !important;
                opacity: 0.7 !important;
            }
            .cineman-pip-btn:hover {
                transform: scale(1.1) !important;
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.7) !important;
                opacity: 1 !important;
            }
            .cineman-pip-btn.cineman-hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        pipStyleInjected = true;
    }

    function injectPipButton() {
        if (!settings.pipEnabled) return;
        if (document.querySelector('.cineman-pip-btn')) { pipButtonInjected = true; return; }

        const video = getVideo();
        if (!video) return;

        injectPipStyle();

        const btn = document.createElement('button');
        btn.className = 'cineman-pip-btn';
        btn.title = 'Picture-in-Picture (CineMan)';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <rect x="12" y="10" width="8" height="6" rx="1" ry="1" fill="currentColor" opacity="0.3"/>
            </svg>
        `;

        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const vid = getVideo();
            if (!vid) return;
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await vid.requestPictureInPicture();
                }
            } catch (err) {
                console.error('CineMan: PiP failed:', err);
            }
        });

        document.body.appendChild(btn);
        pipButtonInjected = true;

        // Show/hide based on video playing state — single interval, cleared on re-injection
        if (pipVisibilityInterval) clearInterval(pipVisibilityInterval);
        function updatePipVisibility() {
            const existingBtn = document.querySelector('.cineman-pip-btn');
            if (!existingBtn) return;
            const vid = getVideo();
            const isWatchPage = window.location.pathname.includes('/watch') ||
                                window.location.pathname.includes('/video/') ||
                                window.location.pathname.includes('/dp/');
            existingBtn.classList.toggle('cineman-hidden', !vid || !isWatchPage);
        }
        pipVisibilityInterval = setInterval(updatePipVisibility, 2000);
        updatePipVisibility();
    }

    // ==========================================
    // FEATURE 4: Auto-Skip Intros & Recaps
    // ==========================================
    function initAutoSkip() {
        if (!settings.autoSkipEnabled) return;

        const skipSelectors = {
            netflix: [
                '[data-uia="player-skip-intro"]',       // Skip Intro
                '[data-uia="player-skip-recap"]',        // Skip Recap
                '.skip-credits a',                       // Skip Credits / Next Episode
                'button[data-uia="next-episode-seamless-button"]', // Next Episode
                '[class*="skip-intro"]',
                '[class*="skipIntro"]',
                'button[aria-label="Skip Intro"]',
                'button[aria-label="Skip Recap"]',
            ],
            prime: [
                '.atvwebplayersdk-skipelement-button',
                '[class*="skipElement"]',
                'button[class*="skip"]',
                '[data-testid="skip-intro-button"]',
            ],
            hotstar: [
                '[class*="skip-intro"]',
                '[class*="SkipIntro"]',
                'button[class*="skip"]',
            ],
        };

        const selectors = skipSelectors[PLATFORM] || [];
        if (selectors.length === 0) return;

        let skipCooldown = false;
        let skipTimeout = null;

        const observer = new MutationObserver(() => {
            if (skipCooldown) return; // Debounce: don't fire again within cooldown

            for (const sel of selectors) {
                const btn = document.querySelector(sel);
                if (btn && btn.offsetParent !== null) {
                    skipCooldown = true;
                    clearTimeout(skipTimeout);
                    skipTimeout = setTimeout(() => {
                        const stillThere = document.querySelector(sel);
                        if (stillThere && stillThere.offsetParent !== null) {
                            console.log('CineMan: Auto-skipping:', sel);
                            stillThere.click();
                        }
                        // Reset cooldown after 3 seconds to allow next skip opportunity
                        setTimeout(() => { skipCooldown = false; }, 3000);
                    }, 800);
                    break;
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ==========================================
    // INIT
    // ==========================================
    function init() {
        // Hidden genres button removed — users found it cluttering the Netflix UI

        // Playback speed
        initSpeedControl();

        // PiP button
        setTimeout(injectPipButton, 3000);
        // Re-inject if removed by SPA navigation
        setInterval(() => {
            if (!document.querySelector('.cineman-pip-btn')) {
                pipButtonInjected = false;
                injectPipButton();
            }
        }, 5000);

        // Auto-skip
        initAutoSkip();
    }
})();
