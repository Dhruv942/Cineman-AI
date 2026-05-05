(() => {
    const CINEMAN_BUTTON_CLASS = 'cineman-google-add-button';

    // --- Utility Functions ---

    function cleanTitle(title) {
        // Remove trailing info sometimes added by Google, e.g., " - Wikipedia"
        return title.split(' - ')[0].trim();
    }

    function getYearFromText(text) {
        if (!text) return new Date().getFullYear();
        // Look for a 4-digit number that looks like a year (e.g., 1980-2025)
        const yearMatch = text.match(/\b(19[89]\d|20\d\d)\b/);
        return yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
    }
    
    // Static SVG markup parsed via <template> — never injected via .innerHTML on
    // nodes that hold dynamic data.
    function svgFromString(svgStr) {
        const tpl = document.createElement('template');
        tpl.innerHTML = svgStr.trim();
        return tpl.content.firstChild;
    }
    const SVG_BOOKMARK = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>';
    const SVG_SPINNER = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="animate-spin" style="width:18px; height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.69a8.25 8.25 0 00-11.667 0l-3.181 3.183" /></svg>';
    const SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:18px; height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>';

    function setButtonState(button, svgStr, label) {
        // Replace children safely without parsing the label as HTML
        while (button.firstChild) button.removeChild(button.firstChild);
        if (svgStr) button.appendChild(svgFromString(svgStr));
        const span = document.createElement('span');
        span.textContent = label;
        button.appendChild(span);
    }

    function createButton(title, year, posterUrl) {
        const button = document.createElement('button');
        button.className = CINEMAN_BUTTON_CLASS;
        button.type = 'button';
        button.setAttribute('aria-label', `Add ${title} to watchlist`);
        setButtonState(button, SVG_BOOKMARK, 'Add to Watchlist');

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            button.disabled = true;
            setButtonState(button, SVG_SPINNER, 'Adding…');

            const item = {
                id: `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`,
                title: title,
                year: year,
                posterUrl: posterUrl,
                summary: 'Added from Google search.',
                genres: []
            };

            try {
                const response = await chrome.runtime.sendMessage({ action: "addToWatchlist", data: { item } });
                if (response && response.success) {
                    if (response.added) {
                        setButtonState(button, SVG_CHECK, 'Added ✓');
                        button.classList.add('cineman-added');
                    } else {
                        setButtonState(button, '', 'Already in list');
                        button.classList.add('cineman-exists');
                    }
                } else {
                    setButtonState(button, '', 'Error');
                }
            } catch (error) {
                setButtonState(button, '', 'Error');
            }
        });

        return button;
    }

    // --- Injection Logic ---

    function injectButtonIfPanelExists() {
        // Find the main knowledge panel container
        const panel = document.querySelector('div[data-attrid*="kc:/film/film"], div[data-attrid*="kc:/tv/tv_program"]');
        if (!panel || panel.querySelector(`.${CINEMAN_BUTTON_CLASS}`)) {
            return; // Panel not found or button already injected
        }

        // --- Scrape Data ---
        let title = '';
        let year = new Date().getFullYear();
        let posterUrl = '';

        // Try to find the title
        const titleEl = panel.querySelector('[data-attrid="title"] span');
        if (titleEl) {
            title = cleanTitle(titleEl.textContent);
        } else {
            // Fallback for different structures
            const h2Title = panel.querySelector('h2[data-attrid="title"]');
            if(h2Title) title = cleanTitle(h2Title.textContent);
        }

        if (!title) return;

        // Try to find the year from metadata text
        const metaDataEl = panel.querySelector('div[data-attrid="subtitle"]');
        if (metaDataEl) {
            year = getYearFromText(metaDataEl.textContent);
        }

        // Try to find the poster image
        const posterEl = panel.querySelector('div[data-attrid="image"] img');
        if (posterEl) {
            posterUrl = posterEl.src;
        }

        // --- Find Injection Point & Inject ---
        // A common element to anchor our button is the one containing action buttons like "Watch options"
        const injectionAnchor = panel.querySelector('div[data-attrid="watch_now_action_button"]');
        
        if (injectionAnchor && injectionAnchor.parentElement) {
            const button = createButton(title, year, posterUrl);
            // Insert it after the container of the watch button for better layout
            injectionAnchor.parentElement.insertAdjacentElement('afterend', button);
        }
    }

    // --- Observer to handle dynamic content loading ---
    let _injectTimer = null;
    const observer = new MutationObserver(() => {
        // Debounce so we don't run a querySelector pass on every keystroke / SPA tick.
        if (_injectTimer) return;
        _injectTimer = setTimeout(() => {
            _injectTimer = null;
            injectButtonIfPanelExists();
        }, 200);
    });

    // Start observing the whole document body for changes.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Also run once on initial load, in case the content is already there.
    if (document.readyState === 'complete') {
        injectButtonIfPanelExists();
    } else {
        window.addEventListener('load', injectButtonIfPanelExists);
    }

})();
