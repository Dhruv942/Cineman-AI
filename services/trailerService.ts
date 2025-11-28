/**
 * Service to fetch movie trailer links using Perplexity API
 */

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
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

  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
  const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

  if (!PERPLEXITY_API_KEY) {
    console.error("❌ [TrailerService] Perplexity API key is not configured");
    return null;
  }

  console.log(
    "🔑 [TrailerService] Using Perplexity API Key:",
    PERPLEXITY_API_KEY.substring(0, 10) + "..."
  );

  console.log("✅ [TrailerService] API Key configured");

  const prompt = `Find the official YouTube trailer link for the movie "${title}" released in ${year}. 
Return ONLY the complete YouTube URL (full link). Do NOT return just the video ID.
Required format: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
If you find multiple trailers, return the official one. Always return the full URL, not just the ID.`;

  console.log("📝 [TrailerService] Prompt:", prompt);

  const requestBody = {
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that finds YouTube trailer links for movies and TV shows. ALWAYS return the complete YouTube URL (full link like https://www.youtube.com/watch?v=VIDEO_ID), never return just the video ID. The URL must be complete and ready to use.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 200,
  };

  console.log("📤 [TrailerService] Sending request to Perplexity API...");
  console.log(
    "📤 [TrailerService] Request body:",
    JSON.stringify(requestBody, null, 2)
  );

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
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
      console.error("❌ [TrailerService] Perplexity API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const data: PerplexityResponse = await response.json();
    console.log(
      "📥 [TrailerService] Full Perplexity response:",
      JSON.stringify(data, null, 2)
    );

    if (!data.choices || data.choices.length === 0) {
      console.error("❌ [TrailerService] No choices in Perplexity response");
      return null;
    }

    const content = data.choices[0].message.content;
    console.log("📄 [TrailerService] Perplexity content:", content);

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
      "❌ [TrailerService] Error fetching trailer from Perplexity:",
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
