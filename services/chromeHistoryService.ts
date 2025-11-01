declare const chrome: any;

/**
 * Service to store Chrome browsing history for streaming platforms
 * Simple storage - no processing, just save raw history entries
 */

interface HistoryEntry {
  url: string;
  title: string;
  visitTime?: number;
  lastVisitTime?: number;
}

const STREAMING_PLATFORMS = [
  "netflix.com",
  "primevideo.com",
  "hotstar.com",
  "disneyplus.com",
  "hulu.com",
  "hbomax.com",
  "max.com",
  "paramountplus.com",
  "peacocktv.com",
  "crunchyroll.com",
  "mubi.com",
  "youtube.com/watch",
];

const CHROME_HISTORY_SYNC_KEY = "cineSuggestChromeHistorySync_v1";
const LAST_HISTORY_SYNC_KEY = "cineSuggestLastHistorySync_v1";

/**
 * Check if URL is from a streaming platform
 */
const isStreamingPlatform = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return STREAMING_PLATFORMS.some((platform) => hostname.includes(platform));
  } catch (e) {
    return false;
  }
};

/**
 * Store Chrome browsing history for streaming platforms (simple storage, no processing)
 */
export const storeChromeHistory = async (): Promise<void> => {
  if (typeof chrome === "undefined" || !chrome.history) {
    console.log("Chrome history API not available");
    return;
  }

  try {
    // Get last sync time
    const getLastSyncTime = (): Promise<number> => {
      return new Promise((resolve) => {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([LAST_HISTORY_SYNC_KEY], (result: any) => {
            resolve(result[LAST_HISTORY_SYNC_KEY] || 0);
          });
        } else {
          const stored = localStorage.getItem(LAST_HISTORY_SYNC_KEY);
          resolve(stored ? parseInt(stored, 10) : 0);
        }
      });
    };

    // Get stored history
    const getStoredHistory = (): Promise<HistoryEntry[]> => {
      return new Promise((resolve) => {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([CHROME_HISTORY_SYNC_KEY], (result: any) => {
            resolve(result[CHROME_HISTORY_SYNC_KEY] || []);
          });
        } else {
          const stored = localStorage.getItem(CHROME_HISTORY_SYNC_KEY);
          resolve(stored ? JSON.parse(stored) : []);
        }
      });
    };

    // Save history
    const saveHistory = (history: HistoryEntry[]): Promise<void> => {
      return new Promise((resolve) => {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set(
            {
              [CHROME_HISTORY_SYNC_KEY]: history,
              [LAST_HISTORY_SYNC_KEY]: Date.now(),
            },
            () => resolve()
          );
        } else {
          localStorage.setItem(
            CHROME_HISTORY_SYNC_KEY,
            JSON.stringify(history)
          );
          localStorage.setItem(LAST_HISTORY_SYNC_KEY, Date.now().toString());
          resolve();
        }
      });
    };

    const lastSyncTime = await getLastSyncTime();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
    const startTime = Math.max(lastSyncTime, oneDayAgo);

    // Query Chrome history
    const historyItems = await new Promise<any[]>((resolve) => {
      chrome.history.search(
        {
          text: "",
          startTime: startTime,
          maxResults: 10000,
        },
        (results: any[]) => {
          resolve(results || []);
        }
      );
    });

    // Filter for streaming platforms only - simple, no processing
    const streamingHistory: HistoryEntry[] = historyItems
      .filter((item) => item.url && isStreamingPlatform(item.url))
      .map((item) => ({
        url: item.url || "",
        title: item.title || "",
        visitTime: item.visitTime,
        lastVisitTime: item.lastVisitTime,
      }));

    // Get existing stored history
    const existingHistory = await getStoredHistory();
    const existingUrls = new Set(existingHistory.map((h) => h.url));

    // Add only new entries
    const newEntries = streamingHistory.filter(
      (entry) => !existingUrls.has(entry.url)
    );

    if (newEntries.length > 0) {
      const updatedHistory = [...existingHistory, ...newEntries];

      // Keep only last 1000 entries
      const sortedHistory = updatedHistory.sort((a, b) => {
        const timeA = a.lastVisitTime || a.visitTime || 0;
        const timeB = b.lastVisitTime || b.visitTime || 0;
        return timeB - timeA;
      });

      const trimmedHistory = sortedHistory.slice(0, 1000);

      await saveHistory(trimmedHistory);
      console.log(`Stored ${newEntries.length} new Chrome history entries`);
    } else {
      // Update sync time even if no new entries
      await saveHistory(existingHistory);
    }
  } catch (error) {
    console.error("Error storing Chrome history:", error);
  }
};

/**
 * Get stored Chrome history from storage
 */
export const getStoredChromeHistory = async (): Promise<HistoryEntry[]> => {
  return new Promise((resolve) => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get([CHROME_HISTORY_SYNC_KEY], (result: any) => {
        resolve(result[CHROME_HISTORY_SYNC_KEY] || []);
      });
    } else {
      const stored = localStorage.getItem(CHROME_HISTORY_SYNC_KEY);
      resolve(stored ? JSON.parse(stored) : []);
    }
  });
};

/**
 * Clear stored history
 */
export const clearStoredChromeHistory = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.remove(
        [CHROME_HISTORY_SYNC_KEY, LAST_HISTORY_SYNC_KEY],
        () => {
          resolve();
        }
      );
    } else {
      localStorage.removeItem(CHROME_HISTORY_SYNC_KEY);
      localStorage.removeItem(LAST_HISTORY_SYNC_KEY);
      resolve();
    }
  });
};
