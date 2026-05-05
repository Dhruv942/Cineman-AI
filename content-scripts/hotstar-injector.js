
(() => {
  const CINEMAN_PANEL_ID = 'cineman-ai-panel';
  const CINEMAN_MODAL_ID = 'cineman-ai-modal';
  let currentTitle = null;
  let currentType = 'movie';
  const injectedContainers = new WeakSet();

  const CONTAINER_SELECTORS = [
    '.content-container',
    '[class*="content-container"]',
    '[class*="DetailPage"]',
    'main [class*="detail"]',
  ];
  const TITLE_SELECTORS = [
    'h1.content-title',
    '.detail-page-title',
    'h1[class*="title"]',
    'h1',
  ];
  const TARGET_SELECTORS = [
    '.action-buttons-container',
    '.cta-container',
    '[class*="cta-container"]',
    '[class*="action-buttons"]',
  ];
  const META_SELECTORS = ['.meta-item', '[class*="meta-item"]'];
  const POSTER_SELECTORS = ['.thumbnail-img', '[class*="thumbnail-img"]', '[class*="poster"] img'];
  const SUMMARY_SELECTORS = ['.description', '[class*="description"]'];

  function findFirst(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function findAll(root, selectors) {
    for (const sel of selectors) {
      const list = root.querySelectorAll(sel);
      if (list && list.length) return list;
    }
    return [];
  }

  function svgFromString(svgStr) {
    const tpl = document.createElement('template');
    tpl.innerHTML = svgStr.trim();
    return tpl.content.firstChild;
  }

  const ICON_FILM = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4H6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1.1c.42 3.38 1.42 6.55 2.9 9l2-5 2 5c1.48-2.45 2.48-5.62 2.9-9H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 6h10v3H7V6zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>';
  const ICON_HEART = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>';
  const ICON_BOOKMARK = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>';
  const ICON_SEARCH = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>';

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

  function cleanTitle(title) { return (title || '').trim(); }

  function detectType() {
    if (window.location.pathname.includes('/tv/')) return 'series';
    return 'movie';
  }

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
    const wlBtn = makeButton('cineman-add-watchlist', 'Add to Watchlist', ICON_BOOKMARK);
    const similarBtn = makeButton('cineman-find-similar', 'Find Similar', ICON_SEARCH);
    actions.append(tasteBtn, wlBtn, similarBtn);

    panel.append(header, actions);

    tasteBtn.addEventListener('click', handleTasteCheck);
    wlBtn.addEventListener('click', handleAddToWatchlist);
    similarBtn.addEventListener('click', handleFindSimilar);

    return panel;
  }

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
    const closeBtn = modal.querySelector('.cineman-modal-close-button');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
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
    closeBtn.textContent = '×';
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
    const scoreBox = document.createElement('div');
    scoreBox.className = `cineman-modal-score ${scoreClass}`;
    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${score}/100`;
    const scoreLabel = document.createElement('small');
    scoreLabel.append(document.createTextNode('Taste'), document.createElement('br'), document.createTextNode('Match'));
    scoreBox.append(scoreSpan, scoreLabel);
    titleArea.append(title, scoreBox);
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

  function setButtonText(button, text) {
    while (button.firstChild) button.removeChild(button.firstChild);
    button.appendChild(document.createTextNode(text));
  }

  function withSpinner(button, fn) {
    const savedChildren = Array.from(button.childNodes);
    while (button.firstChild) button.removeChild(button.firstChild);
    const sp = document.createElement('div');
    sp.className = 'cineman-spinner';
    button.appendChild(sp);
    button.disabled = true;
    return Promise.resolve()
      .then(fn)
      .finally(() => {
        if (button.firstChild === sp) {
          while (button.firstChild) button.removeChild(button.firstChild);
          for (const n of savedChildren) button.appendChild(n);
        }
        button.disabled = false;
      });
  }

  async function handleTasteCheck(event) {
    if (!currentTitle) return;
    const button = event.currentTarget;
    await withSpinner(button, async () => {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'tasteCheck', data: { title: currentTitle, type: currentType } });
        showModal(createResultModalContent(response || { error: 'No response' }));
      } catch (e) {
        showModal(createResultModalContent({ error: 'Failed to communicate with the extension.' }));
      }
    });
  }

  async function handleAddToWatchlist(event) {
    if (!currentTitle) return;
    const button = event.currentTarget;

    const metaItems = findAll(document, META_SELECTORS);
    let year = new Date().getFullYear();
    if (metaItems.length > 0) {
      const yearMatch = metaItems[0].textContent.match(/\b(19[89]\d|20\d\d)\b/);
      if (yearMatch) year = parseInt(yearMatch[0], 10);
    }
    const posterEl = findFirst(document, POSTER_SELECTORS);
    const summaryEl = findFirst(document, SUMMARY_SELECTORS);

    const item = {
      id: `${currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`,
      title: currentTitle, year,
      posterUrl: posterEl ? posterEl.src : '',
      summary: summaryEl ? summaryEl.innerText : 'No summary available.',
      genres: [currentType === 'series' ? 'Series' : 'Movie']
    };

    await withSpinner(button, async () => {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'addToWatchlist', data: { item } });
        if (response && response.success) {
          setButtonText(button, response.added ? 'Added!' : 'In List');
          setTimeout(() => setButtonText(button, 'Add to Watchlist'), 2000);
        } else {
          throw new Error(response && response.error || 'Unknown');
        }
      } catch (e) {
        setButtonText(button, 'Error');
        setTimeout(() => setButtonText(button, 'Add to Watchlist'), 2000);
      }
    });
  }

  function handleFindSimilar() {
    if (!currentTitle) return;
    chrome.runtime.sendMessage({ action: 'openPopup', data: { title: currentTitle, type: currentType } });
  }

  function injectPanel() {
    const detailContainer = findFirst(document, CONTAINER_SELECTORS);
    if (!detailContainer) return;
    if (injectedContainers.has(detailContainer) && detailContainer.querySelector(`#${CINEMAN_PANEL_ID}`)) return;

    const titleNode = findFirst(detailContainer, TITLE_SELECTORS);
    if (!titleNode) return;
    currentTitle = cleanTitle(titleNode.textContent);
    currentType = detectType();

    const targetNode = findFirst(detailContainer, TARGET_SELECTORS);
    if (!targetNode) return;

    const stale = document.getElementById(CINEMAN_PANEL_ID);
    if (stale) stale.remove();

    const cinemanPanel = createCinemanPanel();
    targetNode.insertAdjacentElement('afterend', cinemanPanel);
    injectedContainers.add(detailContainer);
  }

  let _injectTimer = null;
  const observer = new MutationObserver(() => {
    if (_injectTimer) return;
    _injectTimer = setTimeout(() => {
      _injectTimer = null;
      injectPanel();
    }, 250);
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
