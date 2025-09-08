import type { PopularItemEntry, Country, Language } from './types';

export const MOVIE_GENRES = [
  { value: "Action", icon: "action", key: "genre_action" },
  { value: "Adventure", icon: "adventure", key: "genre_adventure" },
  { value: "Animation", icon: "animation", key: "genre_animation" },
  { value: "Comedy", icon: "comedy", key: "genre_comedy" },
  { value: "Crime", icon: "crime", key: "genre_crime" },
  { value: "Documentary", icon: "documentary", key: "genre_documentary" },
  { value: "Drama", icon: "drama", key: "genre_drama" },
  { value: "Family", icon: "family", key: "genre_family" },
  { value: "Fantasy", icon: "fantasy", key: "genre_fantasy" },
  { value: "History", icon: "history", key: "genre_history" },
  { value: "Horror", icon: "horror", key: "genre_horror" },
  { value: "Music", icon: "music", key: "genre_music" },
  { value: "Mystery", icon: "mystery", key: "genre_mystery" },
  { value: "Romance", icon: "romance", key: "genre_romance" },
  { value: "Scifi", icon: "scifi", key: "genre_scifi" },
  { value: "Sport", icon: "sport", key: "genre_sport" },
  { value: "Superhero", icon: "superhero", key: "genre_superhero" },
  { value: "Thriller", icon: "thriller", key: "genre_thriller" },
  { value: "War", icon: "war", key: "genre_war" },
  { value: "Western", icon: "western", key: "genre_western" },
  { value: "Musical", icon: "musical", key: "genre_musical" }
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

export const SUPPORTED_TRANSLATION_LANGUAGES: Language[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Español (Spanish)" },
    { code: "fr", name: "Français (French)" },
    { code: "de", name: "Deutsch (German)" },
    { code: "ja", name: "日本語 (Japanese)" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "pt", name: "Português (Portuguese)" },
    { code: "it", name: "Italiano (Italian)" },
    { code: "ru", name: "Русский (Russian)" },
    { code: "zh", name: "中文 (Chinese)" },
    { code: "ar", name: "العربية (Arabic)" },
    { code: "ko", name: "한국어 (Korean)" },
];


export const COUNTRIES: Country[] = [
  { code: "any", name: "Any Country (Global)" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  // Add more countries as needed
];


export const MOVIE_DURATIONS: string[] = [
  "Any",
  "Short (Under 90 min)",
  "Medium (90-120 min)",
  "Long (Over 120 min)"
];

export const SERIES_SEASON_COUNTS: string[] = [
  "Any",
  "Short (1-3 seasons)",
  "Medium (4-7 seasons)",
  "Long (8+ seasons)"
];

export const ICONS = {
  // Genres
  action: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>`,
  adventure: `<img src="./icons/hiking.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  animation: `<img src="./icons/animation.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  drama:` <img src="./icons/theater.png" class="w-4 h-4 mr-1.5 inline-block"/>`,
  documentary: `<img src="./icons/documentary.png" class="w-4 h-4 mr-1.5 inline-block"/>`,
  comedy: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>`,
  romance: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>`,
  scifi: `<img src="./icons/rocket.png" class="w-4 h-4 mr-1.5 inline-block"/>`,
  thriller: `<img src="./icons/searcher.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  horror: `<img src="./icons/hand.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  history: `<img src="./icons/scroll.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  crime: `<img src="./icons/knife.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  sport:`<img src="./icons/running.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  superhero: `<img src="./icons/action.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  family: `<img src="./icons/family.png" class="w-4 h-6 mr-1.5 inline-block"/>`,
  fantasy:`<img src="./icons/wand.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  music: `<img src="./icons/musical-note.png" class="w-4 h-4 mr-1.5 inline-block"/>`,
  musical: `<img src="./icons/music.png" class="w-4 h-4 mr-1.5 inline-block"/>`,
  mystery:`<img src="./icons/annonymous.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  war:`<img src="./icons/tank.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  western:`<img src="./icons/cowboy.png" class="w-6 h-6 mr-1.5 inline-block"/>`,
  facebook:`<img src = './icons/Facebook.png' class="w-10 h-10 mr-1.5 inline-block"/>`,
whatsapp:`<img src = './icons/WhatsApp.png' class="w-10 h-10 mr-1.5 inline-block"/>`,
twitter:`<img src = './icons/twitter.jpg' class="w-10 h-10 mr-1.5 inline-block"/>`,
  default_genre: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>`,

  // OTT Platforms
  series_toggle_icon: `<img src="./icons/episodes.png" class="w-6 h-6 mb-4 mt-[-0.5 rem] rounded-full inline-block"/>`, // Renamed from netflix
  amazon_prime_video: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`,
  disney_plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.31h5.418a.562.562 0 0 1 .321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.652 0l-4.725 2.885a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988H8.88a.563.563 0 0 0 .475-.31L11.48 3.5Z" /></svg>`,
  hbo_max_max: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.557l3.113-5.603a.375.375 0 0 1 .557 0l2.49 2.491Z" /></svg>`,
  default_ott: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12M8.25 3v18m7.5-18v18M3.75 9h16.5M3.75 15h16.5" /></svg>`,
  movie_toggle_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>`,
  
  // Onboarding & Preference Form Icons
  question_frequency: `<img src="./icons/repeat.png" class="w-6 h-6 mr-2 text-purple-400 inline-block"/>`,
  question_actor_director: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>`,
  question_language: `<img src="./icons/language.png" class="w-6 h-6 mr-2 text-purple-400 inline-block"/>`,
  question_country: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-5.834A8.959 8.959 0 0 0 3 12c0 .778-.099 1.533.284 2.253m0 0A11.978 11.978 0 0 0 12 16.5c2.998 0 5.74 1.1 7.843 2.918" /></svg>`,
  question_ott: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3.75V3.75m3.75 0v16.5M5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>`,
  question_era: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>`,
  question_duration: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
  question_seasons: `<img src="./icons/episodes.png" class="w-6 h-6 mr-2 text-purple-400 inline-block"/>`,

  question_genre: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>`,
  question_mood: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>`,
  question_keywords: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 text-purple-400"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H12M12 3.75H7.5M12 3.75C12 3.75 12 5.25 12 5.25m0-1.5C12 3.75 12 2.25 12 2.25m0 3C12 5.25 12 6.75 12 6.75m0-1.5C12 5.25 13.5 5.25 13.5 5.25m-1.5 0C12 5.25 10.5 5.25 10.5 5.25" /></svg>`,
  go_cta: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 ml-2 inline-block transform group-hover:translate-x-1 transition-transform duration-150"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>`,
  
  // Movie Card Icons
  similar_to: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>`,
  availability: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
  
  // Tab Icons
  recommendations_tab_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>`,
  similar_search_tab_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>`,
  discovery_tab_icon: `<img src="./icons/compass.png" class="w-6  h-4 mb-2 mr-1.5 inline-block"/>`,
  watch_party_tab_icon: `<img src="./icons/cinema.png" class="w-4 h-4 mb-2 mr-1.5 inline-block"/>`,
  taste_check_tab_icon: `<img src="./icons/like.png" class="w-4 h-4 mb-2 mr-1.5 inline-block"/>`,

  // Discovery View Icons
  havent_watched_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>`,
  watched_it_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`,
  // Watch Party Icons
  add_to_party_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
  skip_for_party_icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m15 15-6 6m0-6 6-6m6 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
};

export const CINE_SUGGEST_ONBOARDING_COMPLETE_KEY = 'cineSuggestOnboardingComplete_v1';
export const CINE_SUGGEST_STABLE_PREFERENCES_KEY = 'cineSuggestStablePreferences_v1';
export const CINE_SUGGEST_MOVIE_FEEDBACK_KEY = 'cineSuggestMovieFeedback_v1';
export const CINE_SUGGEST_APP_SETTINGS_KEY = 'cineSuggestAppSettings_v1';
export const CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY = 'cineSuggestGrowthPromptState_v1';
export const CINE_SUGGEST_SESSION_COUNT_KEY = 'cineSuggestSessionCount_v1';
export const CINE_SUGGEST_WATCHLIST_KEY = 'cineSuggestWatchlist_v1';
export const CINE_SUGGEST_TRANSLATIONS_KEY_PREFIX = 'cineSuggestTranslations_';
export const CINE_SUGGEST_USER_LANGUAGE_KEY = 'cineSuggestUserLanguage_v1';
export const CINE_SUGGEST_STORE_REVIEW_URL = 'https://apps.apple.com/app/id1234567890';
export const CINE_SUGGEST_SHARE_URL = 'https://cinemanai.app';

export const TOTAL_ONBOARDING_STEPS = 5; 
export const ONBOARDING_STEP_MILESTONES = [ 
  "Welcome",
  "Viewing Habits", 
  "Content Style", 
  "Access & Language", // Country will be added here
  "Confirmation"
];


export const POPULAR_MOVIES_FOR_SUGGESTION: PopularItemEntry[] = [
  { title: "Inception", year: 2010, posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" },
  { title: "The Shawshank Redemption", year: 1994, posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" },
  { title: "The Godfather", year: 1972, posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
  { title: "Pulp Fiction", year: 1994, posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" },
  { title: "The Dark Knight", year: 2008, posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { title: "Forrest Gump", year: 1994, posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" },
  { title: "Spirited Away", year: 2001, posterUrl: "https://image.tmdb.org/t/p/w500/39wmItIW2zwAtoO7K4P77f4kIe1.jpg" },
  { title: "Parasite", year: 2019, posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
  { title: "Interstellar", year: 2014, posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { title: "The Matrix", year: 1999, posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg" },
  { title: "Gladiator", year: 2000, posterUrl: "https://image.tmdb.org/t/p/w500/ty8TGRBGvKMYFwc5AnAiOA1015M.jpg" },
  { title: "Eternal Sunshine of the Spotless Mind", year: 2004, posterUrl: "https://image.tmdb.org/t/p/w500/5MwkWH9tYGE3sDkKqjXQCn22m7Q.jpg" },
  { title: "Amélie", year: 2001, posterUrl: "https://image.tmdb.org/t/p/w500/nAPpkL5slyB50ig9E3Nn7D3S33F.jpg" },
  { title: "Oldboy", year: 2003, posterUrl: "https://image.tmdb.org/t/p/w500/pWDt3i0t9K4KhK42Y6zYt0bCMhD.jpg" },
  { title: "Mad Max: Fury Road", year: 2015, posterUrl: "https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46t2Qh.jpg" },
  { title: "Arrival", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJ2z7wdL.jpg" },
  { title: "Blade Runner 2049", year: 2017, posterUrl: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg" },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, posterUrl: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBvYPUbJ3o5T2kTTaK.jpg" },
  { title: "Everything Everywhere All at Once", year: 2022, posterUrl: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg" },
  { title: "La La Land", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
  { title: "Whiplash", year: 2014, posterUrl: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg" },
  { title: "The Grand Budapest Hotel", year: 2014, posterUrl: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg" },
  { title: "Coco", year: 2017, posterUrl: "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg" },
  { title: "Your Name.", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg" },
  { title: "A Silent Voice", year: 2016, posterUrl: "https://image.tmdb.org/t/p/w500/tuFaWiqX04pWG64MvA7d2Q381Mz.jpg" }
];

export const POPULAR_SERIES_FOR_SUGGESTION: PopularItemEntry[] = [
  { title: 'Breaking Bad', year: 2008, posterUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg' },
  { title: 'Game of Thrones', year: 2011, posterUrl: 'https://image.tmdb.org/t/p/w500/1XS1oqL89wqerub5QVE9INscBse.jpg' },
  { title: 'The Sopranos', year: 1999, posterUrl: 'https://image.tmdb.org/t/p/w500/rTc7ZXdroIuB7DDoq2a07G1E140.jpg' },
  { title: 'The Wire', year: 2002, posterUrl: 'https://image.tmdb.org/t/p/w500/4lbFpL2zPuA0QYQ2Z1g9CaTMh4i.jpg' },
  { title: 'Stranger Things', year: 2016, posterUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg' },
  { title: 'Friends', year: 1994, posterUrl: 'https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg' },
  { title: 'The Office', year: 2005, posterUrl: 'https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg' },
  { title: 'Chernobyl', year: 2019, posterUrl: 'https://image.tmdb.org/t/p/w500/900h1lPAj2DfiTjRjC6L6LsoALM.jpg' },
  { title: 'Fleabag', year: 2016, posterUrl: 'https://image.tmdb.org/t/p/w500/27v2zDs00L2sHDM2Wa1Sj2a0gT.jpg' },
  { title: 'Black Mirror', year: 2011, posterUrl: 'https://image.tmdb.org/t/p/w500/5UaYsGZOFhjh6xxMFRsraBGAo16.jpg' },
  { title: 'Succession', year: 2018, posterUrl: 'https://image.tmdb.org/t/p/w500/m6TlinLhLB2b4iK6o1t4bA83er4.jpg' },
  { title: 'Ted Lasso', year: 2020, posterUrl: 'https://image.tmdb.org/t/p/w500/5DbeS3Q2iNlI2E2wT8pBNfLdaL4.jpg' },
  { title: 'The Mandalorian', year: 2019, posterUrl: 'https://image.tmdb.org/t/p/w500/pB82qt6gKzAqCDdALPeDBhB2Ljj.jpg' },
  { title: 'Peaky Blinders', year: 2013, posterUrl: 'https://image.tmdb.org/t/p/w500/vUUqzSykIBD2fDRrghBvl7vDLI1.jpg' },
  { title: 'Attack on Titan', year: 2013, posterUrl: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjG9IMeGWxJCNVbYY.jpg' },
  { title: 'Dark', year: 2017, posterUrl: 'https://image.tmdb.org/t/p/w500/apbrb6EVack4UqSSbK2O8n3s57.jpg' },
  { title: 'The Crown', year: 2016, posterUrl: 'https://image.tmdb.org/t/p/w500/1M87TDEs23DOvS1iL2M8i2bN2A.jpg' },
  { title: 'Westworld', year: 2016, posterUrl: 'https://image.tmdb.org/t/p/w500/8MfgyFHf7ikdmeEaBvAlim24GgG.jpg' },
  { title: 'Sherlock', year: 2010, posterUrl: 'https://image.tmdb.org/t/p/w500/7WTsnHkGs3NBQpbGmWbM2A9jsYV.jpg' },
  { title: 'The Boys', year: 2019, posterUrl: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1DqNHM4K43v45pA6.jpg' },
];

export const LANDING_PAGE_POSTERS = [
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
  'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', // Pulp Fiction
  'https://image.tmdb.org/t/p/w500/39wmItIW2zwAtoO7K4S3r4wko24.jpg', // Spirited Away
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
  'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', // Blade Runner 2049
  'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
];