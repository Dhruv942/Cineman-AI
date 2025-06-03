import { GoogleGenAI } from "@google/genai";
import type { UserPreferences, Movie, GeminiMovieRecommendation, AppSettings, MovieFeedback as AppMovieFeedbackType } from '../types'; // Added AppMovieFeedbackType
import { MOVIE_LANGUAGES, MOVIE_ERAS, MOVIE_DURATIONS, CINE_SUGGEST_MOVIE_FEEDBACK_KEY, CINE_SUGGEST_APP_SETTINGS_KEY } from '../constants';

export interface MovieTitleSuggestion {
  title: string;
  year: number;
}

const API_KEY ='AIzaSyAiHRKTElZSZjrRA80audcZw5nZpbC_fDM';

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables. Movie recommendations will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); 

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
  return 3; // Default number of recommendations
}


function constructPrompt(preferences: UserPreferences): string {
  const numberOfRecommendations = getNumberOfRecommendationsSetting();
  let prompt = `You are a helpful and enthusiastic movie recommendation expert.
Based on the following user preferences, suggest ${numberOfRecommendations} unique movies.

User Preferences:`;
  if (preferences.genres.length > 0) {
    prompt += `\n- Preferred Genres: ${preferences.genres.join(', ')}`;
  }

  if (preferences.excludedGenres && preferences.excludedGenres.length > 0) {
    prompt += `\n- CRITICALLY EXCLUDE movies that are PRIMARILY of the following genres: ${preferences.excludedGenres.join(', ')}. If a movie has multiple genres and one is on this exclusion list, but the movie strongly aligns with other specified preferences and non-excluded genres, it might still be acceptable in rare cases. However, generally avoid suggesting movies whose main genre falls into this exclusion list. This is a strong negative preference.`;
  }

  if (preferences.mood) {
    prompt += `\n- Mood/Vibe: "${preferences.mood}"`;
  }

  if (preferences.movieFrequency) {
    prompt += `\n- How often they watch movies: "${preferences.movieFrequency}"`;
    if (preferences.movieFrequency === "Daily" || preferences.movieFrequency === "A few times a week") {
      prompt += ` (This user watches movies very frequently, so they may have already seen many mainstream hits. Prioritize lesser-known gems, critically acclaimed indie films, or very recent releases they might not have encountered yet. Also, ensure these suggestions align with their other stated preferences.)`;
    } else if (preferences.movieFrequency === "A few times a month" || preferences.movieFrequency === "Rarely") {
      prompt += ` (This user watches movies less frequently, so well-known blockbusters or critically acclaimed popular films that match their other preferences are excellent suggestions. You can also include some hidden gems if they are a strong match.)`;
    } else if (preferences.movieFrequency === "Once a week") {
      prompt += ` (This user watches movies regularly. Aim for a mix of popular choices and some interesting, perhaps slightly less mainstream, options that fit their profile.)`;
    }
  }

  if (preferences.actorDirectorPreference && preferences.actorDirectorPreference !== "No Preference") {
    prompt += `\n- Preference for known actors/directors: "${preferences.actorDirectorPreference}"`;
  }

  if (preferences.preferredLanguages && preferences.preferredLanguages.length > 0 && !preferences.preferredLanguages.includes('any')) {
     const languageNames = preferences.preferredLanguages.map(code => MOVIE_LANGUAGES.find(l => l.code === code)?.name || code);
    prompt += `\n- Preferred movie language(s): "${languageNames.join(', ')}" (If a movie perfectly matches other criteria but is not in these languages, you can still suggest it but note the language clearly).`;
  } else {
    prompt += `\n- Preferred movie language(s): Any language is acceptable. Actively seek out highly-rated and relevant films from diverse global film industries, including but not limited to English, Hindi, Spanish, Korean, Japanese, French cinema, etc., provided they strongly align with the user's other preferences (genres, mood, keywords, era, feedback history). Do not overly bias towards English-language films if compelling non-English options fit the user's profile.`;
  }

   if (preferences.ottPlatforms.length > 0) {
    prompt += `\n- CRITICAL: Preferred Streaming Platforms: ${preferences.ottPlatforms.join(', ')}. It is EXTREMELY IMPORTANT to try and find movies available on these platforms. The 'availabilityNote' field MUST clearly state this if a movie is found on one of these platforms (e.g., 'Available on Netflix', 'Check Disney+ or Amazon Prime Video'). If a perfect movie match isn't on these platforms, you can suggest it but clearly state it might be 'Available for rent/purchase' or 'Check other streaming services'. Prioritize accuracy for user-specified platforms. Give specific platform names in the note.`;
  } else {
    prompt += `\n- Preferred Streaming Platforms: None specified. Provide general availability notes (e.g., 'Available on major streaming services', 'Check for rental/purchase options').`
  }

  if (preferences.keywords) {
    prompt += `\n- Specific Keywords: "${preferences.keywords}"`;
  }

  if (preferences.era && preferences.era.length > 0) {
    if (preferences.era.includes(MOVIE_ERAS[0]) || preferences.era.length === 0) { // MOVIE_ERAS[0] is "Any"
      prompt += `\n- Movie Era: Prioritize movies from the 2020s. The user selected 'Any' or did not specify, indicating openness to other eras but with a slight preference for recent films.`;
    } else {
      prompt += `\n- Movie Era(s): ${preferences.era.join(', ')}`;
    }
  } else { 
     prompt += `\n- Movie Era: Prioritize movies from the 2020s. The user selected 'Any' or did not specify, indicating openness to other eras but with a slight preference for recent films.`;
  }

  if (preferences.movieDuration && preferences.movieDuration.length > 0) {
    if (preferences.movieDuration.includes(MOVIE_DURATIONS[0]) || preferences.movieDuration.length === 0) { // MOVIE_DURATIONS[0] is "Any"
       prompt += `\n- Preferred Movie Duration: Any duration is fine.`;
    } else {
      prompt += `\n- Preferred Movie Duration(s): "${preferences.movieDuration.join(', ')}". Interpret these as follows: "Short" means roughly under 90 minutes, "Medium" means 90-120 minutes, "Long" means over 120 minutes. Aim to match one of these duration preferences closely.`;
    }
  } else { 
    prompt += `\n- Preferred Movie Duration: Any duration is fine.`;
  }


  const feedbackHistory = getStoredFeedback();
  if (feedbackHistory.length > 0) {
    prompt += `\n\nUser's Past Movie Feedback History (Use this HEAVILY to refine suggestions and understand their taste better):`;
    feedbackHistory.forEach(fb => {
      prompt += `\n- Title: "${fb.title}", Year: ${fb.year}, Feedback: "${fb.feedback}"`;
      if (fb.feedback === "Loved it!") {
        prompt += " (Strongly positive signal. Find more movies with similar elements: genre, plot style, actors, director, tone, themes, etc.)";
      } else if (fb.feedback === "Liked it") {
        prompt += " (Moderately positive. Consider elements from this movie.)";
      } else if (fb.feedback === "Not my vibe") {
        prompt += " (Strong negative signal. AVOID movies with similar primary characteristics, themes, or styles.)";
      }
    });
    prompt += `\n\nCRITICAL EXCLUSION: DO NOT recommend any of the movies listed above in the 'User's Past Movie Feedback History' again in your new suggestions. The user has already rated these. Focus on finding *new* movies for the user based on their preferences and feedback patterns.`;
  }


  prompt += `

For each movie, provide the following details. Include a 'matchScore' (an integer from 0 to 100) indicating how well this movie aligns with ALL provided user preferences and feedback history. A higher score means a better match based on the user's overall profile.

Return ONLY a VALID JSON array of objects.
Each object in the array MUST represent a movie and ADHERE STRICTLY to this example format (using actual data, not descriptions):
{
  "title": "The Matrix",
  "year": 1999,
  "summary": "A computer hacker learns about the true nature of his reality and his role in the war against its controllers. This film is a mind-bending sci-fi action classic.",
  "genres": ["Action", "Sci-Fi"],
  "similarTo": "Blade Runner",
  "tmdbId": "603",
  "availabilityNote": "Likely on Netflix",
  "posterUrl": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  "durationMinutes": 136,
  "matchScore": 92 
}

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT (Failure to comply will make the output unusable):
- Your ENTIRE response MUST be ONLY the JSON array. Do not include ANY text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON array.
- Within each JSON object, after any property's value (e.g., after \`92\` in \`"matchScore": 92\`), there MUST be either a comma \`,\` (if more properties follow) or a closing curly brace \`}\` (if it's the last property). NO OTHER TEXT, WORDS, OR COMMENTS ARE ALLOWED IN THAT SPECIFIC POSITION.
- Ensure all string values within the JSON are correctly escaped (e.g., quotes within summaries must be escaped like \\").
- Do NOT insert any extraneous text, dialogue, or commentary between JSON objects, within any string values, or after any field. The JSON output must be absolutely pure and directly parsable.
- Provide ${numberOfRecommendations} movie recommendations. The 'availabilityNote' is very important; if a user specified OTT platforms, try hard to list movies available there and mention the platform name in the note.
- The 'matchScore' MUST be an integer between 0 and 100.
- If you cannot find movies for very specific or conflicting preferences, provide an empty array [] or fewer than ${numberOfRecommendations} recommendations, but still ensure the output is a valid JSON array with NO OTHER TEXT OR COMMENTS, whatsoever.
`;
  return prompt;
}

const parseAndTransformMovies = (jsonStr: string): Movie[] => {
  let cleanedJsonStr = jsonStr.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedJsonStr.match(fenceRegex);
  if (match && match[1]) {
    cleanedJsonStr = match[1].trim();
  }

  if (!cleanedJsonStr) {
    console.warn("Received empty string for movie JSON parsing.");
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


export const getMovieRecommendations = async (preferences: UserPreferences): Promise<Movie[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
  }
  
  const prompt = constructPrompt(preferences);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5, 
        topP: 0.95,
        topK: 40,
      }
    });
    
    if (typeof response.text !== 'string') {
      console.warn("Gemini response for recommendations did not have a valid 'text' property:", JSON.stringify(response, null, 2));
      throw new Error("AI response was malformed (no text).");
    }
    
    const initialMovies = parseAndTransformMovies(response.text);
      
    const allFeedback = getStoredFeedback();
    const ratedMovieIds = new Set(
      allFeedback.map(fb => `${fb.title.toLowerCase().replace(/[^a-z0-9]/g, '')}${fb.year}`)
    );

    const filteredMovies = initialMovies.filter(movie => {
      return !ratedMovieIds.has(movie.id!); 
    });
    
    return filteredMovies;

  } catch (error) {
    console.error("Error fetching recommendations from Gemini:", error);
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
    }
    throw new Error("Failed to get recommendations from AI. There might be an issue with the service, your query, or safety filters.");
  }
};

function constructSimilarMoviePrompt(movieTitle: string): string {
  return `You are a helpful movie database expert.
The user is searching for a movie similar to "${movieTitle}".
Your task is to identify the most likely movie the user is thinking of, or a very close well-known alternative if the input is ambiguous or very obscure.
Then, provide details for THIS ONE MOVIE in the specified JSON format.

Return ONLY a VALID JSON object (NOT an array) representing the movie.
The object MUST ADHERE STRICTLY to this example format (using actual data for the found movie):
{
  "title": "The Dark Knight",
  "year": 2008,
  "summary": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
  "genres": ["Action", "Crime", "Drama", "Thriller"],
  "similarTo": "Batman Begins", 
  "tmdbId": "155",
  "availabilityNote": "Available on HBO Max (Max)",
  "posterUrl": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "durationMinutes": 152,
  "matchScore": null 
}

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT:
- Your ENTIRE response MUST be ONLY the JSON object. No text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON object.
- Ensure all string values are correctly escaped.
- If you cannot confidently identify a single movie match for "${movieTitle}", return a JSON object with null values for all fields, e.g., {"title": null, "year": null, ... , "durationMinutes": null, "matchScore": null}. DO NOT return an error message or explanatory text.
- The 'similarTo' field for this specific request can be a movie that this found movie is itself similar to, or null if not applicable.
- The 'matchScore' field should be null for this specific type of request.
`;
}

export const findSimilarMovieByName = async (movieTitle: string): Promise<Movie | null> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  if (!movieTitle.trim()) {
    return null; 
  }

  const prompt = constructSimilarMoviePrompt(movieTitle);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, 
        topP: 0.9,
        topK: 30,
        thinkingConfig: { thinkingBudget: 0 } // Added for potential speed up
      }
    });

    if (typeof response.text !== 'string') {
      console.warn("Gemini response for similar movie did not have a valid 'text' property:", JSON.stringify(response, null, 2));
      throw new Error("AI response was malformed (no text).");
    }

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
     if (!jsonStr) {
        console.warn("Gemini response text for similar movie was empty after trimming. Original text (if any):", response.text);
        throw new Error("AI response for similar movie was empty after processing.");
    }


    try {
      const parsedData: GeminiMovieRecommendation = JSON.parse(jsonStr);

      if (parsedData.title === null && parsedData.year === null) {
        return null; 
      }
      
      const title = parsedData.title || "Unknown Title";
      const year = typeof parsedData.year === 'number' ? parsedData.year : 0;

      return {
        id: `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}${year}`, 
        title: title,
        year: year,
        summary: parsedData.summary || "No summary available.",
        genres: Array.isArray(parsedData.genres) ? parsedData.genres.filter(g => typeof g === 'string') : ["Unknown Genre"],
        similarTo: (typeof parsedData.similarTo === 'string' && parsedData.similarTo.trim()) ? parsedData.similarTo.trim() : undefined,
        tmdbId: (typeof parsedData.tmdbId === 'string' && parsedData.tmdbId.trim()) ? parsedData.tmdbId.trim() : undefined,
        availabilityNote: (typeof parsedData.availabilityNote === 'string' && parsedData.availabilityNote.trim()) ? parsedData.availabilityNote.trim() : undefined,
        posterUrl: (typeof parsedData.posterUrl === 'string' && parsedData.posterUrl.trim()) ? parsedData.posterUrl.trim() : undefined,
        durationMinutes: typeof parsedData.durationMinutes === 'number' ? parsedData.durationMinutes : undefined,
      };

    } catch (parseError) {
      console.error("Failed to parse JSON for similar movie:", parseError);
      console.error("Received string for parsing (similar movie):", jsonStr);
      throw new Error("AI's response for similar movie was not valid JSON.");
    }

  } catch (error) {
    console.error("Error fetching similar movie from Gemini:", error);
     if (error instanceof Error && error.message.includes("Candidate was blocked due to SAFETY")) {
      throw new Error("The request to find a similar movie was blocked due to safety concerns.");
    }
    throw new Error("Failed to get similar movie from AI.");
  }
};

export const getMovieTitleSuggestions = async (query: string): Promise<MovieTitleSuggestion[]> => {
  if (!API_KEY) {
    return []; 
  }
  if (!query.trim()) {
    return [];
  }

  const prompt = `You are an autocomplete suggestion service for movie titles. Given the user's partial query: "${query}", provide up to 5 movie title suggestions that closely match or complete this query. For each suggestion, include the movie title and its release year.

Return ONLY a VALID JSON array of objects.
Each object in the array MUST represent a movie suggestion and ADHERE STRICTLY to this example format:
[
  { "title": "Inception", "year": 2010 },
  { "title": "Inception: The Cobol Job", "year": 2010 }
]

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT:
- Your ENTIRE response MUST be ONLY the JSON array. Do not include ANY text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON array.
- Ensure all string values within the JSON are correctly escaped.
- If no suggestions are found for "${query}", return an empty JSON array []. DO NOT return an error message or explanatory text.
`;

  try {
    const genAIResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-04-17", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2, 
        topP: 0.8,
        topK: 10,
        thinkingConfig: { thinkingBudget: 0 } // Added to potentially speed up response
      }
    });

    if (typeof genAIResponse.text !== 'string') {
      console.warn("Gemini response for title suggestions did not have a valid 'text' property. Full response object:", JSON.stringify(genAIResponse, null, 2));
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
        console.warn("Gemini response text for title suggestions was empty after trimming. Original text (if any):", genAIResponse.text);
        return [];
    }

    const parsedSuggestions: MovieTitleSuggestion[] = JSON.parse(jsonStr);
    if (!Array.isArray(parsedSuggestions)) {
        console.error("Gemini title suggestions response is not an array:", parsedSuggestions);
        return [];
    }
    return parsedSuggestions.filter(
        s => typeof s.title === 'string' && typeof s.year === 'number'
    ).slice(0, 5); 

  } catch (error) {
    console.error("Error fetching movie title suggestions from Gemini:", error);
    if (error instanceof Error) {
        console.error("Error details: Name -", error.name, "Message -", error.message, "Stack -", error.stack);
    }
    return [];
  }
};


function constructMoreSimilarMoviesPrompt(promptQueryTitle: string, promptQueryYear: number): string {
  return `You are a helpful movie recommendation expert.
The user has found a movie they like, which is identified as "${promptQueryTitle}" (released around ${promptQueryYear}), and they want to see more movies like it.
Suggest exactly 3 additional, unique movies that are highly similar and relevant to "${promptQueryTitle}" (from around ${promptQueryYear}).

CRITICAL AND ABSOLUTE REQUIREMENT: These suggestions MUST ABSOLUTELY be different from the movie "${promptQueryTitle}" (year ${promptQueryYear}) itself. DO NOT, under any circumstances, suggest "${promptQueryTitle}" (year ${promptQueryYear}) again as one of the 3 similar movies. The user has already seen it or it was the basis of their search. Your list of 3 similar movies MUST NOT contain "${promptQueryTitle}" (year ${promptQueryYear}). This is paramount.

Rank them by how closely they match the style, themes, genre, and overall feel of the original movie query ("${promptQueryTitle}").

For each of these 3 movies, provide the following details. Include a 'matchScore' (an integer from 0 to 100) indicating how well this new movie suggestion aligns with the *original movie query* ("${promptQueryTitle}"). A higher score means a better similarity to the original movie query.

Return ONLY a VALID JSON array of objects.
Each object in the array MUST represent a movie and ADHERE STRICTLY to this example format (using actual data, not descriptions):
{
  "title": "Another Similar Movie Title",
  "year": 2005,
  "summary": "A compelling summary for this similar movie, highlighting its connection or resemblance to the original.",
  "genres": ["Action", "Sci-Fi", "Thriller"],
  "similarTo": "${promptQueryTitle}",
  "tmdbId": "789",
  "availabilityNote": "Check for rental or purchase",
  "posterUrl": "https://image.tmdb.org/t/p/w500/somePosterPath.jpg",
  "durationMinutes": 120,
  "matchScore": 88
}

EXTREMELY IMPORTANT INSTRUCTIONS FOR JSON OUTPUT (Failure to comply will make the output unusable):
- Your ENTIRE response MUST be ONLY the JSON array. Do not include ANY text, comments, apologies, explanations, notes, or markdown (like \`\`\`json) BEFORE or AFTER the JSON array.
- Within each JSON object, after any property's value (e.g., after \`88\` in \`"matchScore": 88\`), there MUST be either a comma \`,\` (if more properties follow) or a closing curly brace \`}\` (if it's the last property).
- Ensure all string values are correctly escaped.
- Provide exactly 3 movie recommendations, unless fewer than 3 distinct similar movies (that are NOT "${promptQueryTitle}") can be found.
- The 'matchScore' MUST reflect similarity to "${promptQueryTitle}".
- If you cannot find 3 suitable similar movies (that are distinct from "${promptQueryTitle}"), provide fewer, but ensure the output is still a valid JSON array. If no additional distinct similar movies can be found, return an empty array [].
`;
}

export const getMoreSimilarMovies = async (
  promptQueryTitle: string, 
  promptQueryYear: number, 
  idToFilterOut: string | undefined
): Promise<Movie[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }

  const prompt = constructMoreSimilarMoviesPrompt(promptQueryTitle, promptQueryYear);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6, 
        topP: 0.95,
        topK: 40,
        // Not adding thinkingBudget: 0 here for 'getMoreSimilarMovies', 
        // as quality of these suggestions is important.
      }
    });

    if (typeof response.text !== 'string') {
      console.warn("Gemini response for more similar movies did not have a valid 'text' property:", JSON.stringify(response, null, 2));
      throw new Error("AI response was malformed (no text).");
    }
    
    let movies = parseAndTransformMovies(response.text);
    
    // Additional client-side filter as a safeguard, though the prompt is now very strong.
    if (idToFilterOut) {
      movies = movies.filter(movie => movie.id !== idToFilterOut);
    }
    // Also filter by title and year as a stronger measure if id is somehow mismatched
    movies = movies.filter(movie => 
        !(movie.title.toLowerCase() === promptQueryTitle.toLowerCase() && movie.year === promptQueryYear)
    );

    return movies;

  } catch (error) {
    console.error("Error fetching more similar movies from Gemini:", error);
     if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID")) {
            throw new Error("Invalid Gemini API Key.");
        }
        if (error.message.includes("Candidate was blocked due to SAFETY")) {
            throw new Error("The request for more similar movies was blocked due to safety concerns.");
        }
         if (error.message.includes("The AI's response was not valid JSON")) {
            throw error; 
        }
    }
    throw new Error("Failed to get more similar movies from AI.");
  }
};