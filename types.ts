import { en } from "./translations/en";

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
  bingeWatchedSeries?: string[];
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
  justification?: string;
  youtubeTrailerId?: string;
  socialProofTag?: string;
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
  justification?: string;
  youtubeTrailerId?: string;
  socialProofTag?: string;
}

export interface ItemTitleSuggestion {
    title: string;
    year: number;
}

export interface TasteCheckGeminiResponseItem {
  title: string;
  year: number;
  summary: string;
  genres: string[];
  posterUrl?: string;
  matchScore: number;
}

export interface TasteCheckGeminiResponse {
  itemFound: boolean;
  identifiedItem: TasteCheckGeminiResponseItem | null;
  justification: string;
  error?: string;
}

export interface TasteCheckServiceResponse {
    movie: Movie | null;
    justification: string | null;
    itemFound: boolean;
    error?: string;
}


export interface AppSettings {
    numberOfRecommendations: number;
    numberOfSimilarItems: number;
    language?: string;
}

export interface MovieFeedback {
    id: string; // e.g., 'thematrix1999'
    title: string;
    year: number;
    feedback: 'Loved it!' | 'Liked it' | 'Not my vibe';
    source?: string; // e.g., 'in-app', 'netflix-import'
}

export type ActiveTab = 'recommendations' | 'similarSearch' | 'tasteCheck' | 'discovery' | 'watchlist';
export type RecommendationType = 'movie' | 'series';

export interface PopularItemEntry {
  title: string;
  year: number;
  posterUrl: string;
}

export interface GrowthPromptState {
    lastPromptSession: number;
    hasRated: boolean;
    hasShared: boolean;
}

export interface Country {
    code: string;
    name: string;
}

export interface Language {
    code: string;
    name: string;
}

export type Translations = typeof en;