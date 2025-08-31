

import { GoogleGenAI } from "@google/genai";
import type { UserPreferences, Movie, GeminiMovieRecommendation, AppSettings, MovieFeedback as AppMovieFeedbackType, RecommendationType, ItemTitleSuggestion as AppItemTitleSuggestion, StableUserPreferences, TasteCheckGeminiResponse, TasteCheckGeminiResponseItem, TasteCheckServiceResponse } from '../types';
import { MOVIE_LANGUAGES, MOVIE_ERAS, MOVIE_DURATIONS, SERIES_SEASON_COUNTS, CINE_SUGGEST_MOVIE_FEEDBACK_KEY, CINE_SUGGEST_APP_SETTINGS_KEY, COUNTRIES } from '../constants';

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_PREFIX = 'cine_suggest_cache_';

// Model fallback configuration
const MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
] as const;

type CacheEntry = {
  data: any;
  timestamp: number;
  model: string;
};

type CacheKey = string;

const API_KEY = 'AIzaSyBJqkrD1MteQ9FV6v3Dtdo39dhLUf4BRB4';

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables. Movie recommendations will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Cache management functions
function generateCacheKey(prompt: string, model: string): CacheKey {
  const hash = btoa(prompt).slice(0, 50); // Simple hash for cache key
  return `${CACHE_PREFIX}${model}_${hash}`;
}

function getFromCache(cacheKey: CacheKey): any | null {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

function setCache(cacheKey: CacheKey, data: any, model: string): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      model
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

function clearExpiredCache(): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const entry: CacheEntry = JSON.parse(localStorage.getItem(key)!);
          if (now - entry.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Cache cleanup error:', error);
  }
}

// Initialize cache cleanup
if (typeof window !== 'undefined') {
  clearExpiredCache();
  // Clean up cache every hour
  setInterval(clearExpiredCache, 60 * 60 * 1000);
}

// Generic API call function with model fallback and caching
async function callGeminiWithFallback(prompt: string, operation: string): Promise<string> {
  const cacheKey = generateCacheKey(prompt, MODELS[0]);
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${operation}`);
    return cached;
  }
  
  // Try each model in order
  for (const model of MODELS) {
    try {
      console.log(`Trying model: ${model} for ${operation}`);
      
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          // Low latency for autosuggest operations
          thinkingConfig: operation.includes('suggest') ? { thinkingBudget: 0 } : undefined
        }
      });
      
      const result = response.text;
      if (result && result.trim()) {
        // Cache the successful result
        setCache(cacheKey, result, model);
        console.log(`Success with model: ${model} for ${operation}`);
        return result;
      }
    } catch (error: any) {
      console.warn(`Model ${model} failed for ${operation}:`, error.message);
      
      // If it's a quota/safety error, don't try other models
      if (error.message?.toLowerCase().includes('quota') || 
          error.message?.toLowerCase().includes('safety') ||
          error.message?.toLowerCase().includes('billing')) {
        throw error;
      }
      
      // Continue to next model
      continue;
    }
  }
  
  throw new Error(`All models failed for ${operation}. Please try again later.`);
} 

function getStoredFeedback(): AppMovieFeedbackType[] {
  if (typeof localStorage !== 'undefined') {
    const storedFeedbackString = localStorage.getItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY);
    if (storedFeedbackString) {
      try {
        const feedback = JSON.parse(storedFeedbackString) as AppMovieFeedbackType[];
        if (Array.isArray(feedback)) {
          return feedback;
        }
        console.warn("Stored feedback was not an array, returning empty.");
        return [];
      } catch (e) {
        console.error("Failed to parse movie feedback from localStorage for prompt", e);
        return [];
      }
    }
  }
  return [];
}

function getNumberOfRecommendationsSetting(): number {
  if (typeof localStorage !== 'undefined') {
    const settingsString = localStorage.getItem(CINE_SUGGEST_APP_SETTINGS_KEY);
    if (settingsString) {
      try {
        const settings = JSON.parse(settingsString) as AppSettings;
        if (settings && typeof settings.numberOfRecommendations === 'number' && settings.numberOfRecommendations >= 1 && settings.numberOfRecommendations <= 4) {
          return settings.numberOfRecommendations;
        }
      } catch (e) {
        console.error("Failed to parse app settings from localStorage", e);
      }
    }
  }
  return 3; 
}


function constructPrompt(preferences: UserPreferences, recommendationType: RecommendationType, sessionExcludedItems: Movie[] = [], numberOfRecommendations: number): string {
  const itemType = recommendationType === 'series' ? 'TV series' : 'movie';
  const pluralItemType = recommendationType === 'series' ? 'series' : 'movies';
  const feedbackHistory = getStoredFeedback();

  let prompt = `You are a helpful and enthusiastic ${itemType} recommendation expert.
Based on the following user preferences, suggest ${numberOfRecommendations} unique ${pluralItemType}.
Aim to provide compelling and generally well-regarded suggestions that fit the user's criteria, using your knowledge of the ${itemType} landscape.

Quality Control Guidance:
- High Audience Score Boost: Give a significant ranking and relevance boost to movies/series that are known to have a high audience score from Google users (e.g., "liked this film" percentage), typically above 70%. These are strong indicators of general audience enjoyment and should be prioritized when they match other criteria. If you identify a movie with such a score, you can include it in the 'socialProofTag', for example: "85% Liked on Google".
`;

  if (feedbackHistory.length < 5) {
    prompt += `- New User Priority: This user has provided little to no feedback. It is CRITICAL that you prioritize suggesting ${pluralItemType} that are generally well-regarded, critically acclaimed, or have a strong positive popular reception (e.g., high ratings on popular review sites). AVOID suggesting ${pluralItemType} that are known to be poorly reviewed or have a negative reputation, unless the user's keywords explicitly ask for something like "so bad it's good" or "cult films". The goal is to build trust with high-quality, relevant suggestions first.
`;
  } else {
    prompt += `- Experienced User: This user has provided a good amount of feedback. You can rely more heavily on their specific taste patterns derived from their feedback history, even if it leads to more niche or less universally acclaimed suggestions that perfectly fit their unique profile.
`;
  }

  prompt += `
User Preferences:`;
  if (preferences.genres.length > 0) {
    prompt += `\n- Preferred Genres: ${preferences.genres.join(', ')}`;
  }

  if (preferences.excludedGenres && preferences.excludedGenres.length > 0) {
    prompt += `\n- CRITICALLY EXCLUDE ${pluralItemType} that are PRIMARILY of the following genres: ${preferences.excludedGenres.join(', ')}. If a ${itemType} has multiple genres and one is on this exclusion list, but the ${itemType} strongly aligns with other specified preferences and non-excluded genres, it might still be acceptable in rare cases. However, generally avoid suggesting ${pluralItemType} whose main genre falls into this exclusion list. This is a strong negative preference.`;
  }

  if (preferences.mood) {
    prompt += `\n- Mood/Vibe: "${preferences.mood}"`;
  }

  if (preferences.movieFrequency) {
    prompt += `\n- How often they watch ${pluralItemType}: "${preferences.movieFrequency}"`;
    if (preferences.movieFrequency === "Daily" || preferences.movieFrequency === "A few times a week") {
      prompt += ` (This user watches ${pluralItemType} very frequently, so they may have already seen many mainstream hits. Prioritize lesser-known gems, critically acclaimed indie ${pluralItemType}, or very recent releases they might not have encountered yet. Also, ensure these suggestions align with their other stated preferences.)`;
    } else if (preferences.movieFrequency === "A few times a month" || preferences.movieFrequency === "Rarely") {
      prompt += ` (This user watches ${pluralItemType} less frequently, so well-known blockbusters or critically acclaimed popular ${pluralItemType} that match their other preferences are excellent suggestions. You can also include some hidden gems if they are a strong match.)`;
    } else if (preferences.movieFrequency === "Once a week") {
      prompt += ` (This user watches ${pluralItemType} regularly. Aim for a mix of popular choices and some interesting, perhaps slightly less mainstream, options that fit their profile.)`;
    }
  }
  
  if (recommendationType === 'series') {
    if (preferences.preferredNumberOfSeasons && preferences.preferredNumberOfSeasons.length > 0) {
        if (preferences.preferredNumberOfSeasons.includes(SERIES_SEASON_COUNTS[0]) || preferences.preferredNumberOfSeasons.length === 0) { // SERIES_SEASON_COUNTS[0] is "Any"
            prompt += `\n- Preferred Number of Seasons (for series): Any number of seasons is fine.`;
        } else {
            prompt += `\n- Preferred Number of Seasons (for series): "${preferences.preferredNumberOfSeasons.join(', ')}". Interpret these as follows: "Short" is 1-3 seasons, "Medium" is 4-7 seasons, "Long" is 8+ seasons. Aim to match one of these preferences.`;
        }
    } else {
        prompt += `\n- Preferred Number of Seasons (for series): Any number of seasons is fine.`;
    }
  } else { // recommendationType is 'movie'
    if (preferences.movieDuration && preferences.movieDuration.length > 0) {
        if (preferences.movieDuration.includes(MOVIE_DURATIONS[0]) || preferences.movieDuration.length === 0) { 
           prompt += `\n- Preferred Movie Duration: Any duration is fine.`;
        } else {
          prompt += `\n- Preferred Movie Duration(s): "${preferences.movieDuration.join(', ')}". Interpret these as follows: "Short" means roughly under 90 minutes, "Medium" means 90-120 minutes, "Long" means over 120 minutes. Aim to match one of these duration preferences closely.`;
        }
      } else { 
        prompt += `\n- Preferred Movie Duration: Any duration is fine.`;
      }
  }


  if (preferences.actorDirectorPreference && preferences.actorDirectorPreference !== "No Preference") {
    prompt += `\n- Preference for known actors/directors: "${preferences.actorDirectorPreference}"`;
  }

  if (preferences.preferredLanguages && preferences.preferredLanguages.length > 0 && !preferences.preferredLanguages.includes('any')) {
     const languageNames = preferences.preferredLanguages.map(code => MOVIE_LANGUAGES.find(l => l.code === code)?.name || code);
    prompt += `\n- Preferred ${itemType} language(s): "${languageNames.join(', ')}" (If a ${itemType} perfectly matches other criteria but is not in these languages, you can still suggest it but note the language clearly).`;
  } else {
    prompt += `\n- Preferred ${itemType} language(s): Any language is acceptable. Actively seek out highly-rated and relevant ${pluralItemType} from diverse global industries, including but not limited to English, Hindi, Spanish, Korean, Japanese, French cinema, etc., provided they strongly align with the user's other preferences (genres, mood, keywords, era, feedback history). Do not overly bias towards English-language ${pluralItemType} if compelling non-English options fit the user's profile.`;
  }

  if (preferences.country && preferences.country.toLowerCase() !== 'any') {
    const countryName = COUNTRIES.find(c => c.code === preferences.country)?.name || preferences.country;
    prompt += `\n- User's Country for Availability: "${countryName}". HIGH PRIORITY: Try to find ${pluralItemType} known to be available in this country. The 'availabilityNote' should reflect this (e.g., 'Available on Netflix in ${countryName}', or 'Likely available for rent in ${countryName}'). If global, mention it.`;
  } else {
    prompt += `\n- User's Country for Availability: Any/Global. Consider broad availability. The 'availabilityNote' should reflect general availability or major platforms if known.`;
  }

   if (preferences.ottPlatforms.length > 0) {
    prompt += `\n- CRITICAL: Preferred Streaming Platforms: ${preferences.ottPlatforms.join(', ')}. It is EXTREMELY IMPORTANT to try and find ${pluralItemType} available on these platforms. The 'availabilityNote' field MUST clearly state this if a ${itemType} is found on one of these platforms (e.g., 'Available on Netflix', 'Check Disney+ or Amazon Prime Video'). If a perfect ${itemType} match isn't on these platforms, you can suggest it but clearly state it might be 'Available for rent/purchase' or 'Check other streaming services'. Prioritize accuracy for user-specified platforms. Give specific platform names in the note, and if country is specified, mention platform availability in that country if known.`;
  } else {
    prompt += `\n- Preferred Streaming Platforms: None specified. Provide general availability notes (e.g., 'Available on major streaming services', 'Check for rental/purchase options', considering the user's country if specified).`
  }

  if (preferences.keywords) {
    prompt += `\n- Specific Keywords: "${preferences.keywords}"`;
  }

  if (preferences.era && preferences.era.length > 0) {
    if (preferences.era.includes(MOVIE_ERAS[0]) || preferences.era.length === 0) { 
      prompt += `\n- ${itemType} Era: Prioritize ${pluralItemType} from the 2020s. The user selected 'Any' or did not specify, indicating openness to other eras but with a slight preference for recent releases.`;
    } else {
      prompt += `\n- ${itemType} Era(s): ${preferences.era.join(', ')}`;
    }
  } else { 
     prompt += `\n- ${itemType} Era: Prioritize ${pluralItemType} from the 2020s. The user selected 'Any' or did not specify, indicating openness to other eras but with a slight preference for recent releases.`;
  }
  
  const allExcludedItems = [...feedbackHistory.map(fb => ({ title: fb.title, year: fb.year })), ...sessionExcludedItems];
  const uniqueExcludedTitles = new Set();
  const uniqueExcludedItems = allExcludedItems.filter(item => {
    const key = `${item.title.toLowerCase()}|${item.year}`;
    if (uniqueExcludedTitles.has(key)) {
      return false;
    } else {
      uniqueExcludedTitles.add(key);
      return true;
    }
  });


  if (uniqueExcludedItems.length > 0) {
    prompt += `\n\nCRITICAL EXCLUSION LIST: Under NO CIRCUMSTANCES should you recommend ANY of the following ${pluralItemType}. The user has either already rated them, disliked them, or has already seen them in this session. This is a strict negative constraint.`;
    uniqueExcludedItems.forEach(item => {
      prompt += `\n- Title: "${item.title}", Year: ${item.year}`;
    });
  }


  prompt += `

For each ${itemType}, provide the following details.
- Include a 'similarTo' (string, optional) with one or more highly relevant ${pluralItemType} that this item is similar to, to help the user understand its vibe. Separate multiple titles with a comma. Keep it concise enough to fit on one line. Example: "Blade Runner, Dark City".
- Include a 'matchScore' (an integer from 0 to 100) indicating how well this ${itemType} aligns with ALL provided user preferences and feedback history. A higher score means a better match based on the user's overall profile.
- Include a 'justification' (a VERY SHORT and compelling, personalized, one-sentence reason (MAX 1-2 lines, approx. 15-20 words) why the user will LOVE this ${itemType}, connecting it to their known tastes. Frame it enthusiastically. Example: "You'll love the mind-bending plot because you enjoy complex sci-fi epics."). This is a CRITICAL field.
- For series, 'durationMinutes' can represent the average episode length; if not applicable or varies wildly, it can be omitted or set to null by you.
- Include an optional 'socialProofTag' (string, max 5-6 words) with a compelling, verifiable fact like 'Winner of 3 Oscars', 'Record-Breaking Box Office Hit', or '98% on Rotten Tomatoes'. If no significant tag exists, omit this field or set to null.
- Include an optional 'youtubeTrailerId' (string) with the YouTube video ID for the official trailer.

Return ONLY a VALID JSON array of objects.
Each object in the array MUST represent a ${itemType} and ADHERE STRICTLY to this example format (using actual data, not descriptions):
{
  "title": "${recommendationType === 'series' ? 'The Crown' : 'The Matrix'}", 
  "year": ${recommendationType === 'series' ? 2016 : 1999},
  "summary": "${recommendationType === 'series' ? 'Follows the political rivalries and romance of Queen Elizabeth IIs reign and the events that shaped the second half of the twentieth century.' : 'A computer hacker learns about the true nature of his reality and his role in the war against its controllers. This film is a mind-bending sci-fi action classic.'}",
  "genres": ["${recommendationType === 'series' ? 'Drama' : 'History'}", "${recommendationType === 'series' ? 'History' : 'Sci-Fi'}"],
  "similarTo": "${recommendationType === 'series' ? 'Victoria, The Tudors' : 'Blade Runner, Dark City'}",
  "tmdbId": "${recommendationType === 'series' ? '63247' : '603'}",
  "availabilityNote": "Likely on Netflix",
  "posterUrl": "https://image.tmdb.org/t/p/w500/${recommendationType === 'series' ? '1MPK1s6Q5S1eO3WsoKk2tBsVTo.jpg' : 'f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'}",
  "durationMinutes": ${recommendationType === 'series' ? 58 : 136},
  "matchScore": 92,
  "justification": "You'll love its mind-bending plot, a perfect fit for your taste in complex sci-fi.",
  "socialProofTag": "${recommendationType === 'series' ? 'Winner of 2 Golden Globes' : 'Winner of 4 Oscars'}",
  "youtubeTrailerId": "${recommendationType === 'series' ? 'jwjCY_2a_yU' : 'vKQi3bBA1y8'}"
}

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT (Failure to comply will make the output unusable):
- Your ENTIRE response MUST be ONLY the JSON array. Do not include ANY text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON array.
- Within each JSON object, after any property's value (e.g., after \`92\` in \`"matchScore": 92\`), there MUST be either a comma \`,\` (if more properties follow) or a closing curly brace \`}\` (if it's the last property). NO OTHER TEXT, WORDS, OR COMMENTS ARE ALLOWED IN THAT SPECIFIC POSITION.
- Ensure all string values within the JSON are correctly escaped (e.g., quotes within summaries must be escaped like \\").
- Do NOT insert any extraneous text, dialogue, or commentary between JSON objects, within any string values, or after any field. The JSON output must be absolutely pure and directly parsable.
- Provide ${numberOfRecommendations} ${itemType} recommendations. The 'availabilityNote' is very important; if a user specified OTT platforms, try hard to list ${pluralItemType} available there and mention the platform name in the note. If a country is specified, tailor the availability note to that country if possible.
- The 'matchScore' MUST be an integer between 0 and 100.
- If you cannot find ${pluralItemType} for very specific or conflicting preferences, provide an empty array [] or fewer than ${numberOfRecommendations} recommendations, but still ensure the output is a valid JSON array with NO OTHER TEXT OR COMMENTS, whatsoever.
`;
  return prompt;
}

const itemTypeStringUpperSingular = (recommendationType: RecommendationType) => recommendationType === 'series' ? 'Series' : 'Movie';


const parseAndTransformItems = (jsonStr: string): Movie[] => {
  let cleanedJsonStr = jsonStr.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedJsonStr.match(fenceRegex);
  if (match && match[1]) {
    cleanedJsonStr = match[1].trim();
  }

  if (!cleanedJsonStr) {
    console.warn("Received empty string for item JSON parsing.");
    return [];
  }

  const parsedData: GeminiMovieRecommendation[] = JSON.parse(cleanedJsonStr);
      
  if (!Array.isArray(parsedData)) {
    console.error("Gemini response is not an array:", parsedData);
    throw new Error("AI response was not in the expected array format.");
  }

  return parsedData.map((item: GeminiMovieRecommendation): Movie => {
    const title = item.title || "Unknown Title";
    const year = typeof item.year === 'number' ? item.year : 0;
    const summary = item.summary || "No summary available.";
    const genres = Array.isArray(item.genres) ? item.genres.filter(g => typeof g === 'string') : ["Unknown Genre"];
    const durationMinutes = typeof item.durationMinutes === 'number' ? item.durationMinutes : undefined;
    const matchScore = typeof item.matchScore === 'number' && item.matchScore >= 0 && item.matchScore <= 100 ? item.matchScore : undefined;
    
    return {
      id: `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${year}`,
      title,
      year,
      summary,
      genres,
      similarTo: item.similarTo,
      tmdbId: item.tmdbId,
      availabilityNote: item.availabilityNote,
      posterUrl: item.posterUrl,
      durationMinutes,
      matchScore,
      justification: item.justification,
      youtubeTrailerId: item.youtubeTrailerId,
      socialProofTag: item.socialProofTag,
    };
  }).filter(movie => movie.title !== "Unknown Title" && movie.year > 0);
};


export const getMovieRecommendations = async (preferences: UserPreferences, recommendationType: RecommendationType, excludedMovies: Movie[] = []): Promise<Movie[]> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please configure your environment variables.");
  }
  
  const totalItemsToFetch = 8; // Fetch a larger batch for buffering
  const prompt = constructPrompt(preferences, recommendationType, excludedMovies, totalItemsToFetch);

  try {
    const jsonStr = await callGeminiWithFallback(prompt, `movie_recommendations_${recommendationType}`);
    
    if (!jsonStr) {
        console.error("Gemini response was empty or did not contain text.");
        throw new Error(`Failed to get a response from the AI. The response was empty.`);
    }
    return parseAndTransformItems(jsonStr);

  } catch (error: any) {
    console.error(`Error fetching ${recommendationType} recommendations from Gemini:`, error);
    let errorMessage = `Failed to fetch ${recommendationType} recommendations due to an unexpected error.`;
    if (error.message) {
        errorMessage = error.message;
    }
    // Check for specific safety/quota errors if they are exposed in the error object
    if (error.toString().toLowerCase().includes("safety")) {
        errorMessage = "Your request was blocked by safety filters. Please adjust your preferences and try again.";
    } else if (error.toString().toLowerCase().includes("quota")) {
        errorMessage = "API usage limit reached. Please check your billing status.";
    }
    throw new Error(errorMessage);
  }
};


export const getSingleReplacementRecommendation = async (preferences: UserPreferences, recommendationType: RecommendationType, allCurrentItems: Movie[]): Promise<Movie | null> => {
    if (!API_KEY) {
        throw new Error("API Key is missing.");
    }

    const prompt = constructPrompt(preferences, recommendationType, allCurrentItems, 1);

    try {
        const jsonStr = await callGeminiWithFallback(prompt, `single_replacement_${recommendationType}`);
        
         if (!jsonStr) {
            console.warn("Received no text from Gemini for a single replacement.");
            return null;
        }

        const newItems = parseAndTransformItems(jsonStr);
        return newItems.length > 0 ? newItems[0] : null;

    } catch (error) {
        console.error(`Error fetching single replacement ${recommendationType}:`, error);
        return null;
    }
};



export const findSimilarItemByName = async (itemTitle: string, recommendationType: RecommendationType, stablePreferences: StableUserPreferences): Promise<Movie> => {
    if (!API_KEY) {
        throw new Error("API Key is missing.");
    }
    const itemType = itemTypeStringUpperSingular(recommendationType);
    const itemTypeLower = itemType.toLowerCase();

    const prompt = `You are a ${itemTypeLower} database expert. A user is searching for a ${itemTypeLower} titled "${itemTitle}". 
Your primary goal is to identify the most likely ${itemTypeLower} the user is referring to.
If you find a clear match, provide its details. 
If the title is ambiguous (e.g., "The Office"), use your knowledge to pick the most popular and culturally significant version (e.g., the US version of The Office).
If the title is a very common phrase, try to find a well-known ${itemTypeLower} that matches it.

Based on the user's stable preferences below, calculate a 'matchScore' (0-100) that estimates how much they would like this SPECIFIC ${itemTypeLower} you've found.
- Viewing Frequency: ${stablePreferences.movieFrequency}
- Era Preferences: ${stablePreferences.era.join(', ') || 'Any'}
- Actor/Director Preference: ${stablePreferences.actorDirectorPreference}
- Preferred Languages: ${stablePreferences.preferredLanguages.join(', ') || 'Any'}
- Available in Country: ${stablePreferences.country || 'Any'}
- Preferred on Platforms: ${stablePreferences.ottPlatforms.join(', ') || 'None'}

Return ONLY a VALID JSON object (NOT an array) with the details of the found ${itemTypeLower}. The JSON object MUST STRICTLY adhere to this format:
{
  "title": "The Found ${itemType}",
  "year": 2005,
  "summary": "A brief, engaging summary of the ${itemTypeLower}.",
  "genres": ["Genre1", "Genre2"],
  "posterUrl": "https://image.tmdb.org/t/p/w500/path.jpg",
  "durationMinutes": ${recommendationType === 'series' ? 22 : 120},
  "matchScore": 78,
  "youtubeTrailerId": "trailerId123",
  "socialProofTag": "Winner of 5 Emmys"
}

IMPORTANT: If you cannot find a reasonably close match for "${itemTitle}", return a JSON object with all fields set to null, like this: {"title": null, "year": null, "summary": null, "genres": null, "posterUrl": null, "durationMinutes": null, "matchScore": null, "youtubeTrailerId": null, "socialProofTag": null}.
Under NO circumstances should you add ANY text or markdown before or after the single JSON object. Your entire response must be ONLY the JSON object.`;

    try {
        const jsonStr = await callGeminiWithFallback(prompt, `find_similar_${itemTypeLower}_${itemTitle}`);
        
        if (!jsonStr) {
            throw new Error(`The AI returned an empty response while searching for "${itemTitle}".`);
        }
        
        const parsedItem = JSON.parse(jsonStr.trim()) as GeminiMovieRecommendation;

        if (!parsedItem || !parsedItem.title || !parsedItem.year) {
            throw new Error(`Could not find a distinct ${itemTypeLower} matching "${itemTitle}". Please try a different title or check for typos.`);
        }
        
        return {
            id: `${parsedItem.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${parsedItem.year}`,
            title: parsedItem.title,
            year: parsedItem.year,
            summary: parsedItem.summary || "No summary available.",
            genres: parsedItem.genres || [],
            posterUrl: parsedItem.posterUrl,
            durationMinutes: parsedItem.durationMinutes,
            matchScore: parsedItem.matchScore,
            youtubeTrailerId: parsedItem.youtubeTrailerId,
            socialProofTag: parsedItem.socialProofTag,
        };

    } catch (error: any) {
        console.error(`Error finding similar ${itemTypeLower} for "${itemTitle}":`, error);
        if (error instanceof SyntaxError) {
             throw new Error(`The AI returned an invalid response for "${itemTitle}". Please try again.`);
        }
        throw error;
    }
};

export const getMoreSimilarItems = async (
    originalItemTitle: string, 
    originalItemYear: number, 
    recommendationType: RecommendationType, 
    originalItemId: string | undefined,
    stablePreferences: StableUserPreferences
): Promise<Movie[]> => {
    if (!API_KEY) {
        throw new Error("API Key is missing.");
    }

    const itemType = itemTypeStringUpperSingular(recommendationType);
    const pluralItemType = recommendationType === 'series' ? 'series' : 'movies';

    let exclusionList = [{ title: originalItemTitle, year: originalItemYear }];

    const prompt = `A user wants to find ${pluralItemType} that are very similar to "${originalItemTitle}" (${originalItemYear}).
Please suggest 5 unique ${pluralItemType} that share a similar tone, theme, genre, or style.
For each suggestion, consider the user's stable preferences to calculate a 'matchScore' (0-100) indicating how well the suggestion aligns with their general taste.

User's Stable Preferences:
- Viewing Frequency: ${stablePreferences.movieFrequency}
- Era Preferences: ${stablePreferences.era.join(', ') || 'Any'}
- Actor/Director Preference: ${stablePreferences.actorDirectorPreference}
- Preferred Languages: ${stablePreferences.preferredLanguages.join(', ') || 'Any'}
- Available in Country: ${stablePreferences.country || 'Any'}
- Preferred on Platforms: ${stablePreferences.ottPlatforms.join(', ') || 'None'}

CRITICAL: Do NOT suggest "${originalItemTitle}" (${originalItemYear}) itself.

Return ONLY a VALID JSON array of 5 objects. Each object must strictly follow this format:
{
  "title": "Similar ${itemType} Title",
  "year": 2010,
  "summary": "A brief summary explaining why it's a good alternative.",
  "genres": ["Genre1", "Genre2"],
  "posterUrl": "https://image.tmdb.org/t/p/w500/path.jpg",
  "durationMinutes": ${recommendationType === 'series' ? 45 : 150},
  "matchScore": 85,
  "justification": "Because you liked the complex narrative of the original, you'll enjoy this.",
  "youtubeTrailerId": "trailerId456",
  "socialProofTag": "Critically Acclaimed"
}

IMPORTANT: Your entire response must be ONLY the JSON array. Do not include any text, comments, or markdown before or after the JSON array.`;

    try {
        const jsonStr = await callGeminiWithFallback(prompt, `more_similar_${pluralItemType}_${originalItemTitle}`);
        
         if (!jsonStr) {
            throw new Error("The AI returned an empty response.");
        }
        return parseAndTransformItems(jsonStr);

    } catch (error: any) {
        console.error(`Error fetching more similar ${pluralItemType}:`, error);
        throw new Error(`Failed to fetch more similar ${pluralItemType}.`);
    }
};


export const getItemTitleSuggestions = async (query: string, recommendationType: RecommendationType): Promise<AppItemTitleSuggestion[]> => {
    if (!API_KEY || query.length < 2) {
        return [];
    }

    const itemType = recommendationType === 'series' ? 'TV series' : 'movie';
    const pluralItemType = recommendationType === 'series' ? 'series' : 'movies';

    const prompt = `Based on the user's search query "${query}", suggest up to 5 well-known ${pluralItemType} titles that are likely matches. 
Prioritize popular and critically acclaimed titles.
Return ONLY a VALID JSON array of objects. Each object must have a "title" (string) and "year" (number).
Example format: [{"title": "The Matrix", "year": 1999}, {"title": "The Matrix Reloaded", "year": 2003}]
If no good matches are found, return an empty array [].
Your entire response must be ONLY the JSON array. No other text or markdown is allowed.`;

    try {
        const jsonStr = await callGeminiWithFallback(prompt, `title_suggestions_${query}`);
        
        if (!jsonStr) return [];

        let cleanedJsonStr = jsonStr.trim().replace(/^```json\s*|```$/g, '');
        const suggestions = JSON.parse(cleanedJsonStr) as AppItemTitleSuggestion[];
        
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s.title === 'string' && typeof s.year === 'number')) {
            return suggestions;
        }
        return [];

    } catch (error) {
        console.error("Error fetching title suggestions:", error);
        return []; // Return empty array on error to avoid breaking UI
    }
};

export const checkTasteMatch = async (itemTitle: string, recommendationType: RecommendationType, stablePreferences: StableUserPreferences): Promise<TasteCheckServiceResponse> => {
    if (!API_KEY) {
        return { itemFound: false, movie: null, justification: null, error: "API Key is missing." };
    }

    const itemType = itemTypeStringUpperSingular(recommendationType);
    const itemTypeLower = itemType.toLowerCase();

    const prompt = `You are a ${itemTypeLower} taste analysis expert. The user wants to know if they will like a ${itemTypeLower} titled "${itemTitle}", based on their stable preferences.

First, identify the most likely ${itemTypeLower} the user is referring to.
Then, analyze this ${itemTypeLower}'s characteristics (genre, tone, themes, critical reception, etc.) against the user's preferences provided below.

User's Stable Preferences:
- Viewing Frequency: "${stablePreferences.movieFrequency}"
- Era Preferences: "${stablePreferences.era.join(', ')}"
- Actor/Director Preference: "${stablePreferences.actorDirectorPreference}"
- Preferred Languages: "${stablePreferences.preferredLanguages.map(code => MOVIE_LANGUAGES.find(l => l.code === code)?.name || code).join(', ')}"
- User's Country: "${COUNTRIES.find(c => c.code === stablePreferences.country)?.name || stablePreferences.country}"
- Preferred Streaming Platforms: "${stablePreferences.ottPlatforms.join(', ')}"
- Their previous feedback history (use this to infer deeper taste patterns): ${JSON.stringify(getStoredFeedback())}

Your task is to generate a JSON object with two main components:
1. 'identifiedItem': An object containing the details of the ${itemTypeLower} you found. This includes a 'matchScore' (an integer from 0-100) representing your calculated taste match.
2. 'justification': A concise, insightful, and personalized paragraph (max 3-4 sentences) explaining WHY the user might like or dislike this ${itemTypeLower}. Address both positive and negative points if applicable. For example, "Given your love for fast-paced action, you'll likely enjoy the thrilling sequences. However, as someone who prefers modern films, you might find the 1980s special effects a bit dated." This justification is the MOST IMPORTANT part of your response.

Return a single, valid JSON object ONLY. Your entire response must strictly adhere to this format:
{
  "itemFound": true,
  "identifiedItem": {
    "title": "The Found ${itemType}",
    "year": 2010,
    "summary": "A brief summary of the plot.",
    "genres": ["Genre1", "Genre2"],
    "posterUrl": "https://image.tmdb.org/t/p/w500/path.jpg",
    "durationMinutes": ${recommendationType === 'series' ? 50 : 148},
    "matchScore": 88,
    "youtubeTrailerId": "trailerId123",
    "socialProofTag": "Iconic Sci-Fi Film"
  },
  "justification": "Based on your preference for mind-bending sci-fi and classic 2000s films, this is a strong match. You'll appreciate its complex narrative. However, given you prefer shorter movies, its nearly 2.5-hour runtime is something to consider."
}

CRITICAL: If you absolutely cannot identify the ${itemTypeLower} from the title "${itemTitle}", return this specific JSON object:
{
  "itemFound": false,
  "identifiedItem": null,
  "justification": "Could not identify a well-known ${itemTypeLower} with that exact title. Please check the spelling or try another title."
}
Do not add any text, comments, or markdown before or after the JSON object.`;

    try {
        const jsonStr = await callGeminiWithFallback(prompt, `taste_check_${itemTitle}`);
        
         if (!jsonStr) {
            throw new Error(`The AI returned an empty response for taste check on "${itemTitle}".`);
        }

        // Clean the response to extract JSON from markdown if present
        let cleanJsonStr = jsonStr.trim();
        
        // Remove markdown code blocks if present
        if (cleanJsonStr.startsWith('```json')) {
            cleanJsonStr = cleanJsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJsonStr.startsWith('```')) {
            cleanJsonStr = cleanJsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Remove any leading/trailing whitespace and newlines
        cleanJsonStr = cleanJsonStr.trim();

        const parsedResponse = JSON.parse(cleanJsonStr) as TasteCheckGeminiResponse;

        if (!parsedResponse.itemFound || !parsedResponse.identifiedItem) {
            return {
                itemFound: false,
                movie: null,
                justification: parsedResponse.justification || `Could not find "${itemTitle}".`,
                error: parsedResponse.justification
            };
        }

        const item = parsedResponse.identifiedItem;
        const movie: Movie = {
            id: `${item.title?.toLowerCase().replace(/[^a-z0-9]/g, '')}-${item.year}`,
            title: item.title || 'Unknown Title',
            year: item.year || 0,
            summary: item.summary || 'No summary available.',
            genres: item.genres || [],
            posterUrl: item.posterUrl || undefined,
            durationMinutes: item.durationMinutes || undefined,
            matchScore: item.matchScore || undefined,
            youtubeTrailerId: item.youtubeTrailerId || undefined,
            socialProofTag: item.socialProofTag || undefined,
        };

        return {
            itemFound: true,
            movie: movie,
            justification: parsedResponse.justification,
        };

    } catch (error: any) {
        console.error(`Error performing taste check for "${itemTitle}":`, error);
         if (error instanceof SyntaxError) {
            return { itemFound: false, movie: null, justification: null, error: `The AI returned an invalid response for "${itemTitle}". Please try again.` };
        }
        return { itemFound: false, movie: null, justification: null, error: error.message || "An unknown error occurred during the taste check." };
    }
};
