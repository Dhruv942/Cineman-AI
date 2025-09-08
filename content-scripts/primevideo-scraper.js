function scrapeWatchlist() {
    // This selector targets the title links within the Prime Video watchlist grid.
    const titleNodes = document.querySelectorAll('div[data-automation-id="watchlist-grid"] a.av-heading-small');
    
    if (titleNodes.length === 0) {
        console.log("CineMan AI scraper: Could not find any Prime Video watchlist title elements.");
        return;
    }

    const titles = new Set();
    titleNodes.forEach(node => {
        if (node.textContent) {
            titles.add(node.textContent.trim());
        }
    });

    if (titles.size > 0) {
        console.log(`CineMan AI scraper: Found ${titles.size} Prime Video titles. Sending to background script.`);
        chrome.runtime.sendMessage({
            action: "storePlatformTitles",
            data: { titles: Array.from(titles), source: 'prime-video' }
        });
    }
}

// Prime Video uses a lot of dynamic content loading.
// We'll wait a few seconds for the page to hopefully render the list.
setTimeout(scrapeWatchlist, 5000);
