/**
 * Service to fetch movie trailer links using Gemini API
 */

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

/**
 * Extracts YouTube trailer URL or ID from Perplexity response text
 * @param text The response text from Perplexity
 * @returns YouTube URL or ID, or null if not found
 */
const extractYouTubeLink = (text: string): string | null => {
  console.log("🔍 [TrailerService] Extracting YouTube link from text:", text);

  // Priority 1: Try to find full YouTube URLs (prefer full URLs over just IDs)
  const fullUrlPatterns = [
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/gi,
    /https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/gi,
  ];

  console.log("🔍 [TrailerService] Trying full URL pattern matching...");
  for (let i = 0; i < fullUrlPatterns.length; i++) {
    const pattern = fullUrlPatterns[i];
    const matches = text.match(pattern);
    console.log(`  Full URL Pattern ${i + 1}:`, matches);
    if (matches && matches.length > 0) {
      // Return the full URL, not just the ID
      const fullUrl = matches[0];
      console.log("✅ [TrailerService] Found full YouTube URL:", fullUrl);
      return fullUrl;
    }
  }

  // Priority 2: Try partial URLs (without https://)
  const partialUrlPatterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/gi,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/gi,
  ];

  console.log("🔍 [TrailerService] Trying partial URL pattern matching...");
  for (let i = 0; i < partialUrlPatterns.length; i++) {
    const pattern = partialUrlPatterns[i];
    const matches = text.match(pattern);
    console.log(`  Partial URL Pattern ${i + 1}:`, matches);
    if (matches && matches.length > 0) {
      // Convert to full URL
      const partialUrl = matches[0];
      const fullUrl = partialUrl.startsWith("http")
        ? partialUrl
        : `https://www.${partialUrl}`;
      console.log(
        "✅ [TrailerService] Found and converted to full URL:",
        fullUrl
      );
      return fullUrl;
    }
  }

  // Priority 3: Try to find just a video ID (11 characters) - convert to full URL
  console.log("🔍 [TrailerService] Trying video ID pattern...");
  const videoIdPattern = /\b([a-zA-Z0-9_-]{11})\b/g;
  const videoIdMatch = text.match(videoIdPattern);
  console.log("  Video ID matches:", videoIdMatch);
  if (videoIdMatch && videoIdMatch.length > 0) {
    const videoId = videoIdMatch[0];
    const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(
      "✅ [TrailerService] Found video ID, converted to full URL:",
      fullUrl
    );
    return fullUrl;
  }

  console.log("❌ [TrailerService] No YouTube link found in text");
  return null;
};

/**
 * Fetches trailer link for a movie/series using Perplexity API
 * @param title Movie/Series title
 * @param year Release year
 * @returns YouTube trailer ID or URL, or null if not found
 */
export const getTrailerLink = async (
  title: string,
  year: number
): Promise<string | null> => {
  console.log("🎬 [TrailerService] Starting trailer fetch for:", title, year);

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  if (!GEMINI_API_KEY) {
    console.error(
      "❌ [TrailerService] Gemini API key is not configured. " +
        "Please set GEMINI_API_KEY in your environment variables."
    );
    return null;
  }

  console.log(
    "🔑 [TrailerService] Using Gemini API Key:",
    GEMINI_API_KEY.substring(0, 10) + "..."
  );

  const prompt = `Find the official YouTube trailer link for the movie "${title}" released in ${year}. 
Return ONLY the complete YouTube URL (full link). Do NOT return just the video ID.
Required format: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
If you find multiple trailers, return the official one. Always return the full URL, not just the ID.`;

  console.log("📝 [TrailerService] Prompt:", prompt);

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.2,
    },
  };

  console.log("📤 [TrailerService] Sending request to Gemini API...");
  console.log(
    "📤 [TrailerService] Request body:",
    JSON.stringify(requestBody, null, 2)
  );

  try {
    const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      "📥 [TrailerService] Response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [TrailerService] Gemini API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const data: GeminiResponse = await response.json();
    console.log(
      "📥 [TrailerService] Full Gemini response:",
      JSON.stringify(data, null, 2)
    );

    if (!data.candidates || data.candidates.length === 0) {
      console.error("❌ [TrailerService] No candidates in Gemini response");
      return null;
    }

    const content = data.candidates[0].content?.parts?.[0]?.text;
    if (!content) {
      console.error("❌ [TrailerService] No content text in Gemini response");
      return null;
    }
    console.log("📄 [TrailerService] Gemini content:", content);

    const trailerLink = extractYouTubeLink(content);

    if (trailerLink) {
      console.log(
        `✅ [TrailerService] SUCCESS - Found trailer for ${title} (${year}):`,
        trailerLink
      );
      return trailerLink;
    }

    console.warn(
      `⚠️ [TrailerService] Could not extract YouTube link from Perplexity response for ${title}`
    );
    console.warn("⚠️ [TrailerService] Full response content was:", content);
    return null;
  } catch (error) {
    console.error(
      "❌ [TrailerService] Error fetching trailer from Gemini:",
      error
    );
    if (error instanceof Error) {
      console.error("❌ [TrailerService] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
};

/**
 * Caches trailer links to avoid repeated API calls
 */
const trailerCache = new Map<string, string | null>();

/**
 * Gets trailer link with caching
 * @param title Movie/Series title
 * @param year Release year
 * @returns YouTube trailer ID or URL, or null if not found
 */
export const getTrailerLinkCached = async (
  title: string,
  year: number
): Promise<string | null> => {
  const cacheKey = `${title.toLowerCase().trim()}-${year}`;
  console.log("💾 [TrailerService] Cache key:", cacheKey);

  // Check cache first
  if (trailerCache.has(cacheKey)) {
    const cached = trailerCache.get(cacheKey);
    console.log("💾 [TrailerService] Cache HIT for:", cacheKey, "->", cached);
    return cached!;
  }

  console.log(
    "💾 [TrailerService] Cache MISS for:",
    cacheKey,
    "- Fetching from API..."
  );

  // Fetch from API
  const trailerLink = await getTrailerLink(title, year);

  // Cache the result (even if null to avoid repeated failed requests)
  trailerCache.set(cacheKey, trailerLink);
  console.log(
    "💾 [TrailerService] Cached result for:",
    cacheKey,
    "->",
    trailerLink
  );

  return trailerLink;
};
