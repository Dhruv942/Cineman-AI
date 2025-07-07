export interface StableUserPreferences {
  movieFrequency: string;
  actorDirectorPreference: string;
  preferredLanguages: string[];
  ottPlatforms: string[];
  era: string[]; 
  movieDuration: string[]; 
  preferredNumberOfSeasons: string[]; 
  country: string; // Added for user's country
}

export interface SessionPreferences {
  genres: string[];
  mood: string;
  keywords: string;
  excludedGenres?: string[]; 
}

export interface UserPreferences extends StableUserPreferences, SessionPreferences {}

export interface Movie { 
  id?: string; 
  title: string;
  year: number;
  summary:string;
  genres: string[];
  similarTo?: string;
  tmdbId?: string;
  availabilityNote?: string;
  posterUrl?: string;
  durationMinutes?: number; 
  matchScore?: number; 
}

export interface GeminiMovieRecommendation { 
  title: string;
  year: number;
  summary: string;
  genres: string[];
  similarTo?: string;
  tmdbId?: string;
  availabilityNote?: string;
  posterUrl?: string;
  durationMinutes?: number;
  matchScore?: number;
}

export interface MovieFeedback {
  id: string; 
  title: string;
  year: number;
  feedback: 'Loved it!' | 'Liked it' | 'Not my vibe';
  source?: string; // Optional: e.g., "in-app", "netflix-import"
}

export type ActiveTab = 'recommendations' | 'similarSearch' | 'discovery' | 'watchParty' | 'tasteCheck';

export interface PopularItemEntry { // Renamed from PopularMovieEntry
  title: string;
  year: number;
  posterUrl?: string; 
}

export type CurrentAppView = 'main' | 'onboardingEdit' | 'myAccount' | 'otherSettings';

export interface AppSettings {
  numberOfRecommendations: number;
}

export type RecommendationType = 'movie' | 'series';

export interface ItemTitleSuggestion { // Renamed from MovieTitleSuggestion
  title: string;
  year: number;
}

export interface Country { // Added for country selection
  code: string;
  name: string;
}

// For the raw response from Gemini for the taste check feature
export interface TasteCheckGeminiResponseItem {
  title: string | null;
  year: number | null;
  summary: string | null;
  genres: string[] | null;
  posterUrl?: string | null;
  durationMinutes?: number | null;
  matchScore: number | null; // User's taste match score for this specific item
}

export interface TasteCheckGeminiResponse {
  itemFound: boolean;
  identifiedItem: TasteCheckGeminiResponseItem | null;
  justification: string | null; // Explanation of why the user might like/dislike it
}

// For the structured response from the geminiService.checkTasteMatch function
export interface TasteCheckServiceResponse {
  itemFound: boolean;
  movie: Movie | null; // This will be the identified item, transformed into our Movie type
  justification: string | null;
  error?: string | null;
}
