
import { CINE_SUGGEST_MOVIE_FEEDBACK_KEY } from '../constants';
import type { MovieFeedback } from '../types';

export const saveMovieFeedback = (title: string, year: number, feedbackType: 'Loved it!' | 'Liked it' | 'Not my vibe'): void => {
  const movieFeedbackId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`;
  const newFeedbackItem: MovieFeedback = {
    id: movieFeedbackId,
    title,
    year,
    feedback: feedbackType,
  };

  let allFeedback: MovieFeedback[] = [];
  const storedFeedbackString = localStorage.getItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY);
  if (storedFeedbackString) {
    try {
      allFeedback = JSON.parse(storedFeedbackString);
      if (!Array.isArray(allFeedback)) { // Ensure it's an array
        allFeedback = [];
      }
    } catch (e) {
      console.error("Failed to parse existing movie feedback for saving, resetting.", e);
      allFeedback = [];
    }
  }

  // Remove existing feedback for this movie, if any, then add the new one
  const updatedFeedback = allFeedback.filter(f => f.id !== movieFeedbackId);
  updatedFeedback.push(newFeedbackItem);

  try {
    localStorage.setItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY, JSON.stringify(updatedFeedback));
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
      return []; // Return empty array on error
    }
  }
  return []; // Return empty array if no feedback is stored
};