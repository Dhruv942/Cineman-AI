
import { CINE_SUGGEST_MOVIE_FEEDBACK_KEY } from '../constants';
import type { MovieFeedback } from '../types';

export const saveMovieFeedback = (
  title: string, 
  year: number, 
  feedbackType: 'Loved it!' | 'Liked it' | 'Not my vibe',
  source: string = 'in-app' // Default source for feedback given within the app
): void => {
  const movieFeedbackId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`;
  const newFeedbackItem: MovieFeedback = {
    id: movieFeedbackId,
    title,
    year,
    feedback: feedbackType,
    source,
  };

  let allFeedback: MovieFeedback[] = [];
  const storedFeedbackString = localStorage.getItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY);
  if (storedFeedbackString) {
    try {
      allFeedback = JSON.parse(storedFeedbackString);
      if (!Array.isArray(allFeedback)) { 
        allFeedback = [];
      }
    } catch (e) {
      console.error("Failed to parse existing movie feedback for saving, resetting.", e);
      allFeedback = [];
    }
  }

  const existingIndex = allFeedback.findIndex(f => f.id === movieFeedbackId);
  if (existingIndex > -1) {
    allFeedback[existingIndex] = newFeedbackItem; // Overwrite with new feedback
  } else {
    allFeedback.push(newFeedbackItem);
  }
  

  try {
    localStorage.setItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY, JSON.stringify(allFeedback));
  } catch (e) {
    console.error("Failed to save movie feedback to localStorage", e);
  }
};

export const getMovieFeedback = (title: string, year: number): MovieFeedback | undefined => {
  const movieFeedbackId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`;
  const storedFeedbackString = localStorage.getItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY);
  if (storedFeedbackString) {
    try {
      const allFeedback: MovieFeedback[] = JSON.parse(storedFeedbackString);
      if (!Array.isArray(allFeedback)) {
        return undefined;
      }
      return allFeedback.find(f => f.id === movieFeedbackId);
    } catch (e) {
      console.error("Failed to parse movie feedback from localStorage", e);
    }
  }
  return undefined;
};

export const getAllFeedback = (): MovieFeedback[] => {
  const storedFeedbackString = localStorage.getItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY);
  if (storedFeedbackString) {
    try {
      const allFeedback = JSON.parse(storedFeedbackString);
       if (!Array.isArray(allFeedback)) {
        console.warn("Feedback in localStorage was not an array, returning empty.");
        return [];
      }
      return allFeedback as MovieFeedback[];
    } catch (e) {
      console.error("Failed to parse all movie feedback from localStorage, returning empty.", e);
      return []; 
    }
  }
  return []; 
};

// Conceptual function to add feedback from external sources
export const addExternallySourcedFeedback = (
  externalFeedbacks: Array<{ title: string; year: number; feedbackType: 'Loved it!' | 'Liked it' | 'Not my vibe'; source: string }>
): void => {
  if (externalFeedbacks.length === 0) return;

  console.log(`Attempting to add ${externalFeedbacks.length} externally sourced feedback items.`);
  externalFeedbacks.forEach(extFb => {
    // Use the existing saveMovieFeedback function which handles updating/adding correctly.
    // Pass the source from the external feedback item.
    saveMovieFeedback(extFb.title, extFb.year, extFb.feedbackType, extFb.source);
  });
  console.log(`Finished processing ${externalFeedbacks.length} externally sourced feedback items.`);
  // Note: To make this truly effective, you would need content scripts or other mechanisms
  // to gather data from sites like Netflix, Amazon Prime, etc., and then call this function.
  // For example:
  // addExternallySourcedFeedback([
  //   { title: "Some Movie from Netflix", year: 2023, feedbackType: "Loved it!", source: "netflix-history-scraper" },
  //   { title: "Another Show from Prime", year: 2022, feedbackType: "Liked it", source: "prime-ratings-importer" }
  // ]);
};
