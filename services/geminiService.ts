declare const chrome: any;
import type {
  UserPreferences,
  Movie,
  GeminiMovieRecommendation,
  AppSettings,
  MovieFeedback as AppMovieFeedbackType,
  RecommendationType,
  ItemTitleSuggestion as AppItemTitleSuggestion,
  StableUserPreferences,
  TasteCheckGeminiResponse,
  TasteCheckGeminiResponseItem,
  TasteCheckServiceResponse,
} from "../types";
import {
  MOVIE_LANGUAGES,
  MOVIE_ERAS,
  MOVIE_DURATIONS,
  SERIES_SEASON_COUNTS,
  CINE_SUGGEST_APP_SETTINGS_KEY,
  COUNTRIES,
  CINE_SUGGEST_STABLE_PREFERENCES_KEY,
  CINE_SUGGEST_MOVIE_FEEDBACK_KEY,
  CINE_SUGGEST_USER_LANGUAGE_KEY,
  SUPPORTED_TRANSLATION_LANGUAGES,
} from "../constants";
import { getAllFeedback } from "./feedbackService";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Helper function to call Perplexity API
 */
const callPerplexityAPI = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<string> => {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY is not configured.");
  }

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: PerplexityResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from Perplexity API");
  }

  return data.choices[0].message.content;
};

const getCurrentLanguageInfo = (): { code: string; name: string } => {
  const langCode = localStorage.getItem(CINE_SUGGEST_USER_LANGUAGE_KEY) || "en";
  const lang = SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === langCode);
  return {
    code: langCode,
    name: lang ? lang.name.split(" ")[0] : "English",
  };
};

export const getStablePreferencesAndFeedback = async (): Promise<{
  stablePreferences: StableUserPreferences;
  feedbackHistory: AppMovieFeedbackType[];
}> => {
  return new Promise((resolve) => {
    const keys = [
      CINE_SUGGEST_STABLE_PREFERENCES_KEY,
      CINE_SUGGEST_MOVIE_FEEDBACK_KEY,
    ];
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(keys, (result: any) => {
        const stablePreferences =
          result[CINE_SUGGEST_STABLE_PREFERENCES_KEY] || {};
        const feedbackHistory = result[CINE_SUGGEST_MOVIE_FEEDBACK_KEY] || [];
        resolve({ stablePreferences, feedbackHistory });
      });
    } else {
      // Fallback for non-extension environment
      const stablePreferences = JSON.parse(
        localStorage.getItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY) || "{}"
      );
      const feedbackHistory = JSON.parse(
        localStorage.getItem(CINE_SUGGEST_MOVIE_FEEDBACK_KEY) || "[]"
      );
      resolve({ stablePreferences, feedbackHistory });
    }
  });
};

export const getNumberOfRecommendationsSetting = async (): Promise<number> => {
  return new Promise((resolve) => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(
        [CINE_SUGGEST_APP_SETTINGS_KEY],
        (result: any) => {
          const settings = result[CINE_SUGGEST_APP_SETTINGS_KEY];
          if (
            settings &&
            typeof settings.numberOfRecommendations === "number" &&
            settings.numberOfRecommendations >= 1 &&
            settings.numberOfRecommendations <= 10
          ) {
            resolve(settings.numberOfRecommendations);
          } else {
            resolve(6);
          }
        }
      );
    } else {
      const settingsString = localStorage.getItem(
        CINE_SUGGEST_APP_SETTINGS_KEY
      );
      if (settingsString) {
        try {
          const settings = JSON.parse(settingsString) as AppSettings;
          if (
            settings &&
            typeof settings.numberOfRecommendations === "number"
          ) {
            resolve(settings.numberOfRecommendations);
            return;
          }
        } catch {}
      }
      resolve(6);
    }
  });
};

export const getNumberOfSimilarItemsSetting = async (): Promise<number> => {
  return new Promise((resolve) => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(
        [CINE_SUGGEST_APP_SETTINGS_KEY],
        (result: any) => {
          const settings = result[CINE_SUGGEST_APP_SETTINGS_KEY];
          if (
            settings &&
            typeof settings.numberOfSimilarItems === "number" &&
            settings.numberOfSimilarItems >= 1 &&
            settings.numberOfSimilarItems <= 6
          ) {
            resolve(settings.numberOfSimilarItems);
          } else {
            resolve(3);
          }
        }
      );
    } else {
      const settingsString = localStorage.getItem(
        CINE_SUGGEST_APP_SETTINGS_KEY
      );
      if (settingsString) {
        try {
          const settings = JSON.parse(settingsString) as AppSettings;
          if (settings && typeof settings.numberOfSimilarItems === "number") {
            resolve(settings.numberOfSimilarItems);
            return;
          }
        } catch {}
      }
      resolve(3);
    }
  });
};

function constructPrompt(
  preferences: UserPreferences,
  recommendationType: RecommendationType,
  feedbackHistory: AppMovieFeedbackType[],
  sessionExcludedItems: Movie[] = [],
  numberOfRecommendations: number
): string {
  const itemType = recommendationType === "series" ? "TV series" : "movie";
  const pluralItemType = recommendationType === "series" ? "series" : "movies";
  const importedHistory = feedbackHistory.filter((f) =>
    f.source?.includes("import")
  );
  const languageInfo = getCurrentLanguageInfo();

  let prompt = `You are a world-class ${itemType} recommendation expert AI. Your primary goal is to provide high-quality, personalized recommendations that make users excited to come back for more.
Based on the user's detailed taste profile and current request, suggest ${numberOfRecommendations} unique ${pluralItemType}.

---
**Core Directives & Quality Mandates**

1.  **Language for Response (CRITICAL):** The user's preferred language is **${languageInfo.name} (${languageInfo.code})**. All user-facing text fields in your JSON response (specifically 'summary', 'availabilityNote', 'socialProofTag', and 'justification' if applicable) MUST be in **${languageInfo.name}**.
    -   **CRITICAL EXCEPTION:** Do NOT translate the actual movie/series titles in the 'title' and 'similarTo' fields. These must remain in their original language.

2.  **Availability Accuracy (Highest Priority):** The user's primary concern is accurate streaming availability.
    -   For the 'availabilityNote', be as specific as possible. Differentiate between 'Included with [Service]', 'Available to rent/buy on [Service]', or 'Available with the [Channel] channel on [Service]'. Also identify and report if a title is "Currently unavailable" on a service.
    -   If a country is specified, your 'availabilityNote' MUST reflect known services in that country. Do not guess. If uncertain, state "May be available for rent or purchase." (in ${languageInfo.name}).
    -   If OTT platforms are listed, prioritize finding titles on those platforms within the specified country.

3.  **Prioritize 'Included' Content (User Experience Priority):** The user strongly prefers content that is included with a streaming subscription over content that requires a separate rental, purchase, or is "Currently unavailable".
    -   When selecting recommendations, give significant preference to titles available on the user's specified OTT platforms (or widely available platforms if none are specified) as part of a subscription.
    -   If a recommendation is primarily available only for rent/purchase, or is listed as "Currently unavailable", you should treat this as a strong negative factor. **Reflect this by assigning a significantly lower \`matchScore\`** compared to an equally good recommendation that is available for streaming. This "deboosts" unavailable content.

4.  **Taste Profile Analysis (The Key to Retention):** Deeply analyze the user's feedback to understand their nuanced taste.
    -   **"Loved" Items:** These are the strongest positive signals. Identify the underlying DNA (themes, directing style, narrative structure, specific actors/directors) and find titles that share it. These suggestions should be your top priority.
    -   **"Liked" & Imported Items:** These form the user's broader taste profile. Use them to understand general genre and tonal preferences.
    -   **"Disliked" Items:** These are strong negative signals. Actively avoid titles with similar characteristics (e.g., if they dislike slow-burn dramas, avoid them even if the genre matches).
    -   **Infer Patterns:** Don't just list the feedback. Synthesize it. For example: "The user loves complex sci-fi like 'Blade Runner 2049' but dislikes generic action films. They seem to prefer narrative depth over spectacle."

5.  **Creative Social Proof (CRITICAL):** The 'socialProofTag' is vital for user trust. Generate a short, exciting, Netflix-style highlight tag.
    -   **GOOD Examples:** "Critically Acclaimed", "Award-Winning", "Mind-Bending", "Suspenseful", "Cult Classic", "Fan Favorite".
    -   **BAD Examples:** "92% on Rotten Tomatoes", "8.8/10 IMDb". Do NOT use simple ratings. Be creative.
    -   The tag must be in **${languageInfo.name}**.
    -   **Avoid suggesting items with a Google User score below 80%** unless it's a perfect niche match.

---
**User Taste Profile**
`;

  if (feedbackHistory.length > 0) {
    const lovedItems = feedbackHistory
      .filter((f) => f.feedback === "Loved it!")
      .map((f) => `"${f.title} (${f.year})"`)
      .join(", ");
    const likedItems = feedbackHistory
      .filter((f) => f.feedback === "Liked it")
      .map((f) => `"${f.title} (${f.year})"`)
      .join(", ");
    const dislikedItems = feedbackHistory
      .filter((f) => f.feedback === "Not my vibe")
      .map((f) => `"${f.title} (${f.year})"`)
      .join(", ");

    if (lovedItems)
      prompt += `\n- **LOVED (High Priority Signal):** ${lovedItems}`;
    if (likedItems) prompt += `\n- **LIKED (General Taste):** ${likedItems}`;
    if (importedHistory.length > 0)
      prompt += `\n- **WATCHED (Implicitly Liked):** ${importedHistory
        .map((f) => `"${f.title} (${f.year})"`)
        .join(", ")}`;
    if (dislikedItems) {
      prompt += `\n- **DISLIKED (CRITICAL - Do NOT suggest these exact titles OR similar ones):** ${dislikedItems}`;
      prompt += `\n  - **IMPORTANT:** Do NOT suggest any of these exact movies/series again. Also avoid suggesting titles with similar characteristics (genre, tone, style, themes) to these disliked items.`;
    }
  } else {
    prompt += `\n- **CRITICAL NEW USER:** This user has no feedback history. It is VITAL that these initial recommendations are high-quality, popular, and critically acclaimed to build trust. Prioritize "safe bets".`;
  }

  const country =
    COUNTRIES.find((c) => c.code === preferences.country)?.name ||
    "their country";
  prompt += `

---
**Current Search Request**

-   **Country for Availability:** ${country}.
-   **Genres (Include):** ${
    preferences.genres.length > 0 ? preferences.genres.join(", ") : "Any"
  }.
-   **Genres (Exclude):** ${
    preferences.excludedGenres && preferences.excludedGenres.length > 0
      ? preferences.excludedGenres.join(", ")
      : "None"
  }.
-   **Mood/Vibe/Plot:** ${preferences.mood || "Not specified"}.
-   **Keywords:** ${preferences.keywords || "Not specified"}.

---
**User's Stable Preferences**

-   **Viewing Frequency:** ${preferences.movieFrequency}.
-   **Actor/Director Preference:** ${preferences.actorDirectorPreference}.
-   **Languages:** ${preferences.preferredLanguages
    .map((code) => MOVIE_LANGUAGES.find((l) => l.code === code)?.name || code)
    .join(", ")}.
-   **OTT Platforms:** ${
    preferences.ottPlatforms.length > 0
      ? preferences.ottPlatforms.join(", ")
      : "Not specified"
  }.
-   **Era:** ${preferences.era.join(", ")}.
-   **Movie Duration:** ${preferences.movieDuration.join(", ")}.
-   **Series Length:** ${preferences.preferredNumberOfSeasons.join(", ")}.

---
**Exclusions & Formatting**

-   **Do NOT suggest these exact titles (CRITICAL):** ${sessionExcludedItems
    .map((m) => `"${m.title} (${m.year})"`)
    .join(", ")}.
    -   These titles must be completely excluded from your suggestions. Do not suggest them under any circumstances.
-   **Response Format:** Your response MUST be a single, valid JSON array. Each object represents one recommendation. Do not add any text, comments, or markdown before or after the JSON array.

**JSON Schema per item (REMEMBER THE LANGUAGE & AVAILABILITY RULE):**
{
  "title": "The ${itemType}'s Title (Original, NOT Translated)",
  "year": 1999,
  "summary": "A concise, engaging, spoiler-free summary in ${
    languageInfo.name
  }.",
  "genres": ["Genre1", "Genre2"],
  "similarTo": "A well-known ${itemType} it's similar to (Original Title, NOT Translated).",
  "posterUrl": "https://image.tmdb.org/t/p/w500/path.jpg",
  "youtubeTrailerId": "YouTube Video ID",
  "durationMinutes": 136,
  "availabilityNote": "SPECIFIC availability info in ${
    languageInfo.name
  }. E.g., 'Included with Prime Video'.",
  "socialProofTag": "A creative, Netflix-style social proof tag in ${
    languageInfo.name
  } (e.g., 'Critically Acclaimed', 'Award-Winning', 'Mind-Bending Thriller'). Avoid simple ratings.",
  "matchScore": 95
}
`;
  return prompt;
}

function constructSimilarItemsPrompt(
  itemTitle: string,
  recommendationType: RecommendationType,
  stablePreferences: StableUserPreferences,
  feedbackHistory: AppMovieFeedbackType[],
  numberOfRecs: number
): string {
  const itemType = recommendationType === "series" ? "TV series" : "movie";
  const pluralItemType = recommendationType === "series" ? "series" : "movies";
  const country =
    COUNTRIES.find((c) => c.code === stablePreferences.country)?.name ||
    "their country";
  const languageInfo = getCurrentLanguageInfo();

  let prompt = `You are a ${itemType} recommendation expert. A user wants to find ${pluralItemType} similar to "${itemTitle}".

Your task is to:
1. Identify the most likely ${itemType} the user is referring to as "${itemTitle}".
2. Find ${numberOfRecs} other compelling and unique ${pluralItemType} that are similar in theme, genre, tone, or style.
3. Your suggestions MUST take into account the user's general taste profile to ensure it's a good fit for them personally.
4. **CRITICAL:** The user's preferred language is **${languageInfo.name} (${
    languageInfo.code
  })**. All user-facing text fields in your JSON response ('summary', 'availabilityNote', 'socialProofTag') MUST be in **${
    languageInfo.name
  }**. Do NOT translate movie/series titles ('title', 'similarTo').
5. **CRITICAL (Availability):** For the 'availabilityNote', be as specific as possible. Differentiate between 'Included with [Service]', 'Available to rent/buy on [Service]', or 'Available with the [Channel] channel on [Service]'. Also identify and report if a title is "Currently unavailable" on a service. Deboost titles that are unavailable or only for rent/purchase by giving them a lower \`matchScore\`.
6. **Creative Social Proof (CRITICAL):** The 'socialProofTag' is vital. Generate a short, exciting, Netflix-style highlight tag in **${
    languageInfo.name
  }** (e.g., "Award-Winning", "Cult Classic"). Do NOT use simple ratings.

USER'S TASTE PROFILE:
- This user generally watches ${stablePreferences.movieFrequency}.
- They have a preference for ${
    stablePreferences.actorDirectorPreference
  } regarding known actors/directors.
- They prefer ${itemType}s from these eras: ${stablePreferences.era.join(", ")}.
- They subscribe to these streaming services: ${stablePreferences.ottPlatforms.join(
    ", "
  )}. Prioritize suggestions on these platforms if possible.
- Their preferred languages are: ${stablePreferences.preferredLanguages
    .map((code) => MOVIE_LANGUAGES.find((l) => l.code === code)?.name || code)
    .join(", ")}.
- Country for content availability: ${country}.
- Their viewing history and feedback (strongest indicator of taste):
  - Loved: ${
    feedbackHistory
      .filter((f) => f.feedback === "Loved it!")
      .map((f) => `"${f.title}"`)
      .join(", ") || "None"
  }
  - Liked: ${
    feedbackHistory
      .filter((f) => f.feedback === "Liked it")
      .map((f) => `"${f.title}"`)
      .join(", ") || "None"
  }
  - Disliked (Do NOT suggest these exact titles OR similar ones): ${
    feedbackHistory
      .filter((f) => f.feedback === "Not my vibe")
      .map((f) => `"${f.title}"`)
      .join(", ") || "None"
  }

RESPONSE FORMAT:
Your response must be a single, valid JSON array containing ${numberOfRecs} objects. Do not add any text before or after the JSON.
The 'matchScore' should reflect how well the suggestion fits both the similarity to "${itemTitle}" AND the user's personal taste profile.

Your JSON response MUST follow this exact schema per item (REMEMBER THE LANGUAGE & AVAILABILITY RULE):
{
  "title": "The Similar ${itemType}'s Title (NOT Translated)",
  "year": 2005,
  "summary": "A concise, engaging, spoiler-free summary in ${
    languageInfo.name
  }.",
  "genres": ["Genre1", "Genre2"],
  "similarTo": "${itemTitle} (NOT Translated)",
  "posterUrl": "https://image.tmdb.org/t/p/w500/path.jpg",
  "youtubeTrailerId": "YouTube Video ID",
  "durationMinutes": 115,
  "availabilityNote": "SPECIFIC availability info in ${languageInfo.name}.",
  "socialProofTag": "A creative, Netflix-style social proof tag in ${
    languageInfo.name
  } (e.g., 'Critically Acclaimed', 'Award-Winning', 'Mind-Bending Thriller'). Avoid simple ratings.",
  "matchScore": 88
}
`;
  return prompt;
}

function constructTasteCheckPrompt(
  itemTitle: string,
  recommendationType: RecommendationType,
  stablePreferences: StableUserPreferences,
  feedbackHistory: AppMovieFeedbackType[]
): string {
  const itemType = recommendationType === "series" ? "TV series" : "movie";
  const languageInfo = getCurrentLanguageInfo();

  return `You are a movie and series taste analysis expert. The user wants to know if they will like a ${itemType} titled "${itemTitle}", based on their taste profile.

First, identify the most likely ${itemType} the user is referring to.
Then, analyze this ${itemType}'s characteristics against the user's taste profile.

**CRITICAL:** The user's preferred language is **${languageInfo.name} (${
    languageInfo.code
  })**. The 'justification' and 'summary' fields in your JSON response MUST be in **${
    languageInfo.name
  }**. Do NOT translate the movie/series 'title'.

User's Taste Profile:
- General Preferences: ${JSON.stringify(stablePreferences)}
- Their previous feedback history: ${JSON.stringify(feedbackHistory)}

Your task is to generate a JSON object with three main components:
1. 'itemFound': A boolean indicating if you successfully identified the ${itemType}.
2. 'identifiedItem': An object containing details of the found ${itemType}, including a 'matchScore' (0-100).
3. 'justification': A concise, personalized paragraph (max 3-4 sentences, in **${
    languageInfo.name
  }**) explaining WHY the user might like or dislike this ${itemType}.

Return a single, valid JSON object ONLY. Your entire response must strictly adhere to this format:
{
  "itemFound": true,
  "identifiedItem": {
    "title": "The Found ${itemType} (NOT Translated)",
    "year": 2010,
    "summary": "A brief summary of the plot in ${languageInfo.name}.",
    "genres": ["Genre1", "Genre2"],
    "posterUrl": "https://image.tmdb.org/t/p/w500/path.jpg",
    "matchScore": 88
  },
  "justification": "The justification for the match score, in ${
    languageInfo.name
  }."
}

CRITICAL: If you cannot identify the ${itemType} from the title "${itemTitle}", return this specific JSON object:
{
  "itemFound": false,
  "identifiedItem": null,
  "justification": "Could not identify a well-known ${itemType} with that exact title (This message should be in ${
    languageInfo.name
  })."
}
Do not add any text, comments, or markdown before or after the JSON object.`;
}

function constructSingleReplacementPrompt(
  preferences: UserPreferences,
  recommendationType: RecommendationType,
  feedbackHistory: AppMovieFeedbackType[],
  allExcludedItems: Movie[]
): string {
  const itemType = recommendationType === "series" ? "TV series" : "movie";
  const pluralItemType = recommendationType === "series" ? "series" : "movies";
  const languageInfo = getCurrentLanguageInfo();

  let prompt = `You are a ${itemType} recommendation expert. Your task is to suggest just ONE ${itemType} based on the user's preferences.

This suggestion must be unique and NOT be one of the ${pluralItemType} listed in the exclusion list.

**CRITICAL:** The user's preferred language is **${languageInfo.name} (${
    languageInfo.code
  })**. All user-facing text fields in your JSON response ('summary', 'availabilityNote', 'socialProofTag') MUST be in **${
    languageInfo.name
  }**. Do NOT translate movie/series titles ('title', 'similarTo').
**CRITICAL (Availability):** For the 'availabilityNote', be as specific as possible. Differentiate between 'Included with [Service]', 'Available to rent/buy on [Service]', or 'Available with the [Channel] channel on [Service]'. Also identify and report if a title is "Currently unavailable" on a service. Deboost titles that are unavailable or only for rent/purchase by giving them a lower \`matchScore\`.

USER PREFERENCES: ${JSON.stringify(preferences)}
USER FEEDBACK HISTORY: ${JSON.stringify(feedbackHistory)}
EXCLUSION LIST (DO NOT SUGGEST THESE): ${allExcludedItems
    .map((m) => `"${m.title} (${m.year})"`)
    .join(", ")}

RESPONSE FORMATTING:
Your response must be a single, valid JSON object.
The 'matchScore' is a calculated integer from 0-100 indicating how well the suggestion fits the user's profile.

Your JSON response MUST follow this exact schema (REMEMBER THE LANGUAGE & AVAILABILITY RULE):
{
  "title": "The ${itemType}'s Title (NOT Translated)",
  "year": 1999,
  "summary": "A concise, engaging, spoiler-free summary in ${
    languageInfo.name
  }.",
  "genres": ["Genre1", "Genre2"],
  "similarTo": "A well-known ${itemType} it's similar to (Original Title, NOT Translated).",
  "posterUrl": "https://image.tmdb.org/t/p/w500/path.jpg",
  "youtubeTrailerId": "YouTube Video ID",
  "durationMinutes": 136,
  "availabilityNote": "SPECIFIC availability info in ${languageInfo.name}.",
  "socialProofTag": "Social proof in ${
    languageInfo.name
  } like 'Critically Acclaimed' or 'Fan Favorite', not just ratings.",
  "matchScore": 95
}

Do not add any text, comments, or markdown before or after the JSON object. Your entire response must be the JSON object itself.
`;
  return prompt;
}

function constructEnrichHistoryPrompt(titles: string[]): string {
  const prompt = `You are a film and TV series data enrichment expert. Given a list of titles, your task is to identify the most likely movie or TV series for each and return its title and year of release.
The user's list may contain extra information like "Season 1" or be slightly inaccurate. Use your knowledge to find the correct canonical title and original release year.

User's List:
${titles.join("\n")}

Return a valid JSON array ONLY, with each object following this schema:
[
  { "title": "Corrected Title 1", "year": 2020 },
  { "title": "Corrected Title 2", "year": 1999 }
]
Do not add any text before or after the JSON array.`;
  return prompt;
}

const parseAndValidateResponse = <T>(
  responseText: string,
  isArray: boolean
): T => {
  try {
    let sanitizedText = responseText.trim();
    if (sanitizedText.startsWith("```json")) {
      sanitizedText = sanitizedText.substring(7);
    }
    if (sanitizedText.endsWith("```")) {
      sanitizedText = sanitizedText.substring(0, sanitizedText.length - 3);
    }

    const parsed = JSON.parse(sanitizedText);

    if (isArray && !Array.isArray(parsed)) {
      throw new Error("Expected a JSON array but received an object.");
    }
    if (!isArray && Array.isArray(parsed)) {
      throw new Error("Expected a JSON object but received an array.");
    }

    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON response:", responseText);
    if (e instanceof Error) {
      throw new Error(`Invalid JSON response from API: ${e.message}`);
    }
    throw new Error("Received an unparsable JSON response from the API.");
  }
};

export const getMovieRecommendations = async (
  preferences: UserPreferences,
  recommendationType: RecommendationType,
  sessionExcludedItems: Movie[] = []
): Promise<Movie[]> => {
  if (!PERPLEXITY_API_KEY)
    throw new Error("PERPLEXITY_API_KEY is not configured.");

  const [feedbackHistory, numberOfRecommendations] = await Promise.all([
    getAllFeedback(),
    getNumberOfRecommendationsSetting(),
  ]);

  // Add all "Not my vibe" movies to excluded items to prevent them from appearing again
  const notMyVibeMovies: Movie[] = feedbackHistory
    .filter((f) => f.feedback === "Not my vibe")
    .map((f) => ({
      id: `${f.title.toLowerCase().replace(/[^a-z0-9]/g, "")}${f.year}`,
      title: f.title,
      year: f.year,
    }));

  const allExcludedItems = [...sessionExcludedItems, ...notMyVibeMovies];

  const prompt = constructPrompt(
    preferences,
    recommendationType,
    feedbackHistory,
    allExcludedItems,
    numberOfRecommendations + 3
  ); // Fetch more to build a buffer

  const systemPrompt = `You are a world-class movie and TV series recommendation expert AI. Your primary goal is to provide high-quality, personalized recommendations. You MUST return ONLY valid JSON - no explanations, no markdown, just the JSON array.`;

  const responseText = await callPerplexityAPI(systemPrompt, prompt, 4000);
  const rawRecommendations: GeminiMovieRecommendation[] =
    parseAndValidateResponse(responseText, true);

  // Convert to Movie objects and filter out any "Not my vibe" movies (safety check)
  const excludedIds = new Set(allExcludedItems.map((m) => m.id));
  const movies = rawRecommendations
    .map((rec) => ({
      ...rec,
      id: `${rec.title.toLowerCase().replace(/[^a-z0-9]/g, "")}${rec.year}`,
    }))
    .filter((movie) => !excludedIds.has(movie.id));

  return movies;
};

export const findSimilarItems = async (
  itemTitle: string,
  recommendationType: RecommendationType,
  stablePreferences: StableUserPreferences
): Promise<Movie[]> => {
  if (!PERPLEXITY_API_KEY)
    throw new Error("PERPLEXITY_API_KEY is not configured.");

  const [feedbackHistory, numberOfRecs] = await Promise.all([
    getAllFeedback(),
    getNumberOfSimilarItemsSetting(),
  ]);

  // Get all "Not my vibe" movies to exclude
  const notMyVibeIds = new Set(
    feedbackHistory
      .filter((f) => f.feedback === "Not my vibe")
      .map((f) => `${f.title.toLowerCase().replace(/[^a-z0-9]/g, "")}${f.year}`)
  );

  const prompt = constructSimilarItemsPrompt(
    itemTitle,
    recommendationType,
    stablePreferences,
    feedbackHistory,
    numberOfRecs
  );

  const systemPrompt = `You are a movie and TV series recommendation expert. You MUST return ONLY valid JSON array - no explanations, no markdown, just the JSON array.`;

  const responseText = await callPerplexityAPI(systemPrompt, prompt, 3000);
  const rawRecommendations: GeminiMovieRecommendation[] =
    parseAndValidateResponse(responseText, true);

  // Filter out "Not my vibe" movies
  return rawRecommendations
    .map((rec) => ({
      ...rec,
      id: `${rec.title.toLowerCase().replace(/[^a-z0-9]/g, "")}${rec.year}`,
    }))
    .filter((movie) => !notMyVibeIds.has(movie.id));
};

export const checkTasteMatch = async (
  itemTitle: string,
  recommendationType: RecommendationType,
  stablePreferences: StableUserPreferences
): Promise<TasteCheckServiceResponse> => {
  if (!PERPLEXITY_API_KEY)
    throw new Error("PERPLEXITY_API_KEY is not configured.");
  const feedbackHistory = await getAllFeedback();
  const prompt = constructTasteCheckPrompt(
    itemTitle,
    recommendationType,
    stablePreferences,
    feedbackHistory
  );

  const systemPrompt = `You are a movie and series taste analysis expert. You MUST return ONLY valid JSON object - no explanations, no markdown, just the JSON object.`;

  const responseText = await callPerplexityAPI(systemPrompt, prompt, 2000);
  const result: TasteCheckGeminiResponse = parseAndValidateResponse(
    responseText,
    false
  );

  if (!result.itemFound || !result.identifiedItem) {
    return {
      itemFound: false,
      movie: null,
      justification: null,
      error: result.justification || "Item could not be identified.",
    };
  }

  const movie: Movie = {
    id: `${result.identifiedItem.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}${result.identifiedItem.year}`,
    title: result.identifiedItem.title,
    year: result.identifiedItem.year,
    summary: result.identifiedItem.summary,
    genres: result.identifiedItem.genres,
    posterUrl: result.identifiedItem.posterUrl,
    matchScore: result.identifiedItem.matchScore,
  };

  return {
    itemFound: true,
    movie: movie,
    justification: result.justification,
  };
};

export const getSingleReplacementRecommendation = async (
  preferences: UserPreferences,
  recommendationType: RecommendationType,
  allExcludedItems: Movie[]
): Promise<Movie | null> => {
  if (!PERPLEXITY_API_KEY) {
    console.error(
      "PERPLEXITY_API_KEY not configured, cannot fetch replacement."
    );
    return null;
  }
  const feedbackHistory = await getAllFeedback();
  const prompt = constructSingleReplacementPrompt(
    preferences,
    recommendationType,
    feedbackHistory,
    allExcludedItems
  );

  try {
    const systemPrompt = `You are a movie and TV series recommendation expert. You MUST return ONLY valid JSON object - no explanations, no markdown, just the JSON object.`;
    const responseText = await callPerplexityAPI(systemPrompt, prompt, 2000);
    const rawRecommendation: GeminiMovieRecommendation =
      parseAndValidateResponse(responseText, false);
    return {
      ...rawRecommendation,
      id: `${rawRecommendation.title.toLowerCase().replace(/[^a-z0-9]/g, "")}${
        rawRecommendation.year
      }`,
    };
  } catch (error) {
    console.error("Failed to fetch single replacement recommendation:", error);
    return null;
  }
};

const autosuggestCache = new Map<string, AppItemTitleSuggestion[]>();
export const getItemTitleSuggestions = async (
  query: string,
  recommendationType: RecommendationType
): Promise<AppItemTitleSuggestion[]> => {
  if (!PERPLEXITY_API_KEY || query.length < 2) return [];

  const cacheKey = `${recommendationType}:${query}`;
  if (autosuggestCache.has(cacheKey)) {
    return autosuggestCache.get(cacheKey)!;
  }

  const itemType = recommendationType === "series" ? "TV series" : "movie";
  const prompt = `You are a movie and TV series title auto-completer. A user is typing a ${itemType} title. Based on the query "${query}", suggest up to 5 popular and relevant ${itemType} titles.

Return a valid JSON array ONLY, with each object following this schema:
[
  { "title": "Suggested Title 1", "year": 2010 },
  { "title": "Suggested Title 2", "year": 2018 }
]
Do not add any text before or after the JSON array. If you have no suggestions, return an empty array [].`;

  try {
    const systemPrompt = `You are a movie and TV series title auto-completer. You MUST return ONLY valid JSON array - no explanations, no markdown, just the JSON array.`;
    const responseText = await callPerplexityAPI(systemPrompt, prompt, 1000);
    const suggestions: AppItemTitleSuggestion[] = parseAndValidateResponse(
      responseText,
      true
    );
    autosuggestCache.set(cacheKey, suggestions); // Store in cache
    return suggestions;
  } catch (error) {
    console.error("Error fetching title suggestions:", error);
    return [];
  }
};

export const enrichViewingHistory = async (
  titles: string[]
): Promise<{ title: string; year: number }[]> => {
  if (!PERPLEXITY_API_KEY || titles.length === 0)
    return titles.map((t) => ({ title: t, year: new Date().getFullYear() }));

  const prompt = constructEnrichHistoryPrompt(titles);

  try {
    const systemPrompt = `You are a film and TV series data enrichment expert. You MUST return ONLY valid JSON array - no explanations, no markdown, just the JSON array.`;
    const responseText = await callPerplexityAPI(systemPrompt, prompt, 2000);
    const enrichedItems: { title: string; year: number }[] =
      parseAndValidateResponse(responseText, true);
    return enrichedItems;
  } catch (error) {
    console.error("Error enriching viewing history:", error);
    // Fallback to original titles if enrichment fails
    return titles.map((t) => ({ title: t, year: new Date().getFullYear() }));
  }
};
