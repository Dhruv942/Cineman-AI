
declare const chrome: any;
import { CINE_SUGGEST_WATCHLIST_KEY } from '../constants';
import type { Movie } from '../types';

const getWatchlistFromStorage = (): Promise<Movie[]> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([CINE_SUGGEST_WATCHLIST_KEY], (result: any) => {
        resolve(result[CINE_SUGGEST_WATCHLIST_KEY] || []);
      });
    } else {
      const storedList = localStorage.getItem(CINE_SUGGEST_WATCHLIST_KEY);
      resolve(storedList ? JSON.parse(storedList) : []);
    }
  });
};

const saveWatchlistToStorage = (watchlist: Movie[]): Promise<void> => {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ [CINE_SUGGEST_WATCHLIST_KEY]: watchlist }, resolve);
        } else {
            localStorage.setItem(CINE_SUGGEST_WATCHLIST_KEY, JSON.stringify(watchlist));
            resolve();
        }
    });
};

export const getWatchlist = async (): Promise<Movie[]> => {
    return await getWatchlistFromStorage();
};

export const addToWatchlist = async (itemToAdd: Movie): Promise<{ success: boolean; added: boolean; message: string }> => {
    try {
        const currentList = await getWatchlistFromStorage();
        // Ensure the item has an ID before adding
        if (!itemToAdd.id) {
            itemToAdd.id = `${itemToAdd.title.toLowerCase().replace(/[^a-z0-9]/g, '')}${itemToAdd.year}`;
        }
        const itemExists = currentList.some(i => i.id === itemToAdd.id);

        if (!itemExists) {
            const newList = [itemToAdd, ...currentList]; // Add to top
            await saveWatchlistToStorage(newList);
            return { success: true, added: true, message: "Added to Watchlist!" };
        } else {
            return { success: true, added: false, message: "Already in Watchlist." };
        }
    } catch (error: any) {
        console.error("Error adding to watchlist:", error);
        return { success: false, added: false, message: error.message };
    }
};

export const removeFromWatchlist = async (itemId: string): Promise<void> => {
    const currentList = await getWatchlistFromStorage();
    const updatedList = currentList.filter(item => item.id !== itemId);
    await saveWatchlistToStorage(updatedList);
};

export const clearWatchlist = async (): Promise<void> => {
    await saveWatchlistToStorage([]);
};
