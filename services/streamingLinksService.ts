/**
 * Service to fetch exact streaming platform links using Perplexity API
 */

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface StreamingOption {
  service: string;
  url: string;
}

/**
 * Extracts streaming platform links from Perplexity response text
 * @param text The response text from Perplexity
 * @returns Array of streaming options with service name and URL
 */
const extractStreamingLinks = (text: string): StreamingOption[] => {
  console.log(
    "🔍 [StreamingLinksService] Extracting streaming links from text:",
    text
  );

  const streamingOptions: StreamingOption[] = [];

  // First, remove all search URLs from text completely to avoid any matches
  // Remove Prime Video search URLs like: /search/ref=atv_sr_sug...
  text = text.replace(
    /https?:\/\/(?:www\.)?primevideo\.com\/search\/[^\s\)]+/gi,
    ""
  );
  // Remove any other search URLs
  text = text.replace(/https?:\/\/[^\s\)]*\/search[^\s\)]*/gi, "");
  // Remove URLs with search parameters
  text = text.replace(
    /https?:\/\/[^\s\)]*[?&](?:q=|phrase=|search)[^\s\)]*/gi,
    ""
  );

  // Netflix patterns - ONLY accept direct title links, REJECT search URLs
  const netflixTitlePattern =
    /https?:\/\/(?:www\.)?netflix\.com\/title\/(\d+)/gi;
  const netflixSearchPattern = /netflix\.com\/search/gi;

  // First check: Reject if text contains Netflix search URLs
  if (netflixSearchPattern.test(text)) {
    console.log("⚠️ [StreamingLinksService] Rejected Netflix search URL");
  }

  // Only extract direct title links
  const netflixMatches = text.match(netflixTitlePattern);
  if (netflixMatches && netflixMatches.length > 0) {
    // Filter out any matches that might be in search URLs (shouldn't happen but double-check)
    const validMatches = netflixMatches.filter(
      (url) => !url.includes("/search")
    );
    if (validMatches.length > 0) {
      const url = validMatches[0].startsWith("http")
        ? validMatches[0]
        : `https://www.${validMatches[0]}`;
      streamingOptions.push({
        service: "Netflix",
        url: url,
      });
      console.log(
        "✅ [StreamingLinksService] Found Netflix direct title link:",
        url
      );
    }
  }

  // Amazon Prime Video patterns - STRICTLY REJECT search URLs
  // Only extract direct detail/watch/dp page URLs (NOT search pages)
  const primeVideoPatterns = [
    // Direct detail/watch pages only
    /https?:\/\/(?:www\.)?primevideo\.com\/(?:detail|watch|dp)\/[^\s\)]+/gi,
    // Amazon product pages (for Prime Video content)
    /https?:\/\/(?:www\.)?amazon\.com\/[^\s\)]+(?:dp|gp\/product)\/[A-Z0-9]+[^\s\)]*/gi,
  ];

  for (const pattern of primeVideoPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Strictly filter out ANY search URLs or URLs with search parameters
      const validMatches = matches.filter((url) => {
        const urlLower = url.toLowerCase();
        return (
          !urlLower.includes("/search") &&
          !urlLower.includes("/s?") &&
          !urlLower.includes("search?q=") &&
          !urlLower.includes("phrase=") &&
          !urlLower.includes("ref=atv_sr") &&
          !urlLower.includes("prefix=") &&
          !url.match(/primevideo\.com\/search/i) &&
          !url.match(/amazon\.com.*search/i)
        );
      });
      if (validMatches.length > 0) {
        const url = validMatches[0];
        streamingOptions.push({
          service: "Prime Video",
          url: url,
        });
        console.log(
          "✅ [StreamingLinksService] Found Prime Video direct link:",
          url
        );
        break;
      }
    }
  }

  // Disney+ Hotstar patterns - REJECT search URLs
  const hotstarPatterns = [
    /https?:\/\/(?:www\.)?hotstar\.com\/[^\s\)]+/gi,
    /https?:\/\/(?:www\.)?disneyplus\.com\/[^\s\)]+/gi,
  ];

  for (const pattern of hotstarPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Filter out search URLs
      const validMatches = matches.filter(
        (url) =>
          !url.includes("/search") &&
          !url.includes("?q=") &&
          !url.includes("search?q=")
      );
      if (validMatches.length > 0) {
        const url = validMatches[0];
        const serviceName = url.includes("hotstar") ? "Hotstar" : "Disney+";
        streamingOptions.push({
          service: serviceName,
          url: url,
        });
        console.log(
          `✅ [StreamingLinksService] Found ${serviceName} direct link:`,
          url
        );
        break;
      }
    }
  }

  // Hulu patterns - REJECT search URLs
  const huluPatterns = [/https?:\/\/(?:www\.)?hulu\.com\/[^\s\)]+/gi];

  for (const pattern of huluPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Filter out search URLs
      const validMatches = matches.filter(
        (url) =>
          !url.includes("/search") &&
          !url.includes("?q=") &&
          !url.includes("search?q=")
      );
      if (validMatches.length > 0) {
        streamingOptions.push({
          service: "Hulu",
          url: validMatches[0],
        });
        console.log(
          "✅ [StreamingLinksService] Found Hulu direct link:",
          validMatches[0]
        );
        break;
      }
    }
  }

  // HBO Max patterns - REJECT search URLs
  const maxPatterns = [
    /https?:\/\/(?:www\.)?max\.com\/[^\s\)]+/gi,
    /https?:\/\/(?:www\.)?hbomax\.com\/[^\s\)]+/gi,
  ];

  for (const pattern of maxPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Filter out search URLs
      const validMatches = matches.filter(
        (url) =>
          !url.includes("/search") &&
          !url.includes("?q=") &&
          !url.includes("search?q=")
      );
      if (validMatches.length > 0) {
        streamingOptions.push({
          service: "Max",
          url: validMatches[0],
        });
        console.log(
          "✅ [StreamingLinksService] Found Max direct link:",
          validMatches[0]
        );
        break;
      }
    }
  }

  return streamingOptions;
};

/**
 * Fetches streaming platform links for a movie/series using Perplexity API
 * @param title Movie/Series title
 * @param year Release year
 * @returns Array of streaming options with service name and exact URL
 */
export const getStreamingLinks = async (
  title: string,
  year: number
): Promise<StreamingOption[]> => {
  console.log(
    "🎬 [StreamingLinksService] Starting streaming links fetch for:",
    title,
    year
  );

  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

  if (!PERPLEXITY_API_KEY) {
    console.error(
      "❌ [StreamingLinksService] Perplexity API key is not configured."
    );
    return [];
  }

  const prompt = `Find the EXACT DIRECT streaming platform links (NOT search links) for the movie "${title}" released in ${year}.

CRITICAL REQUIREMENTS:
1. For Netflix: You MUST find and return the DIRECT TITLE LINK in format: https://www.netflix.com/title/NUMERIC_ID (example: https://www.netflix.com/title/82034831)
   - DO NOT return search URLs like https://www.netflix.com/search?q=...
   - ONLY return the direct title page URL with numeric ID
   - The ID is usually 6-8 digits

2. For Amazon Prime Video: You MUST find and return the DIRECT DETAIL/WATCH PAGE URL, NOT search page
   - CORRECT Format: https://www.primevideo.com/detail/... or https://www.primevideo.com/watch/... or direct movie/show page
   - WRONG (REJECT): https://www.primevideo.com/search/... (ANY URL with "/search" in it)
   - DO NOT return URLs like: 
     * https://www.primevideo.com/search/ref=atv_sr_sug_atv_sr_hom_ss_1_5?phrase=Interstellar
     * https://www.primevideo.com/search/... (ANY search URL)
   - ONLY return direct content detail/watch/dp page URLs - NO search pages at all

3. For other platforms: Return direct content pages, NOT search pages

4. STRICTLY FORBIDDEN: Do NOT return any URLs containing "/search" or "?q=" or "search?q=" or "phrase="
   - Reject any Netflix URL that contains "/search"
   - Reject any Prime Video URL that contains "/search" (like /search/ref=atv_sr_sug...)
   - Reject any Amazon URL that contains "/s?" or "search" or "phrase="
   - All search URLs must be completely rejected

Return ONLY the complete direct URLs. If you cannot find the direct title ID link, do NOT return a search URL as fallback - simply skip that platform.`;

  console.log("📝 [StreamingLinksService] Prompt:", prompt);

  const requestBody = {
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content:
          "You are a streaming platform link finder. Your ONLY job is to find DIRECT title/content page URLs, NEVER search URLs. For Netflix, you MUST find the numeric title ID and return https://www.netflix.com/title/NUMERIC_ID format. For Prime Video, you MUST find direct detail/watch pages (NOT /search/ URLs like /search/ref=atv_sr_sug...). REJECT and DO NOT return any URL containing '/search', '?q=', 'search?q=', 'phrase=', or any search-related parameters. If you cannot find a direct link, skip that platform entirely - do NOT provide search URLs as fallback.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 500,
  };

  console.log(
    "📤 [StreamingLinksService] Sending request to Perplexity API..."
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
      "📥 [StreamingLinksService] Response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [StreamingLinksService] Perplexity API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return [];
    }

    const data: PerplexityResponse = await response.json();
    console.log("📥 [StreamingLinksService] Full Perplexity response received");

    if (!data.choices || data.choices.length === 0) {
      console.error(
        "❌ [StreamingLinksService] No choices in Perplexity response"
      );
      return [];
    }

    const content = data.choices[0].message.content;
    console.log("📄 [StreamingLinksService] Perplexity content:", content);

    const streamingLinks = extractStreamingLinks(content);

    if (streamingLinks.length > 0) {
      console.log(
        `✅ [StreamingLinksService] SUCCESS - Found ${streamingLinks.length} streaming links for ${title} (${year})`
      );
      return streamingLinks;
    }

    console.warn(
      `⚠️ [StreamingLinksService] Could not extract streaming links from Perplexity response for ${title}`
    );
    return [];
  } catch (error) {
    console.error(
      "❌ [StreamingLinksService] Error fetching streaming links from Perplexity:",
      error
    );
    if (error instanceof Error) {
      console.error("❌ [StreamingLinksService] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return [];
  }
};

/**
 * Caches streaming links to avoid repeated API calls
 */
const streamingLinksCache = new Map<string, StreamingOption[]>();

/**
 * Gets streaming links with caching
 * @param title Movie/Series title
 * @param year Release year
 * @returns Array of streaming options with service name and exact URL
 */
export const getStreamingLinksCached = async (
  title: string,
  year: number
): Promise<StreamingOption[]> => {
  const cacheKey = `${title.toLowerCase().trim()}-${year}`;
  console.log("💾 [StreamingLinksService] Cache key:", cacheKey);

  // Check cache first
  if (streamingLinksCache.has(cacheKey)) {
    const cached = streamingLinksCache.get(cacheKey);
    console.log("💾 [StreamingLinksService] Cache HIT for:", cacheKey);
    return cached || [];
  }

  console.log(
    "💾 [StreamingLinksService] Cache MISS for:",
    cacheKey,
    "- Fetching from API..."
  );

  // Fetch from API
  const streamingLinks = await getStreamingLinks(title, year);

  // Cache the result (even if empty to avoid repeated failed requests)
  streamingLinksCache.set(cacheKey, streamingLinks);
  console.log(
    "💾 [StreamingLinksService] Cached result for:",
    cacheKey,
    "->",
    streamingLinks.length,
    "links"
  );

  return streamingLinks;
};
