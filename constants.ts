
import type { PopularMovieEntry } from './types';

export const MOVIE_GENRES: string[] = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "History",
  "Horror", "Music", "Mystery", "Romance", "Sci-Fi",
  "Sport", "Superhero", "Thriller", "War", "Western", "Musical"
];

export const MOVIE_ERAS: string[] = [
  "Any", "2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "Classics (pre-1970s)"
];

export const MOVIE_FREQUENCIES: string[] = [
  "Daily", "A few times a week", "Once a week", "A few times a month", "Rarely"
];

export const ACTOR_DIRECTOR_PREFERENCES: string[] = [
  "No Preference", "Yes, prefer known actors", "Yes, prefer known directors", "Yes, both"
];

export const OTT_PLATFORMS: string[] = [
  "Netflix", "Amazon Prime Video", "Disney+", "HBO Max (Max)", "Hulu",
  "Apple TV+", "Paramount+", "Peacock", "Crunchyroll", "MUBI", "Other"
];

export const MOVIE_LANGUAGES: { code: string; name: string }[] = [
  { code: "any", name: "Any Language" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "pt", name: "Portuguese (Português)" },
];

export const MOVIE_DURATIONS: string[] = [
  "Any",
  "Short (Under 90 min)",
  "Medium (90-120 min)",
  "Long (Over 120 min)"
];

export const ICONS = {
  // Genres
  action: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>`,
  comedy: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>`,
  romance: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>`,
  scifi: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.58 0a6 6 0 0 1-7.38 5.84m7.38-5.84a6 6 0 0 0 5.84-7.38m0 5.84a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.58 0a6 6 0 0 1-7.38 5.84m7.38-5.84a6 6 0 0 0 5.84-7.38" /></svg>`,
  thriller: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>`,
  horror: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>`,
  crime: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75 4.5 19.5M14.25 9.75l8.25 8.25M14.25 9.75V3M14.25 3H12M14.25 3h2.25m-2.25 0V.75M14.25 3V.75m0 0H12m2.25 0h2.25M3 15.75V21h5.25L21 8.25 15.75 3 3 15.75Z" /></svg>`,
  family: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h3m-6.75 3h9.75m-1.5 3h3m-3.75 3h6.75m-11.021-6.75a4.5 4.5 0 0 0-1.263 8.791 4.5 4.5 0 0 0 7.536-2.235M10.5 18.75a4.5 4.5 0 0 1-8.48-2.64A4.5 4.5 0 0 1 5.609 9M15.75 12a3 3 0 0 1-5.233 2.089M15.75 12a3 3 0 0 0-5.233-2.089m5.233 4.178a3 3 0 0 1-2.615-5.233M15.75 12a3 3 0 0 0-2.615 5.233m0 0a3 3 0 0 1-2.615-5.233" /></svg>`,
  music: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9c0 1.105-1.343 2.006-3 2.006S3 10.105 3 9s1.343-2.006 3-2.006S9 7.895 9 9Zm4.502 8.996A4.502 4.502 0 0 0 18 13.5V9A4.498 4.498 0 0 0 13.502 4.504M13.5 9H18V4.5" /></svg>`,
  default_genre: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>`,

  // OTT Platforms
  netflix: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3.75V3.75m3.75 0v16.5M5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>`,
  amazon_prime_video: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`,
  disney_plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.31h5.418a.562.562 0 0 1 .321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.652 0l-4.725 2.885a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988H8.88a.563.563 0 0 0 .475-.31L11.48 3.5Z" /></svg>`,
  hbo_max_max: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" /></svg>`,
  hulu: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 3.125L18 12M3.27 3.125A59.769 59.769 0 0 0 21.485 3.125m0 0A59.768 59.768 0 0 1 12 21.75c-2.676 0-5.216-.584-7.49-1.608m14.98-17.015A59.77 59.77 0 0 0 12 2.25c-2.676 0-5.216.584-7.49 1.608m14.98 17.015c1.206.668 2.368 1.399 3.439 2.185m-3.439-2.185c-.563.329-1.151.631-1.758.903M14.25 12l-2.25 2.25-2.25-2.25M12 16.5V12" /></svg>`,
  apple_tv_plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>`,
  paramount_plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>`,
  peacock: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`,
  crunchyroll: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5V18M15 7.5V18M3 16.811V8.69c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811Z" /></svg>`,
  mubi: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM16.5 18.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM16.5 6.75v1.5m0 7.5v1.5m0-4.5v1.5m-9-1.5v1.5m0-4.5v1.5m0 7.5v1.5M9 6.75v1.5M9 15v1.5" /></svg>`,
  other: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>`,
  default_ott: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>`,

  // Icons for MovieCard details
  similar_to: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>`,
  availability: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3.75V3.75m3.75 0v16.5M5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>`,

  // Icons for PreferenceForm/Onboarding Questions
  question_genre: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>`,
  question_mood: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9.75c.414 0 .75.336.75.75s-.336.75-.75.75S8.25 10.914 8.25 10.5s.336-.75.75-.75Zm6 0c.414 0 .75.336.75.75s-.336.75-.75.75S14.25 10.914 14.25 10.5s.336-.75.75-.75Z" /></svg>`,
  question_frequency: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-3.75h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>`,
  question_actor_director: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>`,
  question_ott: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3.75V3.75m3.75 0v16.5M5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>`,
  question_language: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-5.834A8.959 8.959 0 0 0 3 12c0 .778-.099 1.533.284 2.253m0 0A11.978 11.978 0 0 0 12 16.5c2.998 0 5.74 1.1 7.843 2.918" /></svg>`,
  question_era: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
  question_duration: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
  question_keywords: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`,
  go_cta: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-150"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>`,

  // Tab icons (ensure mr-1.5 is handled by TabButton component, not here)
  recommendations_tab_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>`,
  similar_search_tab_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>`,
  discovery_tab_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`,
  
  // Discovery Card icons
  skip_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>`, // This will be replaced by havent_watched_icon in DiscoveryCard logic, but kept for other potential uses
  havent_watched_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L6.228 6.228" /></svg>`,
  watched_it_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`,
  settings_icon_dropdown: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>`, // Generic dropdown arrow
};

export const CINE_SUGGEST_MOVIE_FEEDBACK_KEY = 'cineSuggestMovieFeedback';
export const CINE_SUGGEST_ONBOARDING_COMPLETE_KEY = 'cineSuggestOnboardingComplete';
export const CINE_SUGGEST_STABLE_PREFERENCES_KEY = 'cineSuggestStablePreferences';
export const CINE_SUGGEST_APP_SETTINGS_KEY = 'cineSuggestAppSettings';


export const POPULAR_MOVIES_FOR_SUGGESTION: PopularMovieEntry[] = [
  // Popular Hits (existing)
  { title: "Inception", year: 2010, posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" },
  { title: "The Shawshank Redemption", year: 1994, posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" },
  { title: "The Dark Knight", year: 2008, posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { title: "Pulp Fiction", year: 1994, posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8KpgysHz.jpg" },
  { title: "Forrest Gump", year: 1994, posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" },
  { title: "The Godfather", year: 1972, posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
  { title: "Fight Club", year: 1999, posterUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
  { title: "Interstellar", year: 2014, posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { title: "Parasite", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
  { title: "Spirited Away", year: 2001, posterUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
  { title: "The Matrix", year: 1999, posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg" },
  { title: "Goodfellas", year: 1990, posterUrl: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg" },
  { title: "The Lord of the Rings: The Return of the King", year: 2003, posterUrl: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg" },
  { title: "Gladiator", year: 2000, posterUrl: "https://image.tmdb.org/t/p/w500/ty8TGRua2pFCR9RF25xW5HPU9ES.jpg" },
  { title: "Mad Max: Fury Road", year: 2015, posterUrl: "https://image.tmdb.org/t/p/w500/8tZYtuWezp855EKsp5hRivtM0F.jpg" },
  { title: "Blade Runner 2049", year: 2017, posterUrl: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlPgrffhsd.jpg" },
  { title: "Whiplash", year: 2014, posterUrl: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg" },
  { title: "Avengers: Endgame", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg" },
  { title: "Joker", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg" },
  { title: "Everything Everywhere All at Once", year: 2022, posterUrl: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg" },
  { title: "La La Land", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
  { title: "Coco", year: 2017, posterUrl: "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg" },
  { title: "The Grand Budapest Hotel", year: 2014, posterUrl: "https://image.tmdb.org/t/p/w500/eCJdFXW9lH0xK2Hqr2Yt2jFjVUg.jpg" },
  { title: "Eternal Sunshine of the Spotless Mind", year: 2004, posterUrl: "https://image.tmdb.org/t/p/w500/5MwkWH9tYGE3s2002ZmZ3f5F2T.jpg" },
  { title: "Amelie", year: 2001, posterUrl: "https://image.tmdb.org/t/p/w500/slVn4Lz2bV9E3XmF0YQz97pVIsL.jpg" },
  { title: "Her", year: 2013, posterUrl: "https://image.tmdb.org/t/p/w500/eCOtqtf5oXoD6HnInhjXwSjLhTs.jpg" },
  { title: "No Country for Old Men", year: 2007, posterUrl: "https://image.tmdb.org/t/p/w500/6d5IW5U3LD7H22y1k2tS2b2SYGS.jpg" },
  { title: "A Separation", year: 2011, posterUrl: "https://image.tmdb.org/t/p/w500/xBDXkM4s4z7tN0fx028vG9tBEg6.jpg" },
  { title: "Oldboy", year: 2003, posterUrl: "https://image.tmdb.org/t/p/w500/pWDt3Vd8d9T3z4yt3M6p51O8iC.jpg" },
  { title: "Pan's Labyrinth", year: 2006, posterUrl: "https://image.tmdb.org/t/p/w500/s0MeHszGWfVAy03F0U6GDC2p2vR.jpg" },
  { title: "Arrival", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNs7MeKzWpd.jpg" },
  { title: "Moonlight", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/49ag9x80ZjK2xNMHscB4S8uI8y0.jpg" },
  { title: "Portrait of a Lady on Fire", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/2LquGw325c422052Y4KASp22mbt.jpg" },
  { title: "The Social Network", year: 2010, posterUrl: "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg" },
  { title: "Dune", year: 2021, posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, posterUrl: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBvYpuwAWOE88GaaFL.jpg" },
  { title: "Your Name.", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg" },
  { title: "The Prestige", year: 2006, posterUrl: "https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg" },
  { title: "Inglourious Basterds", year: 2009, posterUrl: "https://image.tmdb.org/t/p/w500/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg" },
  { title: "Django Unchained", year: 2012, posterUrl: "https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg" },

  // More Diverse / Niche / Divisive Films
  { title: "Donnie Darko", year: 2001, posterUrl: "https://image.tmdb.org/t/p/w500/fhQoQfejY1hUcwyuL2I2KCs1w6v.jpg" },
  { title: "Primer", year: 2004, posterUrl: "https://image.tmdb.org/t/p/w500/ycW32wboQ7N7kG1u6Tpi6h0e02.jpg" },
  { title: "The Lighthouse", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/3kdG3v62tHFu8mHlo3T6o2w3L2g.jpg" },
  { title: "Swiss Army Man", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/A05C4SpX3Pz0gVv80gY2k4z9S70.jpg" },
  { title: "Under the Skin", year: 2013, posterUrl: "https://image.tmdb.org/t/p/w500/kG2Mr1avq2sCFFYkYk5XDoa5L5G.jpg" },
  { title: "Midsommar", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/7gPBNsZ2L7a2ccYUw2A1avZ1g3i.jpg" },
  { title: "Sorry to Bother You", year: 2018, posterUrl: "https://image.tmdb.org/t/p/w500/t39tM0dRWZz9nS83m0z0Sza9a0.jpg" },
  { title: "Mulholland Drive", year: 2001, posterUrl: "https://image.tmdb.org/t/p/w500/oazPqsGs30GAwL1U7n0Q718Xyhr.jpg" },
  { title: "Requiem for a Dream", year: 2000, posterUrl: "https://image.tmdb.org/t/p/w500/nOd6vjAR60nmP2K42GgZ0jfsPsX.jpg" },
  { title: "Being John Malkovich", year: 1999, posterUrl: "https://image.tmdb.org/t/p/w500/gjqZ32ep2nGF9dN3hGZ984c36fP.jpg" },
  { title: "Only God Forgives", year: 2013, posterUrl: "https://image.tmdb.org/t/p/w500/7FqY04PT9iS5Y1jl4r2LznB71PH.jpg" },
  { title: "The Neon Demon", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/uHMPhfbW680z34a9q0oMPJu2nHz.jpg" },
  { title: "Raw (Grave)", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/nEuXL329L4EoFMYL2p2KRJ95uD1.jpg" }, // French title "Grave"
  { title: "Climax", year: 2018, posterUrl: "https://image.tmdb.org/t/p/w500/elVj2J1T30g0z39Q5SYN0LgD3N.jpg" },
  { title: "Annette", year: 2021, posterUrl: "https://image.tmdb.org/t/p/w500/6X2f9imL7p9LFC2QmgGr2q32X7X.jpg" },
  { title: "Titane", year: 2021, posterUrl: "https://image.tmdb.org/t/p/w500/wLp775cZp72Rjmjmep0rsv2bA7L.jpg" },
  { title: "The Killing of a Sacred Deer", year: 2017, posterUrl: "https://image.tmdb.org/t/p/w500/16V8QMIW2V6Y5yF6L3gXyYLb0tf.jpg" },
  { title: "Dogtooth (Kynodontas)", year: 2009, posterUrl: "https://image.tmdb.org/t/p/w500/26j4F3xDxA7nLq3n2X98h4fW9m8.jpg" }, // Greek title "Kynodontas"
  { title: "Possessor", year: 2020, posterUrl: "https://image.tmdb.org/t/p/w500/6f7ue6lc9J7z1cRjWnPkpZ0GSCB.jpg" },
  { title: " Mandy", year: 2018, posterUrl: "https://image.tmdb.org/t/p/w500/v6qGk22QZPZHhQgA8gCVh0p1h62.jpg" },
  { title: "The Lobster", year: 2015, posterUrl: "https://image.tmdb.org/t/p/w500/zskx7F2Qo5XJ0SqHq0vXXi5W7eM.jpg" },
  { title: "A Ghost Story", year: 2017, posterUrl: "https://image.tmdb.org/t/p/w500/hQfTql51l0e1nFXPyqgB4pYWtGC.jpg" },
  { title: "Good Time", year: 2017, posterUrl: "https://image.tmdb.org/t/p/w500/vG3Ym5rRVYT215LhXfRx6YAFX1T.jpg" },
  { title: "Uncut Gems", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/6XN1vH61r2H9O079yI1pwwqK3B.jpg" },
  { title: "I'm Thinking of Ending Things", year: 2020, posterUrl: "https://image.tmdb.org/t/p/w500/5ynWWZMo1xGL5zH6YkL5SnA2WvY.jpg" },
];
