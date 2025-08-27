import { GoogleGenAI } from "@google/genai";
import type { UserPreferences, Movie, GeminiMovieRecommendation, AppSettings, MovieFeedback as AppMovieFeedbackType, RecommendationType, ItemTitleSuggestion as AppItemTitleSuggestion, StableUserPreferences, TasteCheckGeminiResponse, TasteCheckGeminiResponseItem, TasteCheckServiceResponse } from '../types';
import { MOVIE_LANGUAGES, MOVIE_ERAS, MOVIE_DURATIONS, SERIES_SEASON_COUNTS, CINE_SUGGEST_MOVIE_FEEDBACK_KEY, CINE_SUGGEST_APP_SETTINGS_KEY, COUNTRIES } from '../constants';

// Cache for API responses to prevent duplicate calls
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Use environment variable for API key
const API_KEY = process.env.GEMINI_API_KEY;

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

// Available models with fallback order
const AVAILABLE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash", 
  "gemini-1.5-pro",
  "gemini-1.0-pro"
];

// Track current model index
let currentModelIndex = 0;

// Get current model
function getCurrentModel(): string {
  return AVAILABLE_MODELS[currentModelIndex];
}

// Switch to next available model
function switchToNextModel(): string {
  currentModelIndex = (currentModelIndex + 1) % AVAILABLE_MODELS.length;
  const newModel = getCurrentModel();
  console.log(`🔄 Switched to model: ${newModel}`);
  return newModel;
}

// Reset to first model (internal function)

// Cache management functions
export const clearCache = () => {
  responseCache.clear();
  console.log("API response cache cleared");
};

export const getCacheStats = () => {
  const validEntries = Array.from(responseCache.values()).filter(entry => isCacheValid(entry));
  const expiredEntries = Array.from(responseCache.values()).filter(entry => !isCacheValid(entry));
  
  // Clean up expired entries
  for (const [key, entry] of responseCache.entries()) {
    if (!isCacheValid(entry)) {
      responseCache.delete(key);
    }
  }
  
  return {
    totalEntries: responseCache.size,
    validEntries: validEntries.length,
    expiredEntries: expiredEntries.length
  };
};

// Model management functions
export const getCurrentModelInfo = () => {
  return {
    currentModel: getCurrentModel(),
    currentIndex: currentModelIndex,
    totalModels: AVAILABLE_MODELS.length,
    availableModels: [...AVAILABLE_MODELS]
  };
};

export const manuallySwitchModel = (modelIndex: number) => {
  if (modelIndex >= 0 && modelIndex < AVAILABLE_MODELS.length) {
    currentModelIndex = modelIndex;
    console.log(`🔄 Manually switched to model: ${getCurrentModel()}`);
    return getCurrentModel();
  } else {
    console.error(`Invalid model index: ${modelIndex}. Available: 0-${AVAILABLE_MODELS.length - 1}`);
    return null;
  }
};

export const resetToFirstModel = () => {
  currentModelIndex = 0;
  console.log(`🔄 Reset to first model: ${getCurrentModel()}`);
};

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables. Movie recommendations will not work.");
  console.error("Please create a .env file in your project root with: GEMINI_API_KEY=your_api_key_here");
} else {
  console.log("API Key loaded successfully:", API_KEY.substring(0, 10) + "...");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Helper function to generate cache key
function generateCacheKey(prompt: string, config: any): string {
  return btoa(prompt + JSON.stringify(config));
}

// Helper function to check if cache entry is valid
function isCacheValid(cacheEntry: { data: any; timestamp: number; ttl: number }): boolean {
  return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
}

// Helper function to call Gemini API with caching and automatic model fallback
async function callGeminiAPIWithCache(prompt: string, config: any = {}): Promise<any> {
  const cacheKey = generateCacheKey(prompt, config);
  
  // Check cache first
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && isCacheValid(cachedResponse)) {
    console.log("Using cached response for:", cacheKey.substring(0, 50) + "...");
    return cachedResponse.data;
  }

  // Try with current model and fallback to others if needed
  const maxRetries = AVAILABLE_MODELS.length;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentModel = getCurrentModel();
    
    try {
      console.log(`🚀 Attempting API call with model: ${currentModel} (attempt ${attempt + 1}/${maxRetries})`);
      
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          ...config
        }
      });
      
      // Cache the response
      responseCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      console.log(`✅ API call successful with ${currentModel}, cached for 10 minutes`);
      return response;
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ Failed with ${currentModel}:`, error instanceof Error ? error.message : String(error));
      
      // Check if it's a quota/resource error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errorMessage.includes('429') || 
                          errorMessage.includes('RESOURCE_EXHAUSTED') || 
                          errorMessage.includes('Quota exceeded') ||
                          errorMessage.includes('rate limit');
      
      if (isQuotaError && attempt < maxRetries - 1) {
        // Switch to next model for quota issues
        switchToNextModel();
        console.log(`🔄 Retrying with next model due to quota issue...`);
      } else if (attempt < maxRetries - 1) {
        // For other errors, also try next model
        switchToNextModel();
        console.log(`🔄 Retrying with next model due to error...`);
      }
    }
  }

  // All models failed
  console.error("❌ All models failed. Last error:", lastError);
  throw lastError;
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

For each ${itemType}, provide the following details. Include a 'matchScore' (an integer from 0 to 100) indicating how well this ${itemType} aligns with ALL provided user preferences and feedback history. A higher score means a better match based on the user's overall profile.
For series, 'durationMinutes' can represent the average episode length; if not applicable or varies wildly, it can be omitted or set to null by you.

Return ONLY a VALID JSON array of objects.
Each object in the array MUST represent a ${itemType} and ADHERE STRICTLY to this example format (using actual data, not descriptions):
{
  "title": "${recommendationType === 'series' ? 'The Crown' : 'The Matrix'}", 
  "year": ${recommendationType === 'series' ? 2016 : 1999},
  "summary": "${recommendationType === 'series' ? 'Follows the political rivalries and romance of Queen Elizabeth IIs reign and the events that shaped the second half of the twentieth century.' : 'A computer hacker learns about the true nature of his reality and his role in the war against its controllers. This film is a mind-bending sci-fi action classic.'}",
  "genres": ["${recommendationType === 'series' ? 'Drama' : 'History'}", "${recommendationType === 'series' ? 'History' : 'Sci-Fi'}"],
  "similarTo": "${recommendationType === 'series' ? 'Victoria' : 'Blade Runner'}",
  "tmdbId": "${recommendationType === 'series' ? '63247' : '603'}",
  "availabilityNote": "Likely on Netflix",
  "posterUrl": "https://image.tmdb.org/t/p/w500/${recommendationType === 'series' ? '1MPK1s6Q5S1eO3WsoKk2tBsVTo.jpg' : 'f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'}",
  "durationMinutes": ${recommendationType === 'series' ? 58 : 136},
  "matchScore": 92 
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
      id: `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`,
      title: title,
      year: year,
      summary: summary,
      genres: genres,
      similarTo: (typeof item.similarTo === 'string' && item.similarTo.trim()) ? item.similarTo.trim() : undefined,
      tmdbId: (typeof item.tmdbId === 'string' && item.tmdbId.trim()) ? item.tmdbId.trim() : undefined,
      availabilityNote: (typeof item.availabilityNote === 'string' && item.availabilityNote.trim()) ? item.availabilityNote.trim() : undefined,
      posterUrl: (typeof item.posterUrl === 'string' && item.posterUrl.trim()) ? item.posterUrl.trim() : undefined,
      durationMinutes: durationMinutes,
      matchScore: matchScore,
    };
  }).filter(movie => movie.title !== "Unknown Title" || movie.year !== 0 || movie.summary !== "No summary available." );
};


export const getMovieRecommendations = async (preferences: UserPreferences, recommendationType: RecommendationType, sessionExcludedItems: Movie[] = []): Promise<Movie[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
  }
  
  const numToDisplay = getNumberOfRecommendationsSetting();
  const numToFetch = numToDisplay + 3; // Fetch extras for the buffer
  const prompt = constructPrompt(preferences, recommendationType, sessionExcludedItems, numToFetch);

  try {
    const response = await callGeminiAPIWithCache(prompt, {
      temperature: 0.5, 
      topP: 0.95,
      topK: 40,
    });
    
    if (typeof response.text !== 'string') {
      console.warn("Gemini response for recommendations did not have a valid 'text' property:", JSON.stringify(response, null, 2));
      throw new Error("AI response was malformed (no text).");
    }
    
    const initialItems = parseAndTransformItems(response.text);
      
    const allFeedback = getStoredFeedback();
    const ratedItemIds = new Set(
      allFeedback.map(fb => `${fb.title.toLowerCase().replace(/[^a-z0-9]/g, '')}${fb.year}`)
    );

    const filteredItems = initialItems.filter(item => {
      return !ratedItemIds.has(item.id!); 
    });
    
    return filteredItems;

  } catch (error) {
    console.error(`Error fetching ${recommendationType} recommendations from Gemini:`, error);
    console.error("Full error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID")) {
            throw new Error("Invalid Gemini API Key. Please check your API_KEY environment variable.");
        }
        if (error.message.includes("Candidate was blocked due to SAFETY")) {
            throw new Error("The request was blocked due to safety concerns. Please try modifying your preferences.");
        }
        if (error.message.includes("The AI's response was not valid JSON")) {
            throw error; 
        }
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('Quota exceeded')) {
            throw new Error("API rate limit exceeded. Please try again in a few minutes.");
        }
    }
    throw new Error(`Failed to get ${recommendationType} recommendations from AI. There might be an issue with the service, your query, or safety filters.`);
  }
};

export const getSingleReplacementRecommendation = async (preferences: UserPreferences, recommendationType: RecommendationType, excludedItems: Movie[]): Promise<Movie | null> => {
  if (!API_KEY) {
    return null;
  }

  const prompt = constructPrompt(preferences, recommendationType, excludedItems, 1);
  const itemTypeString = recommendationType === 'series' ? 'series' : 'movie';

  try {
    const response = await callGeminiAPIWithCache(prompt, {
      temperature: 0.7,
      topP: 0.95,
      topK: 50,
    });

    if (typeof response.text !== 'string') {
      console.warn(`Gemini response for single replacement did not have a valid 'text' property.`);
      return null;
    }
    
    const items = parseAndTransformItems(response.text);

    if (items.length > 0) {
      return items[0];
    }
    return null;

  } catch (error) {
    console.error(`Error fetching single replacement ${itemTypeString} from Gemini:`, error);
    return null;
  }
};

function constructSimilarItemPrompt(itemTitle: string, recommendationType: RecommendationType, userPreferences: StableUserPreferences): string {
  const itemType = recommendationType === 'series' ? 'TV series' : 'movie';
  const pluralItemType = recommendationType === 'series' ? 'series' : 'movies';
  const exampleTitle = recommendationType === 'series' ? 'Dark' : 'Equilibrium';
  const exampleYear = recommendationType === 'series' ? 2017 : 2002;
  const exampleSummary = recommendationType === 'series' 
    ? "A family saga with a supernatural twist, set in a German town..."
    : "In a dystopian future, a law enforcement officer questions his society's emotion-suppressing drug regimen.";
  const exampleGenres = recommendationType === 'series' ? ["Mystery", "Drama", "Sci-Fi"] : ["Action", "Sci-Fi", "Thriller"];
  const exampleTmdbId = recommendationType === 'series' ? '70523' : '7299';
  const exampleAvailability = recommendationType === 'series' ? 'Available on Netflix' : 'Available for rent/purchase';
  const examplePosterUrl = recommendationType === 'series' ? 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5AXCRnAEZL.jpg' : 'https://image.tmdb.org/t/p/w500/nothing.jpg';
  const exampleDuration = recommendationType === 'series' ? 50 : 107;
  const exampleMatchScore = 85;

  let prompt = `You are a helpful ${itemType} database expert.
The user is searching for a ${itemType} called "${itemTitle}".
Your primary task is to suggest ONE DIFFERENT ${itemType} that is highly similar in genre, theme, or style to "${itemTitle}".
CRITICALLY, the suggested ${itemType} MUST NOT BE "${itemTitle}" itself, even if "${itemTitle}" is a well-known ${itemType}. You are finding a close alternative or recommendation based on it.

Consider the User's General Viewing Habits to refine the suggestion:
- Watches ${pluralItemType}: "${userPreferences.movieFrequency}"
- Prefers known actors/directors: "${userPreferences.actorDirectorPreference}"
- Preferred Eras: ${userPreferences.era.join(', ')}
- Preferred Languages: ${userPreferences.preferredLanguages.map(l => MOVIE_LANGUAGES.find(ml => ml.code === l)?.name || l).join(', ')}
- User's Country: ${COUNTRIES.find(c => c.code === userPreferences.country)?.name || userPreferences.country}
- Preferred OTT Platforms: ${userPreferences.ottPlatforms.length > 0 ? userPreferences.ottPlatforms.join(', ') : 'None specified'}

Based on these habits, if the user is a frequent watcher (e.g., "Daily", "A few times a week") and "${itemTitle}" is mainstream, lean towards less common but still highly similar alternatives. If they prefer specific languages or eras, try to align the suggestion if possible while maintaining strong similarity to "${itemTitle}". If they specified OTT platforms, try to suggest something available on those.
`;

  const feedbackHistory = getStoredFeedback();
  if (feedbackHistory.length > 0) {
    prompt += `\nUser's Past Feedback (Avoid re-suggesting these and learn from patterns for the new suggestion):`;
    feedbackHistory.forEach(fb => {
      prompt += `\n- Title: "${fb.title}", Year: ${fb.year}, Feedback: "${fb.feedback}"`;
    });
    prompt += `\nCRITICALLY, DO NOT suggest any ${itemType} from this feedback history as your new suggestion.`;
  }
  
  prompt += `

If you can only think of "${itemTitle}" or cannot find a suitable *different but similar* ${itemType} that also considers the user's habits and feedback, you must return a JSON object with null values for all fields as specified below.

Return ONLY a VALID JSON object (NOT an array) representing the single similar ${itemType} you found.
The object MUST ADHERE STRICTLY to this example format (using actual data for the found ${itemType}):
{
  "title": "${exampleTitle}", 
  "year": ${exampleYear},    
  "summary": "${exampleSummary}",
  "genres": ${JSON.stringify(exampleGenres)},
  "similarTo": "${itemTitle}", 
  "tmdbId": "${exampleTmdbId}",
  "availabilityNote": "${exampleAvailability}",
  "posterUrl": "${examplePosterUrl}",
  "durationMinutes": ${exampleDuration},
  "matchScore": ${exampleMatchScore}
}

The 'matchScore' field (0-100) should represent how *similar* the suggested ${itemType} is to the original query "${itemTitle}" AND how well it aligns with the provided User's General Viewing Habits and implicit preferences from feedback. If returning nulls because no suitable *different* ${itemType} is found, matchScore should also be null.

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT:
- Your ENTIRE response MUST be ONLY the JSON object. No text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON object.
- Ensure all string values are correctly escaped.
- If you cannot confidently identify a single ${itemType} that is DIFFERENT from but SIMILAR to "${itemTitle}" (considering user habits), return a JSON object with null values for all fields (e.g., {"title": null, "year": null, ..., "similarTo": "${itemTitle}", ..., "matchScore": null}). Even in the null case, 'similarTo' should still be the original query. DO NOT return an error message or explanatory text.
- The 'similarTo' field MUST be the original search query: "${itemTitle}". This is crucial.
`;
  return prompt;
}

export const findSimilarItemByName = async (itemTitle: string, recommendationType: RecommendationType, userPreferences: StableUserPreferences): Promise<Movie | null> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  if (!itemTitle.trim()) {
    return null; 
  }

  const prompt = constructSimilarItemPrompt(itemTitle, recommendationType, userPreferences);
  const itemTypeString = recommendationType === 'series' ? 'series' : 'movie';

  try {
    const response = await callGeminiAPIWithCache(prompt, {
      temperature: 0.4, 
      topP: 0.95,
      topK: 40,
    });

    if (typeof response.text !== 'string') {
      console.warn(`Gemini response for similar ${itemTypeString} did not have a valid 'text' property:`, JSON.stringify(response, null, 2));
      throw new Error(`AI response for similar ${itemTypeString} was malformed (no text).`);
    }

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
     if (!jsonStr) {
        console.warn(`Gemini response text for similar ${itemTypeString} was empty after trimming. Original text (if any):`, response.text);
        throw new Error(`AI response for similar ${itemTypeString} was empty after processing.`);
    }

    try {
      const parsedData: GeminiMovieRecommendation = JSON.parse(jsonStr);

      if (parsedData.title === null && parsedData.year === null) {
        return null; 
      }
      
      const title = parsedData.title || "Unknown Title";
      const year = typeof parsedData.year === 'number' ? parsedData.year : 0;
      const matchScore = typeof parsedData.matchScore === 'number' && parsedData.matchScore >= 0 && parsedData.matchScore <= 100 ? parsedData.matchScore : undefined;

      // Check if the suggested item has already been rated by the user
      const allFeedback = getStoredFeedback();
      const suggestedItemId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`;
      const isAlreadyRated = allFeedback.some(fb => fb.id === suggestedItemId);

      if (isAlreadyRated) {
        console.warn(`AI suggested an item ("${title}", ${year}) in findSimilarItemByName that the user has already rated. Returning null.`);
        return null;
      }

      // Check if AI returned the same item as the query (it shouldn't based on prompt, but as a safeguard)
      if (title.toLowerCase() === itemTitle.toLowerCase()) {
          console.warn(`AI returned the same item ("${title}") as query in findSimilarItemByName. Attempting to treat as no distinct similar item found.`);
          return null;
      }

      return {
        id: suggestedItemId, 
        title: title,
        year: year,
        summary: parsedData.summary || "No summary available.",
        genres: Array.isArray(parsedData.genres) ? parsedData.genres.filter(g => typeof g === 'string') : ["Unknown Genre"],
        similarTo: (typeof parsedData.similarTo === 'string' && parsedData.similarTo.trim()) ? parsedData.similarTo.trim() : undefined,
        tmdbId: (typeof parsedData.tmdbId === 'string' && parsedData.tmdbId.trim()) ? parsedData.tmdbId.trim() : undefined,
        availabilityNote: (typeof parsedData.availabilityNote === 'string' && parsedData.availabilityNote.trim()) ? parsedData.availabilityNote.trim() : undefined,
        posterUrl: (typeof parsedData.posterUrl === 'string' && parsedData.posterUrl.trim()) ? parsedData.posterUrl.trim() : undefined,
        durationMinutes: typeof parsedData.durationMinutes === 'number' ? parsedData.durationMinutes : undefined,
        matchScore: matchScore,
      };

    } catch (parseError) {
      console.error(`Failed to parse JSON for similar ${itemTypeString}:`, parseError);
      console.error(`Received string for parsing (similar ${itemTypeString}):`, jsonStr);
      throw new Error(`AI's response for similar ${itemTypeString} was not valid JSON.`);
    }

  } catch (error) {
    console.error(`Error fetching similar ${itemTypeString} from Gemini:`, error);
     if (error instanceof Error && error.message.includes("Candidate was blocked due to SAFETY")) {
      throw new Error(`The request to find a similar ${itemTypeString} was blocked due to safety concerns.`);
    }
    throw new Error(`Failed to get similar ${itemTypeString} from AI.`);
  }
};

export const getItemTitleSuggestions = async (query: string, recommendationType: RecommendationType): Promise<AppItemTitleSuggestion[]> => {
  if (!API_KEY) {
    return []; 
  }
  if (!query.trim()) {
    return [];
  }
  const itemTypeString = recommendationType === 'series' ? 'TV series' : 'movie';
  const exampleTitle1 = recommendationType === 'series' ? 'Game of Thrones' : 'Inception';
  const exampleYear1 = recommendationType === 'series' ? 2011 : 2010;
  const exampleTitle2 = recommendationType === 'series' ? 'Game of Thrones: The Last Watch' : 'Inception: The Cobol Job';
  const exampleYear2 = recommendationType === 'series' ? 2019 : 2010;


  const prompt = `You are an autocomplete suggestion service for ${itemTypeString} titles. Given the user's partial query: "${query}", provide up to 5 ${itemTypeString} title suggestions that closely match or complete this query. For each suggestion, include the ${itemTypeString} title and its release year.

Return ONLY a VALID JSON array of objects.
Each object in the array MUST represent a ${itemTypeString} suggestion and ADHERE STRICTLY to this example format:
[
  { "title": "${exampleTitle1}", "year": ${exampleYear1} },
  { "title": "${exampleTitle2}", "year": ${exampleYear2} }
]

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT:
- Your ENTIRE response MUST be ONLY the JSON array. Do not include ANY text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON array.
- Ensure all string values within the JSON are correctly escaped.
- If no suggestions are found for "${query}", return an empty JSON array []. DO NOT return an error message or explanatory text.
`;

  try {
    const genAIResponse = await callGeminiAPIWithCache(prompt, {
      temperature: 0.2, 
      topP: 0.8,
      topK: 10,
    });

    if (typeof genAIResponse.text !== 'string') {
      console.warn(`Gemini response for ${itemTypeString} title suggestions did not have a valid 'text' property. Full response object:`, JSON.stringify(genAIResponse, null, 2));
      if (genAIResponse.candidates && genAIResponse.candidates.length > 0) {
        const candidate = genAIResponse.candidates[0];
        console.warn(`Suggestion Candidate details: Finish Reason: ${candidate.finishReason}, Safety Ratings: ${JSON.stringify(candidate.safetyRatings)}`);
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
           console.warn("Suggestion Candidate content or parts are missing.");
        }
      } else if (genAIResponse.promptFeedback) {
        console.warn(`Suggestion Prompt Feedback: ${JSON.stringify(genAIResponse.promptFeedback)}`);
      } else {
        console.warn("No candidates or promptFeedback found in the suggestions response.");
      }
      return []; 
    }

    let jsonStr = genAIResponse.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    
    if (!jsonStr) {
        console.warn(`Gemini response text for ${itemTypeString} title suggestions was empty after trimming. Original text (if any):`, genAIResponse.text);
        return [];
    }

    const parsedSuggestions: AppItemTitleSuggestion[] = JSON.parse(jsonStr);
    if (!Array.isArray(parsedSuggestions)) {
        console.error(`Gemini ${itemTypeString} title suggestions response is not an array:`, parsedSuggestions);
        return [];
    }
    return parsedSuggestions.filter(
        s => typeof s.title === 'string' && typeof s.year === 'number'
    ).slice(0, 5); 

  } catch (error) {
    const baseErrorMessage = `Error fetching ${itemTypeString} title suggestions for query "${query}" from Gemini:`;

    if (error instanceof Error && (error.message.includes('429') || error.message.toUpperCase().includes('RESOURCE_EXHAUSTED'))) {
      console.warn(`${baseErrorMessage} API quota likely exceeded (429). Autosuggestions may be temporarily unavailable. Error: ${error.message}`);
    } else {
      console.error(baseErrorMessage, error);
    }
    if (error instanceof Error) {
        console.error("Full error details (suggestions): Name -", error.name, ", Message -", error.message); 
    } else {
        console.error("Non-Error object thrown during getItemTitleSuggestions:", error);
    }
    return [];
  }
};


function constructMoreSimilarItemsPrompt(promptQueryTitle: string, promptQueryYear: number, recommendationType: RecommendationType, userPreferences: StableUserPreferences): string {
  const itemType = recommendationType === 'series' ? 'TV series' : 'movie';
  const pluralItemType = recommendationType === 'series' ? 'series' : 'movies';
  const exampleTitle = recommendationType === 'series' ? 'Dark' : 'Another Similar Movie Title';
  const exampleYear = recommendationType === 'series' ? 2017 : 2005;
  const exampleSummary = recommendationType === 'series' 
    ? 'A family saga with a supernatural twist, set in a German town, where the disappearance of two young children exposes the relationships among four families.'
    : 'A compelling summary for this similar movie, highlighting its connection or resemblance to the original.';
  const exampleGenres = recommendationType === 'series' ? ["Mystery", "Drama", "Sci-Fi"] : ["Action", "Sci-Fi", "Thriller"];
  const exampleTmdbId = recommendationType === 'series' ? '70523' : '789';
  const examplePosterUrl = recommendationType === 'series' ? 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5AXCRnAEZL.jpg' : 'https://image.tmdb.org/t/p/w500/somePosterPath.jpg';
  const exampleDuration = recommendationType === 'series' ? 60 : 120;
  const exampleMatchScore = recommendationType === 'series' ? 90 : 88;

  let prompt = `You are a helpful ${itemType} recommendation expert.
The user has found a ${itemType} they like, which is identified as "${promptQueryTitle}" (released around ${promptQueryYear}), and they want to see more ${pluralItemType} like it.
Suggest exactly 3 additional, unique ${pluralItemType} that are highly similar and relevant to "${promptQueryTitle}" (from around ${promptQueryYear}).

CRITICAL AND ABSOLUTE REQUIREMENT: These suggestions MUST ABSOLUTELY be different from the ${itemType} "${promptQueryTitle}" (year ${promptQueryYear}) itself. DO NOT, under any circumstances, suggest "${promptQueryTitle}" (year ${promptQueryYear}) again as one of the 3 similar ${pluralItemType}. The user has already seen it or it was the basis of their search. Your list of 3 similar ${pluralItemType} MUST NOT contain "${promptQueryTitle}" (year ${promptQueryYear}). This is paramount.

Consider the User's General Viewing Habits to refine these 3 suggestions:
- Watches ${pluralItemType}: "${userPreferences.movieFrequency}"
- Prefers known actors/directors: "${userPreferences.actorDirectorPreference}"
- Preferred Eras: ${userPreferences.era.join(', ')}
- Preferred Languages: ${userPreferences.preferredLanguages.map(l => MOVIE_LANGUAGES.find(ml => ml.code === l)?.name || l).join(', ')}
- User's Country: ${COUNTRIES.find(c => c.code === userPreferences.country)?.name || userPreferences.country}
- Preferred OTT Platforms: ${userPreferences.ottPlatforms.length > 0 ? userPreferences.ottPlatforms.join(', ') : 'None specified'}

Based on these habits, if the user is a frequent watcher (e.g., "Daily", "A few times a week") and "${promptQueryTitle}" is mainstream, lean towards less common but still highly similar alternatives. If they prefer specific languages or eras, try to align the suggestions if possible. If they specified OTT platforms, try to suggest items available on those.
`;

  const feedbackHistory = getStoredFeedback();
  if (feedbackHistory.length > 0) {
    prompt += `\nUser's Past Feedback (Avoid re-suggesting these and learn from patterns for the new suggestions):`;
    feedbackHistory.forEach(fb => {
      prompt += `\n- Title: "${fb.title}", Year: ${fb.year}, Feedback: "${fb.feedback}"`;
    });
    prompt += `\nCRITICALLY, DO NOT suggest any ${pluralItemType} from this feedback history as your new suggestions.`;
  }

  prompt += `

Rank them by how closely they match the style, themes, genre, and overall feel of the original ${itemType} query ("${promptQueryTitle}"), while also considering the user's habits.

For each of these 3 ${pluralItemType}, provide the following details. Include a 'matchScore' (an integer from 0 to 100) indicating how well this new ${itemType} suggestion aligns with the *original ${itemType} query* ("${promptQueryTitle}") AND the user's general viewing habits. A higher score means a better similarity and relevance.

Return ONLY a VALID JSON array of objects.
Each object in the array MUST represent a ${itemType} and ADHERE STRICTLY to this example format (using actual data, not descriptions):
{
  "title": "${exampleTitle}",
  "year": ${exampleYear},
  "summary": "${exampleSummary}",
  "genres": ${JSON.stringify(exampleGenres)},
  "similarTo": "${promptQueryTitle}",
  "tmdbId": "${exampleTmdbId}",
  "availabilityNote": "Check for rental or purchase",
  "posterUrl": "${examplePosterUrl}",
  "durationMinutes": ${exampleDuration},
  "matchScore": ${exampleMatchScore}
}

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT (Failure to comply will make the output unusable):
- Your ENTIRE response MUST be ONLY the JSON array. Do not include ANY text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON array.
- Within each JSON object, after any property's value (e.g., after \`88\` in \`"matchScore": 88\`), there MUST be either a comma \`,\` (if more properties follow) or a closing curly brace \`}\` (if it's the last property).
- Ensure all string values are correctly escaped.
- Provide exactly 3 ${itemType} recommendations, unless fewer than 3 distinct similar ${pluralItemType} (that are NOT "${promptQueryTitle}") can be found.
- The 'matchScore' MUST reflect similarity to "${promptQueryTitle}" and relevance based on user habits.
- If you cannot find 3 suitable similar ${pluralItemType} (that are distinct from "${promptQueryTitle}"), provide fewer, but ensure the output is still a valid JSON array. If no additional distinct similar ${pluralItemType} can be found, return an empty array [].
`;
  return prompt;
}

export const getMoreSimilarItems = async (
  promptQueryTitle: string, 
  promptQueryYear: number, 
  recommendationType: RecommendationType,
  idToFilterOut: string | undefined,
  userPreferences: StableUserPreferences
): Promise<Movie[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }

  const prompt = constructMoreSimilarItemsPrompt(promptQueryTitle, promptQueryYear, recommendationType, userPreferences);
  const itemTypeString = recommendationType === 'series' ? 'series' : 'movie';


  try {
    const response = await callGeminiAPIWithCache(prompt, {
      temperature: 0.6, 
      topP: 0.95,
      topK: 40,
    });

    if (typeof response.text !== 'string') {
      console.warn(`Gemini response for more similar ${itemTypeString}s did not have a valid 'text' property:`, JSON.stringify(response, null, 2));
      throw new Error(`AI response for more similar ${itemTypeString}s was malformed (no text).`);
    }
    
    let items = parseAndTransformItems(response.text);
    
    // Filter out the initial item that was the basis for this "more similar" search, if its ID was passed
    if (idToFilterOut) {
      items = items.filter(item => item.id !== idToFilterOut);
    }
    // Also, ensure the original query title/year is not in the results
    items = items.filter(item => 
        !(item.title.toLowerCase() === promptQueryTitle.toLowerCase() && item.year === promptQueryYear)
    );

    // Filter out any items the user has provided feedback for
    const feedbackHistory = getStoredFeedback();
    const ratedItemIds = new Set(
      feedbackHistory.map(fb => `${fb.title.toLowerCase().replace(/[^a-z0-9]/g, '')}${fb.year}`)
    );
     items = items.filter(item => !ratedItemIds.has(item.id!));
    

    return items;

  } catch (error) {
    console.error(`Error fetching more similar ${itemTypeString}s from Gemini:`, error);
     if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID")) {
            throw new Error("Invalid Gemini API Key.");
        }
        if (error.message.includes("Candidate was blocked due to SAFETY")) {
            throw new Error(`The request for more similar ${itemTypeString}s was blocked due to safety concerns.`);
        }
         if (error.message.includes("The AI's response was not valid JSON")) {
            throw error; 
        }
    }
    throw new Error(`Failed to get more similar ${itemTypeString}s from AI.`);
  }
};


function constructTasteCheckPrompt(itemTitle: string, recommendationType: RecommendationType, userPreferences: StableUserPreferences): string {
  const itemType = recommendationType === 'series' ? 'TV series' : 'movie';
  const pluralItemType = recommendationType === 'series' ? 'series' : 'movies';

  let prompt = `You are a helpful ${itemType} taste analysis expert.
The user wants to know if they will like a specific ${itemType} titled "${itemTitle}".

Your tasks are:
1.  Identify the ${itemType}: Find the specific ${itemType} named "${itemTitle}". If you cannot uniquely identify it, or if it doesn't seem to exist, indicate this clearly.
2.  If found, analyze it against the User's General Viewing Habits and Feedback History (provided below).
3.  Determine a "matchScore" (0-100) representing how well this specific ${itemType} ("${itemTitle}") aligns with the user's taste profile. A higher score means a better potential match for the user.
4.  Provide a concise "justification" explaining the matchScore, highlighting aspects of "${itemTitle}" that align (or clash) with the user's preferences.

User's General Viewing Habits:
- Watches ${pluralItemType}: "${userPreferences.movieFrequency}"
- Prefers known actors/directors: "${userPreferences.actorDirectorPreference}"
- Preferred Eras: ${userPreferences.era.join(', ')}
- Preferred Languages: ${userPreferences.preferredLanguages.map(l => MOVIE_LANGUAGES.find(ml => ml.code === l)?.name || l).join(', ')} (Consider if "${itemTitle}" fits this)
- User's Country: ${COUNTRIES.find(c => c.code === userPreferences.country)?.name || userPreferences.country}
- Preferred OTT Platforms: ${userPreferences.ottPlatforms.length > 0 ? userPreferences.ottPlatforms.join(', ') : 'None specified'} (Note if "${itemTitle}" is likely on these)
- Preferred Movie Duration: ${userPreferences.movieDuration.join(', ')} (if ${itemType} is a movie)
- Preferred Series Seasons: ${userPreferences.preferredNumberOfSeasons.join(', ')} (if ${itemType} is a series)
`;

  const feedbackHistory = getStoredFeedback();
  if (feedbackHistory.length > 0) {
    prompt += `\nUser's Past ${itemTypeStringUpperSingular(recommendationType)} Feedback History (CRUCIAL for taste analysis):`;
    feedbackHistory.forEach(fb => {
      prompt += `\n- Title: "${fb.title}", Year: ${fb.year}, Feedback: "${fb.feedback}" (Use this to understand their likes/dislikes patterns)`;
    });
  }

  prompt += `

Return ONLY a VALID JSON object (NOT an array).
The JSON object MUST ADHERE STRICTLY to this example format.

If the ${itemType} "${itemTitle}" is found and analyzed:
{
  "itemFound": true,
  "identifiedItem": {
    "title": "Actual Title of Found Item",
    "year": 2020,
    "summary": "A brief, engaging summary of the found item.",
    "genres": ["Genre1", "Genre2"],
    "posterUrl": "https://image.tmdb.org/t/p/w500/optionalPoster.jpg", // Optional
    "durationMinutes": 123, // Optional, average episode length for series
    "matchScore": 88 // Integer 0-100, user's taste match for this item
  },
  "justification": "You'll likely enjoy this because it shares themes with [Loved Movie X] and fits your preferred [Genre Y]. However, its length might be a slight concern given your preference for shorter content."
}

If the ${itemType} "${itemTitle}" CANNOT be confidently identified or found:
{
  "itemFound": false,
  "identifiedItem": null,
  "justification": "Could not find a distinct ${itemType} named '${itemTitle}'. Please check the spelling or try a more specific title."
}

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT:
- Your ENTIRE response MUST be ONLY the JSON object. No text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON object.
- The 'matchScore' in 'identifiedItem' MUST be an integer between 0 and 100, representing the user's taste match for THIS specific item.
- If 'itemFound' is false, 'identifiedItem' MUST be null, and 'justification' should explain why it wasn't found.
- Ensure all string values are correctly escaped.
`;
  return prompt;
}

const transformTasteCheckItemToMovie = (item: TasteCheckGeminiResponseItem | null): Movie | null => {
  if (!item) return null;

  const title = item.title || "Unknown Title";
  const year = typeof item.year === 'number' ? item.year : 0;
  const summary = item.summary || "No summary available.";
  const genres = Array.isArray(item.genres) ? item.genres.filter(g => typeof g === 'string') : ["Unknown Genre"];
  const posterUrl = (typeof item.posterUrl === 'string' && item.posterUrl.trim()) ? item.posterUrl.trim() : undefined;
  const durationMinutes = typeof item.durationMinutes === 'number' ? item.durationMinutes : undefined;
  const matchScore = typeof item.matchScore === 'number' && item.matchScore >= 0 && item.matchScore <= 100 ? item.matchScore : undefined;
  
  if (title === "Unknown Title" && year === 0 && summary === "No summary available.") {
    return null; // Don't return a completely empty movie object
  }

  return {
    id: `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`,
    title,
    year,
    summary,
    genres,
    posterUrl,
    durationMinutes,
    matchScore,
    // Other Movie fields like similarTo, tmdbId, availabilityNote are not directly part of TasteCheckGeminiResponseItem
    // and would typically be undefined here unless the prompt/response for taste check is expanded.
  };
};

export const checkTasteMatch = async (itemTitle: string, recommendationType: RecommendationType, userPreferences: StableUserPreferences): Promise<TasteCheckServiceResponse> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  if (!itemTitle.trim()) {
    return { itemFound: false, movie: null, justification: "Please enter a title to check.", error: "Empty title." };
  }

  const prompt = constructTasteCheckPrompt(itemTitle, recommendationType, userPreferences);

  try {
    const response = await callGeminiAPIWithCache(prompt, {
      temperature: 0.3, 
      topP: 0.9,
      topK: 30,
    });

    if (typeof response.text !== 'string') {
       console.warn(`Gemini response for taste check on "${itemTitle}" did not have a valid 'text' property:`, JSON.stringify(response, null, 2));
      return { itemFound: false, movie: null, justification: `AI response was malformed for "${itemTitle}".`, error: "AI response malformed (no text)." };
    }
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const matchJson = jsonStr.match(fenceRegex);
    if (matchJson && matchJson[1]) {
      jsonStr = matchJson[1].trim();
    }

    if (!jsonStr) {
        console.warn(`Gemini response text for taste check on "${itemTitle}" was empty after trimming. Original text:`, response.text);
        return { itemFound: false, movie: null, justification: `AI response was empty for "${itemTitle}".`, error: "AI response empty." };
    }
    
    const parsedData: TasteCheckGeminiResponse = JSON.parse(jsonStr);

    if (!parsedData.itemFound || !parsedData.identifiedItem) {
      return {
        itemFound: false,
        movie: null,
        justification: parsedData.justification || `Could not find or analyze "${itemTitle}".`,
      };
    }

    const movie = transformTasteCheckItemToMovie(parsedData.identifiedItem);
    
    if (!movie) { // If transform returns null (e.g., all fields were null from Gemini)
      return {
        itemFound: false, 
        movie: null,
        justification: parsedData.justification || `Could not sufficiently identify details for "${itemTitle}".`,
        error: `Identified item for "${itemTitle}" lacked necessary details.`
      };
    }

    return {
      itemFound: true,
      movie: movie,
      justification: parsedData.justification,
    };

  } catch (error) {
    console.error(`Error during taste check for "${itemTitle}":`, error);
    let errorMessage = `Failed to perform taste check for "${itemTitle}".`;
    if (error instanceof Error) {
      if (error.message.includes("API_KEY_INVALID")) {
        errorMessage = "Invalid Gemini API Key.";
      } else if (error.message.includes("Candidate was blocked due to SAFETY")) {
        errorMessage = `The taste check request for "${itemTitle}" was blocked due to safety concerns.`;
      } else if (error.message.toLowerCase().includes("json")) {
        errorMessage = `AI's response for taste check on "${itemTitle}" was not valid JSON.`;
      } else {
        errorMessage = error.message;
      }
    }
    return {
      itemFound: false,
      movie: null,
      justification: null,
      error: errorMessage,
    };
  }
};