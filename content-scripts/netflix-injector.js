
(() => {
  const CINEMAN_PANEL_ID = 'cineman-ai-panel';
  const CINEMAN_MODAL_ID = 'cineman-ai-modal';
  let currentTitle = null;
  let currentType = 'movie'; // Default, we'll try to detect
  let injectionTimer = null; // Debounce timer for injection
  // Track which modal nodes we've already injected into so rapid hover/click
  // events can't produce duplicate panels.
  const injectedModals = new WeakSet();

  // Selector resolution helper: try several selectors in order, return the
  // first match. Logs (in debug only) which one worked so we can spot when
  // Netflix's DOM changes break a primary selector.
  function findFirst(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function cleanTitle(title) {
    // Remove "Limited Series", season indicators, etc.
    return title.replace(/:\s*Limited Series/i, '')
               .replace(/:\s*Season\s*\d+/i, '')
               .replace(/part\s*\d+/i, '')
               .trim();
  }

  // Selector fallbacks: Netflix renames things ~quarterly. Order = most-stable first.
  const MODAL_DETAILS_SELECTORS = [
    '[data-uia="previewModal--details-container"]',
    '[data-uia*="previewModal"][data-uia*="details"]',
    '.previewModal--detailsMetadata',
    '[role="dialog"] [class*="detailsMetadata"]',
  ];
  const MODAL_CONTAINER_SELECTORS = [
    '[data-uia="previewModal--container"]',
    '[data-uia*="previewModal"][data-uia*="container"]',
    '[class*="previewModal"][class*="container"]',
  ];
  const TITLE_NODE_SELECTORS = [
    '.previewModal--player-title-logo',     // <img alt="Title">
    '[class*="player-title-logo"]',
    '[data-uia*="title-logo"]',
  ];
  const TARGET_BUTTONS_SELECTORS = [
    '.button-layer.button-layer-left',
    '[class*="button-layer-left"]',
    '[class*="ptrack-content"] [class*="buttonControls"]',
  ];

  function detectType() {
    // A simple heuristic: if the word "Seasons" or "Episodes" appears in the metadata, it's a series.
    const modalContent = findFirst(document, MODAL_DETAILS_SELECTORS);
    if (modalContent && (modalContent.innerText.includes('Seasons') || modalContent.innerText.includes('episodes'))) {
      return 'series';
    }
    return 'movie';
  }

  // Static SVG markup is safe (no user input), but we use a parser pass into a
  // <template> element rather than .innerHTML on user-visible nodes. This keeps
  // us future-proof if titles or other dynamic data are ever added here.
  function svgFromString(svgStr) {
    const tpl = document.createElement('template');
    tpl.innerHTML = svgStr.trim();
    return tpl.content.firstChild;
  }

  function makeButton(id, label, svgStr) {
    const b = document.createElement('button');
    b.id = id;
    b.className = 'cineman-button';
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.appendChild(svgFromString(svgStr));
    b.appendChild(document.createTextNode(' ' + label));
    return b;
  }

  const ICON_HEART = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>';
  const ICON_PARTY = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m10.117 0a5.971 5.971 0 0 0-.941-3.197" /></svg>';
  const ICON_SEARCH = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>';
  const ICON_FILM = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4H6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1.1c.42 3.38 1.42 6.55 2.9 9l2-5 2 5c1.48-2.45 2.48-5.62 2.9-9H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 6h10v3H7V6zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>';

  function createCinemanPanel() {
    const panel = document.createElement('div');
    panel.id = CINEMAN_PANEL_ID;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'CineMan AI controls');

    const header = document.createElement('div');
    header.className = 'cineman-header';
    header.appendChild(svgFromString(ICON_FILM));
    const headerSpan = document.createElement('span');
    headerSpan.textContent = 'CineMan AI';
    header.appendChild(headerSpan);

    const actions = document.createElement('div');
    actions.className = 'cineman-actions';
    const tasteBtn = makeButton('cineman-taste-check', 'Taste Check', ICON_HEART);
    const partyBtn = makeButton('cineman-add-party', 'Add to Party', ICON_PARTY);
    const similarBtn = makeButton('cineman-find-similar', 'Find Similar', ICON_SEARCH);
    actions.append(tasteBtn, partyBtn, similarBtn);

    panel.append(header, actions);

    tasteBtn.addEventListener('click', handleTasteCheck);
    partyBtn.addEventListener('click', handleAddParty);
    similarBtn.addEventListener('click', handleFindSimilar);

    return panel;
  }

  // showModal accepts an HTMLElement (preferred — built via createElement)
  // or — for backwards compatibility — a function that returns one.
  function showModal(contentNode) {
    let modal = document.getElementById(CINEMAN_MODAL_ID);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = CINEMAN_MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const backdrop = document.createElement('div');
    backdrop.className = 'cineman-modal-backdrop';
    backdrop.addEventListener('click', () => modal.remove());

    const content = document.createElement('div');
    content.className = 'cineman-modal-content';
    if (contentNode instanceof Node) content.appendChild(contentNode);

    modal.append(backdrop, content);
    document.body.appendChild(modal);

    // Close button gets wired up if present in supplied content
    const closeButton = modal.querySelector('.cineman-modal-close-button');
    if (closeButton) closeButton.addEventListener('click', () => modal.remove());
  }

  function createResultModalContent(result) {
    if (result.error || !result.itemFound) {
      const wrap = document.createElement('div');
      wrap.className = 'cineman-modal-error';
      const h = document.createElement('h3');
      h.textContent = 'Analysis Failed';
      const p = document.createElement('p');
      p.textContent = result.error || result.justification || 'An unknown error occurred.';
      wrap.append(h, p);
      return wrap;
    }

    const { identifiedItem, justification } = result;
    const score = identifiedItem.matchScore;
    const scoreClass = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

    const frag = document.createDocumentFragment();

    const closeBtn = document.createElement('button');
    closeBtn.className = 'cineman-modal-close-button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×'; // ×
    frag.appendChild(closeBtn);

    const header = document.createElement('div');
    header.className = 'cineman-modal-header';

    const poster = document.createElement('img');
    poster.className = 'cineman-modal-poster';
    poster.alt = 'Poster';
    if (identifiedItem.posterUrl) poster.src = identifiedItem.posterUrl;
    poster.addEventListener('error', () => { poster.style.display = 'none'; });
    header.appendChild(poster);

    const titleArea = document.createElement('div');
    titleArea.className = 'cineman-modal-title-area';
    const title = document.createElement('h3');
    title.textContent = `${identifiedItem.title} (${identifiedItem.year})`;
    titleArea.appendChild(title);
    const scoreBox = document.createElement('div');
    scoreBox.className = `cineman-modal-score ${scoreClass}`;
    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${score}/100`;
    const scoreLabel = document.createElement('small');
    scoreLabel.append(document.createTextNode('Taste'), document.createElement('br'), document.createTextNode('Match'));
    scoreBox.append(scoreSpan, scoreLabel);
    titleArea.appendChild(scoreBox);
    header.appendChild(titleArea);

    const body = document.createElement('div');
    body.className = 'cineman-modal-body';
    const bodyH = document.createElement('h4');
    bodyH.textContent = 'AI Justification';
    const bodyP = document.createElement('p');
    bodyP.textContent = justification || '';
    body.append(bodyH, bodyP);

    frag.append(header, body);
    return frag;
  }

  async function handleTasteCheck(event) {
    if (!currentTitle) return;
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    button.innerHTML = '<div class="cineman-spinner"></div>';
    button.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: "tasteCheck",
        data: { title: currentTitle, type: currentType }
      });
      showModal(createResultModalContent(response));
    } catch (e) {
      console.error("CineMan AI: Error during taste check", e);
      showModal(createResultModalContent({ error: 'Failed to communicate with the extension.' }));
    } finally {
      button.innerHTML = originalContent;
      button.disabled = false;
    }
  }

  async function handleAddParty(event) {
     if (!currentTitle) return;
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    button.innerHTML = '<div class="cineman-spinner"></div>';
    button.disabled = true;

    const modal = document.querySelector('[data-uia="previewModal--details-container"]');
    const yearMatch = modal ? modal.querySelector('.year') : null;
    const year = yearMatch ? parseInt(yearMatch.innerText, 10) : new Date().getFullYear();
    const poster = modal ? modal.querySelector('.previewModal--boxart') : null;
    const summary = modal ? modal.querySelector('.preview-modal-synopsis--text') : null;

    const item = {
        id: `${currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`,
        title: currentTitle,
        year: year,
        posterUrl: poster ? poster.src : '',
        summary: summary ? summary.innerText : 'No summary available.',
        genres: [currentType === 'series' ? 'Series' : 'Movie']
    };

    try {
        const response = await chrome.runtime.sendMessage({ action: "addToWatchParty", data: { item } });
        if (response.success) {
            button.innerHTML = 'Added!';
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error(response.error);
        }
    } catch (e) {
        console.error("CineMan AI: Error adding to watch party", e);
        button.innerHTML = 'Error';
         setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
        }, 2000);
    }
  }

  function handleFindSimilar() {
    if (!currentTitle) return;
    chrome.runtime.sendMessage({
      action: "openPopup",
      data: { title: currentTitle, type: currentType }
    });
  }

  function injectPanel() {
    // Only inject into the full detail modal, not the mini hover preview.
    const modalContainer = findFirst(document, MODAL_CONTAINER_SELECTORS);
    if (!modalContainer) return;

    // Already injected for this exact modal node? Skip — that's the duplicate-panel race.
    if (injectedModals.has(modalContainer)) {
      // Still ensure the panel is present (Netflix sometimes re-renders inner DOM)
      if (modalContainer.querySelector(`#${CINEMAN_PANEL_ID}`)) return;
    }

    // Remove any stale panel from previous modals
    const existingPanel = document.getElementById(CINEMAN_PANEL_ID);
    if (existingPanel) existingPanel.remove();

    // Skip mini/hover previews — they are small and lack the full detail view
    const isFullModal = modalContainer.querySelector('.previewModal--detailsMetadata-left') ||
                        modalContainer.querySelector('[data-uia="previewModal--section-header"]') ||
                        modalContainer.querySelector('[class*="detailsMetadata"]') ||
                        modalContainer.offsetWidth > 500;
    if (!isFullModal) return;

    const titleNode = findFirst(modalContainer, TITLE_NODE_SELECTORS);
    if (!titleNode || !titleNode.alt) return;

    currentTitle = cleanTitle(titleNode.alt);
    currentType = detectType();

    const targetNode = findFirst(modalContainer, TARGET_BUTTONS_SELECTORS);
    if (!targetNode) return;

    const cinemanPanel = createCinemanPanel();
    targetNode.insertAdjacentElement('afterend', cinemanPanel);
    injectedModals.add(modalContainer);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length === 0) continue;
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const looksLikeModal = MODAL_DETAILS_SELECTORS.some(sel =>
          (node.matches && node.matches(sel)) || (node.querySelector && node.querySelector(sel))
        );
        if (!looksLikeModal) continue;
        // Debounce: clear any pending injection and schedule a new one.
        // This prevents duplicate injections when multiple mutations fire rapidly.
        if (injectionTimer) clearTimeout(injectionTimer);
        injectionTimer = setTimeout(() => {
          injectionTimer = null;
          injectPanel();
        }, 500);
        return;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
