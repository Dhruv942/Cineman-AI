declare const chrome: any;
import { CINE_SUGGEST_MOVIE_FEEDBACK_KEY } from '../constants';
import type { MovieFeedback } from '../types';

// Helper to get all feedback from chrome.storage.local
const getAllFeedbackFromStorage = (): Promise<MovieFeedback[]> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([CINE_SUGGEST_MOVIE_FEEDBACK_KEY], (result: any) => {
        const feedback = result[CINE_SUGGEST_MOVIE_FEEDBACK_KEY];
        if (Array.isArray(feedback)) {
          resolve(feedback);
        } else {
          resolve([]);
        }
      });
    } else {
      // Fallback for non-extension environment
      try {
        const storedFeedbackString = localStorage.getItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY);
        if (storedFeedbackString) {
          const feedback = JSON.parse(storedFeedbackString);
          if (Array.isArray(feedback)) {
            resolve(feedback);
            return;
          }
        }
      } catch (e) {
        console.error("Fallback to localStorage failed", e);
      }
      resolve([]);
    }
  });
};

export const saveMovieFeedback = async (
  title: string, 
  year: number, 
  feedbackType: 'Loved it!' | 'Liked it' | 'Not my vibe',
  source: string = 'in-app'
): Promise<void> => {
  const movieFeedbackId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`;
  const newFeedbackItem: MovieFeedback = {
    id: movieFeedbackId,
    title,
    year,
    feedback: feedbackType,
    source,
  };

  const allFeedback = await getAllFeedbackFromStorage();

  const existingIndex = allFeedback.findIndex(f => f.id === movieFeedbackId);
  if (existingIndex > -1) {
    allFeedback[existingIndex] = newFeedbackItem;
  } else {
    allFeedback.push(newFeedbackItem);
  }

  return new Promise((resolve) => {
     if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [CINE_SUGGEST_MOVIE_FEEDBACK_KEY]: allFeedback }, () => {
            resolve();
        });
     } else {
        localStorage.setItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY, JSON.stringify(allFeedback));
        resolve();
     }
  });
};

export const getMovieFeedback = async (title: string, year: number): Promise<MovieFeedback | undefined> => {
  const movieFeedbackId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`;
  const allFeedback = await getAllFeedbackFromStorage();
  return allFeedback.find(f => f.id === movieFeedbackId);
};

export const getAllFeedback = async (): Promise<MovieFeedback[]> => {
  return getAllFeedbackFromStorage();
};

export const importExternalFeedback = async (
  externalFeedbacks: MovieFeedback[]
): Promise<void> => {
  if (externalFeedbacks.length === 0) return;

  const allFeedback = await getAllFeedbackFromStorage();
  const existingIds = new Set(allFeedback.map(f => f.id));

  const newFeedbacks = externalFeedbacks.filter(extFb => !existingIds.has(extFb.id));

  if (newFeedbacks.length > 0) {
    const combinedFeedback = [...allFeedback, ...newFeedbacks];
     return new Promise((resolve) => {
       if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [CINE_SUGGEST_MOVIE_FEEDBACK_KEY]: combinedFeedback }, () => {
              console.log(`Successfully imported ${newFeedbacks.length} new feedback items.`);
              resolve();
          });
       } else {
          localStorage.setItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY, JSON.stringify(combinedFeedback));
          resolve();
       }
    });
  } else {
    console.log("No new feedback items to import.");
    return Promise.resolve();
  }
};