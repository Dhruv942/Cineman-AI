
(() => {
  const CINEMAN_PANEL_ID = 'cineman-ai-panel';
  const CINEMAN_MODAL_ID = 'cineman-ai-modal';
  let currentTitle = null;
  let currentType = 'movie'; // Default, we'll try to detect

  function cleanTitle(title) {
    return title.trim();
  }

  function detectType(container) {
    const metadata = container.querySelector('div[data-automation-id="meta-info"]');
    if (metadata && (metadata.innerText.toLowerCase().includes('season') || metadata.innerText.toLowerCase().includes('episodes'))) {
      return 'series';
    }
    return 'movie';
  }

  function createCinemanPanel() {
    const panel = document.createElement('div');
    panel.id = CINEMAN_PANEL_ID;
    panel.innerHTML = `
      <div class="cineman-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4H6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1.1c.42 3.38 1.42 6.55 2.9 9l2-5 2 5c1.48-2.45 2.48-5.62 2.9-9H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 6h10v3H7V6zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>
        <span>CineMan AI</span>
      </div>
      <div class="cineman-actions">
        <button id="cineman-taste-check" class="cineman-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
          Taste Check
        </button>
        <button id="cineman-add-watchlist" class="cineman-button">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
          Add to Watchlist
        </button>
        <button id="cineman-find-similar" class="cineman-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          Find Similar
        </button>
      </div>
    `;

    panel.querySelector('#cineman-taste-check').addEventListener('click', handleTasteCheck);
    panel.querySelector('#cineman-add-watchlist').addEventListener('click', handleAddToWatchlist);
    panel.querySelector('#cineman-find-similar').addEventListener('click', handleFindSimilar);

    return panel;
  }

  function showModal(content) {
    let modal = document.getElementById(CINEMAN_MODAL_ID);
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = CINEMAN_MODAL_ID;
    modal.innerHTML = `<div class="cineman-modal-backdrop"></div><div class="cineman-modal-content">${content}</div>`;
    modal.querySelector('.cineman-modal-backdrop').addEventListener('click', () => modal.remove());
    const closeButton = modal.querySelector('.cineman-modal-close-button');
    if (closeButton) closeButton.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  }

  function createResultModalContent(result) {
    if (result.error || !result.itemFound) {
      return `<div class="cineman-modal-error"><h3>Analysis Failed</h3><p>${result.error || result.justification || 'An unknown error occurred.'}</p></div>`;
    }
    const { identifiedItem, justification } = result;
    const score = identifiedItem.matchScore;
    const scoreClass = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    return `
      <button class="cineman-modal-close-button">&times;</button>
      <div class="cineman-modal-header"><img src="${identifiedItem.posterUrl || ''}" alt="Poster" class="cineman-modal-poster" onerror="this.style.display='none'"><div class="cineman-modal-title-area"><h3>${identifiedItem.title} (${identifiedItem.year})</h3><div class="cineman-modal-score ${scoreClass}"><span>${score}/100</span><small>Taste<br>Match</small></div></div></div>
      <div class="cineman-modal-body"><h4>AI Justification</h4><p>${justification}</p></div>`;
  }

  async function handleTasteCheck(event) {
    if (!currentTitle) return;
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    button.innerHTML = '<div class="cineman-spinner"></div>';
    button.disabled = true;
    try {
      const response = await chrome.runtime.sendMessage({ action: "tasteCheck", data: { title: currentTitle, type: currentType } });
      showModal(createResultModalContent(response));
    } catch (e) {
      console.error("CineMan AI: Error during taste check", e);
      showModal(createResultModalContent({ error: 'Failed to communicate with the extension.' }));
    } finally {
      button.innerHTML = originalContent;
      button.disabled = false;
    }
  }

  async function handleAddToWatchlist(event) {
    if (!currentTitle) return;
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    button.innerHTML = '<div class="cineman-spinner"></div>';
    button.disabled = true;

    const container = document.querySelector('div[data-automation-id="dv-dp-container"]');
    const yearEl = container ? container.querySelector('span[data-automation-id="release-year-badge"]') : null;
    const year = yearEl ? parseInt(yearEl.innerText, 10) : new Date().getFullYear();
    const posterEl = container ? container.querySelector('img[data-automation-id="image-container"]') : null;
    const summaryEl = container ? container.querySelector('div[data-automation-id="synopsis-text"]') : null;
    
    const item = {
        id: `${currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`,
        title: currentTitle, year,
        posterUrl: posterEl ? posterEl.src : '',
        summary: summaryEl ? summaryEl.innerText : 'No summary available.',
        genres: [currentType === 'series' ? 'Series' : 'Movie']
    };

    try {
        const response = await chrome.runtime.sendMessage({ action: "addToWatchlist", data: { item } });
        if (response.success) {
            button.innerHTML = response.added ? 'Added!' : 'In List';
            setTimeout(() => { button.innerHTML = originalContent; button.disabled = false; }, 2000);
        } else { throw new Error(response.error); }
    } catch (e) {
        console.error("CineMan AI: Error adding to watchlist", e);
        button.innerHTML = 'Error';
        setTimeout(() => { button.innerHTML = originalContent; button.disabled = false; }, 2000);
    }
  }

  function handleFindSimilar() {
    if (!currentTitle) return;
    chrome.runtime.sendMessage({ action: "openPopup", data: { title: currentTitle, type: currentType } });
  }

  function injectPanel() {
    const container = document.querySelector('div[data-automation-id="dv-dp-container"]');
    if (!container || document.getElementById(CINEMAN_PANEL_ID)) return;
    
    const titleNode = container.querySelector('h1[data-automation-id="title"]');
    if (!titleNode) {
      console.log("CineMan AI: Prime Video title node not found.");
      return;
    }
    
    currentTitle = cleanTitle(titleNode.textContent);
    currentType = detectType(container);

    const targetNode = container.querySelector('div[data-automation-id="dv-action-box"]');
    if (targetNode) {
      const cinemanPanel = createCinemanPanel();
      targetNode.insertAdjacentElement('afterend', cinemanPanel);
      console.log(`CineMan AI: Injected panel for "${currentTitle}" on Prime Video.`);
    } else {
      console.log("CineMan AI: Prime Video target node for injection not found.");
    }
  }

  const observer = new MutationObserver(() => {
    // Prime Video's detail page container has this specific automation ID.
    if (document.querySelector('div[data-automation-id="dv-dp-container"]')) {
      injectPanel();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
