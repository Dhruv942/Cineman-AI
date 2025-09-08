function scrapeMyList() {
    // This selector targets the title within each item card in the "My List" grid.
    const titleNodes = document.querySelectorAll('.galleryLockups .slider-item .fallback-text');
    
    if (titleNodes.length === 0) {
        console.log("CineMan AI scraper: Could not find any 'My List' title elements on this page.");
        return;
    }

    const titles = new Set();
    titleNodes.forEach(node => {
        if (node.textContent) {
            titles.add(node.textContent.trim());
        }
    });

    if (titles.size > 0) {
        console.log(`CineMan AI scraper: Found ${titles.size} titles. Sending to background script.`);
        chrome.runtime.sendMessage({
            action: "storePlatformTitles",
            data: { titles: Array.from(titles), source: 'netflix' }
        });
    }
}

// Netflix uses a lot of dynamic content loading. A simple timeout is a starting point,
// but a MutationObserver would be more robust. For this implementation, a timeout is sufficient.
setTimeout(scrapeMyList, 5000); // Wait 5 seconds for content to hopefully load.