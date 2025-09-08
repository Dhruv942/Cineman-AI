
(() => {
  const CINEMAN_PANEL_ID = 'cineman-ai-panel';
  const CINEMAN_MODAL_ID = 'cineman-ai-modal';
  let currentTitle = null;
  let currentType = 'movie'; // Default, we'll try to detect

  function cleanTitle(title) {
    // Remove "Limited Series", season indicators, etc.
    return title.replace(/:\s*Limited Series/i, '')
               .replace(/:\s*Season\s*\d+/i, '')
               .replace(/part\s*\d+/i, '')
               .trim();
  }

  function detectType() {
    // A simple heuristic: if the word "Seasons" or "Episodes" appears in the metadata, it's a series.
    const modalContent = document.querySelector('[data-uia="previewModal--details-container"]');
    if (modalContent && (modalContent.innerText.includes('Seasons') || modalContent.innerText.includes('episodes'))) {
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
        <button id="cineman-add-party" class="cineman-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m10.117 0a5.971 5.971 0 0 0-.941-3.197M12 12.75a2.25 2.25 0 0 0-2.25 2.25a2.25 2.25 0 0 0 2.25 2.25a2.25 2.25 0 0 0 2.25-2.25a2.25 2.25 0 0 0-2.25-2.25M12 12.75V11.25m0 1.5V14.25m0-1.5H10.5m1.5 0H13.5m-3-3.75h.643c.621 0 1.223.256 1.657.7l.657.657a.75.75 0 0 1 0 1.06l-.657.657a2.528 2.528 0 0 1-1.657.7H10.5m3-3.75h-.643c-.621 0-1.223.256-1.657.7l-.657.657a.75.75 0 0 0 0 1.06l.657.657a2.528 2.528 0 0 0 1.657.7H13.5" /></svg>
          Add to Party
        </button>
        <button id="cineman-find-similar" class="cineman-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          Find Similar
        </button>
      </div>
    `;

    panel.querySelector('#cineman-taste-check').addEventListener('click', handleTasteCheck);
    panel.querySelector('#cineman-add-party').addEventListener('click', handleAddParty);
    panel.querySelector('#cineman-find-similar').addEventListener('click', handleFindSimilar);

    return panel;
  }

  function showModal(content) {
    let modal = document.getElementById(CINEMAN_MODAL_ID);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = CINEMAN_MODAL_ID;
    modal.innerHTML = `
      <div class="cineman-modal-backdrop"></div>
      <div class="cineman-modal-content">
        ${content}
      </div>
    `;

    modal.querySelector('.cineman-modal-backdrop').addEventListener('click', () => modal.remove());
    const closeButton = modal.querySelector('.cineman-modal-close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => modal.remove());
    }
    
    document.body.appendChild(modal);
  }

  function createResultModalContent(result) {
    if (result.error || !result.itemFound) {
      return `
        <div class="cineman-modal-error">
          <h3>Analysis Failed</h3>
          <p>${result.error || result.justification || 'An unknown error occurred.'}</p>
        </div>
      `;
    }

    const { identifiedItem, justification } = result;
    const score = identifiedItem.matchScore;
    const scoreClass = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

    return `
      <button class="cineman-modal-close-button">&times;</button>
      <div class="cineman-modal-header">
        <img src="${identifiedItem.posterUrl || ''}" alt="Poster" class="cineman-modal-poster" onerror="this.style.display='none'">
        <div class="cineman-modal-title-area">
          <h3>${identifiedItem.title} (${identifiedItem.year})</h3>
          <div class="cineman-modal-score ${scoreClass}">
            <span>${score}/100</span>
            <small>Taste<br>Match</small>
          </div>
        </div>
      </div>
      <div class="cineman-modal-body">
        <h4>AI Justification</h4>
        <p>${justification}</p>
      </div>
    `;
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
    const existingPanel = document.getElementById(CINEMAN_PANEL_ID);
    if (existingPanel) {
      existingPanel.remove();
    }
    
    const titleNode = document.querySelector('.previewModal--player-title-logo');
    if (!titleNode) {
        console.log("CineMan AI: Title node not found.");
        return;
    }

    currentTitle = cleanTitle(titleNode.alt);
    currentType = detectType();

    const targetNode = document.querySelector('.button-layer.button-layer-left');
    if (targetNode) {
      const cinemanPanel = createCinemanPanel();
      targetNode.insertAdjacentElement('afterend', cinemanPanel);
    } else {
        console.log("CineMan AI: Target node for injection not found.");
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const modal = node.querySelector('[data-uia="previewModal--details-container"]') || node.matches('[data-uia="previewModal--details-container"]');
            if (modal) {
              // Use a short timeout to ensure all modal content is rendered
              setTimeout(injectPanel, 500);
              return; // Found the modal, no need to observe further for now
            }
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
