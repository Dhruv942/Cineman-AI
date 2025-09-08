function scrapeWatchlist() {
    // This selector targets the title within each card on the Hotstar watchlist page.
    const titleNodes = document.querySelectorAll('article .details .title a, article .details .title h2');
    
    if (titleNodes.length === 0) {
        console.log("CineMan AI scraper: Could not find any Hotstar watchlist title elements.");
        return;
    }

    const titles = new Set();
    titleNodes.forEach(node => {
        if (node.textContent) {
            titles.add(node.textContent.trim());
        }
    });

    if (titles.size > 0) {
        console.log(`CineMan AI scraper: Found ${titles.size} Hotstar titles. Sending to background script.`);
        chrome.runtime.sendMessage({
            action: "storePlatformTitles",
            data: { titles: Array.from(titles), source: 'hotstar' }
        });
    }
}

// Hotstar also loads content dynamically.
setTimeout(scrapeWatchlist, 5000);
