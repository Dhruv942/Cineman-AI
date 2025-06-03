
export interface StableUserPreferences {
  movieFrequency: string;
  actorDirectorPreference: string;
  preferredLanguages: string[];
  ottPlatforms: string[];
  era: string[]; // Changed from string to string[]
  movieDuration: string[]; // Changed from string to string[]
}

export interface SessionPreferences {
  genres: string[];
  mood: string;
  keywords: string;
  excludedGenres?: string[]; // Added for excluding genres
}

export interface UserPreferences extends StableUserPreferences, SessionPreferences {}

export interface Movie {
  id?: string; // Optional ID, can be composite like title+year for uniqueness
  title: string;
  year: number;
  summary:string;
  genres: string[];
  similarTo?: string;
  tmdbId?: string;
  availabilityNote?: string;
  posterUrl?: string;
  durationMinutes?: number;
  matchScore?: number; // Added match score
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
  matchScore?: number; // Added match score
}

export interface MovieFeedback {
  id: string; // composite key: title_lowercase_alphanumeric + year
  title: string;
  year: number;
  feedback: 'Loved it!' | 'Liked it' | 'Not my vibe';
}

// For the new Discovery tab
export type ActiveTab = 'recommendations' | 'similarSearch' | 'discovery';

// For POPULAR_MOVIES_FOR_SUGGESTION in constants.ts to allow direct poster URLs
export interface PopularMovieEntry {
  title: string;
  year: number;
  posterUrl?: string; // Full URL to the poster
}

// For managing different application views (main app, onboarding/edit, my account, other settings)
export type CurrentAppView = 'main' | 'onboardingEdit' | 'myAccount' | 'otherSettings';

// For storing app-specific settings like number of recommendations
export interface AppSettings {
  numberOfRecommendations: number;
}