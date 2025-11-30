/**
 * Service to fetch exact streaming platform links using Perplexity API
 */

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  search_results?: Array<{
    title: string;
    url: string;
    snippet?: string;
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
    "🔍 [StreamingLinksService] Extracting streaming links from Perplexity response text"
  );
  console.log("📝 [StreamingLinksService] Full response text:", text);
  console.log("📝 [StreamingLinksService] Text type:", typeof text);
  console.log("📝 [StreamingLinksService] Text length:", text?.length || 0);

  if (!text || typeof text !== "string") {
    console.error("❌ [StreamingLinksService] Invalid text input:", text);
    return [];
  }

  const streamingOptions: StreamingOption[] = [];

  // First, try to extract links from format "Platform: URL" (new format)
  console.log(
    "🔍 [StreamingLinksService] Trying to extract from 'Platform: URL' format..."
  );
  const platformUrlPattern =
    /(Netflix|Prime Video|Hotstar|JioCinema):\s*(https?:\/\/[^\s\n]+)/gi;
  let match;
  while ((match = platformUrlPattern.exec(text)) !== null) {
    const platformName = match[1].trim();
    const url = match[2].trim();
    console.log(`✅ [StreamingLinksService] Found ${platformName}: ${url}`);

    // Filter out search URLs
    if (
      !url.includes("/search") &&
      !url.includes("?q=") &&
      !url.includes("search?q=")
    ) {
      streamingOptions.push({
        service: platformName,
        url: url,
      });
      console.log(
        `✅ [StreamingLinksService] Added ${platformName} link: ${url}`
      );
    } else {
      console.log(
        `⚠️ [StreamingLinksService] Rejected ${platformName} search URL: ${url}`
      );
    }
  }

  // If we found links in the new format, return them
  if (streamingOptions.length > 0) {
    console.log(
      `✅ [StreamingLinksService] Found ${streamingOptions.length} links in 'Platform: URL' format`
    );
    return streamingOptions;
  }

  console.log(
    "🔍 [StreamingLinksService] No links in 'Platform: URL' format, trying regex patterns..."
  );

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

  // Hotstar patterns - REJECT search URLs and Disney+ URLs
  const hotstarPatterns = [/https?:\/\/(?:www\.)?hotstar\.com\/[^\s\)]+/gi];

  for (const pattern of hotstarPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Filter out search URLs and Disney+ related URLs
      const validMatches = matches.filter(
        (url) =>
          !url.includes("/search") &&
          !url.includes("?q=") &&
          !url.includes("search?q=") &&
          !url.toLowerCase().includes("disney")
      );
      if (validMatches.length > 0) {
        const url = validMatches[0];
        streamingOptions.push({
          service: "Hotstar",
          url: url,
        });
        console.log(
          `✅ [StreamingLinksService] Found Hotstar direct link:`,
          url
        );
        break;
      }
    }
  }

  // JioCinema patterns - REJECT search URLs
  const jioCinemaPatterns = [/https?:\/\/(?:www\.)?jiocinema\.com\/[^\s\)]+/gi];

  for (const pattern of jioCinemaPatterns) {
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
        streamingOptions.push({
          service: "JioCinema",
          url: url,
        });
        console.log(
          `✅ [StreamingLinksService] Found JioCinema direct link:`,
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

  console.log(
    `📊 [StreamingLinksService] Total extracted options: ${streamingOptions.length}`
  );
  if (streamingOptions.length > 0) {
    console.log(
      "✅ [StreamingLinksService] Extracted streaming options:",
      streamingOptions
    );
  } else {
    console.log(
      "⚠️ [StreamingLinksService] No streaming options extracted from text"
    );
  }

  return streamingOptions;
};

/**
 * Extracts streaming links from Perplexity search_results as fallback
 */
const extractFromSearchResults = (
  searchResults: Array<{ title: string; url: string; snippet?: string }>,
  movieTitle: string
): StreamingOption[] => {
  const links: StreamingOption[] = [];

  console.log(
    "🔍 [StreamingLinksService] Extracting from search_results, count:",
    searchResults.length
  );

  for (const result of searchResults) {
    // Extract Netflix ID from uNoGS URLs
    // Format: https://unogs.com/movie/70299275/whiplash
    const netflixIdMatch = result.url.match(/unogs\.com\/movie\/(\d+)/i);
    if (netflixIdMatch) {
      const netflixId = netflixIdMatch[1];
      const netflixUrl = `https://www.netflix.com/title/${netflixId}`;
      console.log(
        `✅ [StreamingLinksService] Found Netflix ID ${netflixId} from uNoGS URL: ${result.url}`
      );
      // Only add if not already added
      if (!links.find((l) => l.service === "Netflix")) {
        links.push({
          service: "Netflix",
          url: netflixUrl,
        });
      }
    }

    // Extract Netflix ID from Wikidata snippets
    // Format: "Netflix ID · 80994899"
    const wikidataNetflixMatch = result.snippet?.match(
      /Netflix ID[^·]*·\s*(\d+)/i
    );
    if (wikidataNetflixMatch && !links.find((l) => l.service === "Netflix")) {
      const netflixId = wikidataNetflixMatch[1];
      const netflixUrl = `https://www.netflix.com/title/${netflixId}`;
      console.log(
        `✅ [StreamingLinksService] Found Netflix ID ${netflixId} from Wikidata snippet`
      );
      links.push({
        service: "Netflix",
        url: netflixUrl,
      });
    }
  }

  console.log(
    `📊 [StreamingLinksService] Extracted ${links.length} links from search_results`
  );
  return links;
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

  const prompt = `You MUST search for and return the EXACT DIRECT streaming platform links for "${title}" (${year}). 

CRITICAL: Use your search capabilities to actively find these links. DO NOT explain why you cannot find them - SEARCH and FIND them.

REQUIRED FORMAT - Return ONLY links in this exact format (one per line):
Netflix: https://www.netflix.com/title/[NUMERIC_ID]
Prime Video: https://www.primevideo.com/detail/[ID] OR https://www.primevideo.com/watch/[ID]
Hotstar: https://www.hotstar.com/in/[content-path]
JioCinema: https://www.jiocinema.com/[content-path]

SEARCH INSTRUCTIONS:
1. For Netflix: Search for "${title} Netflix" and find the numeric title ID (6-8 digits). Construct: https://www.netflix.com/title/[ID]
2. For Prime Video: Search for "${title} Prime Video" and find the detail/watch page URL
3. For Hotstar: Search for "${title} Hotstar" and find the direct content page URL
4. For JioCinema: Search for "${title} JioCinema" and find the direct content page URL

STRICTLY FORBIDDEN:
- Search URLs (anything with /search, ?q=, search?q=)
- Explanations about why links cannot be found
- Text that says "I cannot provide" or "search results do not contain"
- Any text other than the direct URLs

REQUIRED OUTPUT:
- If you find a link, return it in the format above
- If you don't find a link, omit that platform (don't mention it)
- Return ONLY the platform name and URL, nothing else
- Example output:
Netflix: https://www.netflix.com/title/82034831
Prime Video: https://www.primevideo.com/detail/B08XYZ123

SEARCH NOW and return the direct links.`;

  console.log("📝 [StreamingLinksService] Prompt:", prompt);

  const requestBody = {
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content:
          "You are a streaming link finder. Your ONLY job is to SEARCH for and RETURN direct streaming URLs. You MUST use your search capabilities to actively find links. DO NOT explain why you cannot find links - SEARCH and FIND them. Return links in format: 'Platform: URL' (one per line). NEVER return search URLs, explanations, or text saying you cannot find links. Only return direct URLs or nothing.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 800,
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
    console.log(
      "📥 [StreamingLinksService] Response data:",
      JSON.stringify(data, null, 2)
    );

    if (!data.choices || data.choices.length === 0) {
      console.error(
        "❌ [StreamingLinksService] No choices in Perplexity response"
      );
      console.error("❌ [StreamingLinksService] Full response:", data);
      return [];
    }

    const content = data.choices[0].message.content;
    console.log(
      "📄 [StreamingLinksService] Perplexity content (raw):",
      content
    );
    console.log(
      "📄 [StreamingLinksService] Content length:",
      content?.length || 0
    );

    let streamingLinks = extractStreamingLinks(content);
    console.log(
      "🔍 [StreamingLinksService] After extraction from content, found links:",
      streamingLinks
    );

    // Fallback: Extract IDs from search_results if Perplexity didn't return links
    if (streamingLinks.length === 0 && data.search_results) {
      console.log(
        "🔍 [StreamingLinksService] No links in content, trying to extract from search_results..."
      );
      const fallbackLinks = extractFromSearchResults(
        data.search_results,
        title
      );
      if (fallbackLinks.length > 0) {
        console.log(
          "✅ [StreamingLinksService] Found links in search_results:",
          fallbackLinks
        );
        streamingLinks = fallbackLinks;
      }
    }

    if (streamingLinks.length > 0) {
      console.log(
        `✅ [StreamingLinksService] SUCCESS - Found ${streamingLinks.length} streaming links for ${title} (${year})`
      );
      console.log(
        "🔗 [StreamingLinksService] All extracted links:",
        streamingLinks
      );
      streamingLinks.forEach((link, index) => {
        console.log(
          `  [${index + 1}] Service: ${link.service}, URL: ${link.url}`
        );
      });
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
  console.log("💾 [StreamingLinksService] ========== CACHE CHECK ==========");
  console.log("💾 [StreamingLinksService] Cache key:", cacheKey);
  console.log(
    "💾 [StreamingLinksService] Cache size:",
    streamingLinksCache.size
  );

  // Check cache first
  if (streamingLinksCache.has(cacheKey)) {
    const cached = streamingLinksCache.get(cacheKey);
    console.log("💾 [StreamingLinksService] ✅ Cache HIT for:", cacheKey);
    console.log("💾 [StreamingLinksService] Cached value:", cached);
    console.log(
      "💾 [StreamingLinksService] Cached length:",
      cached?.length || 0
    );
    return cached || [];
  }

  console.log(
    "💾 [StreamingLinksService] ❌ Cache MISS for:",
    cacheKey,
    "- Fetching from API..."
  );

  // Fetch from API
  console.log("📡 [StreamingLinksService] Calling getStreamingLinks API...");
  const streamingLinks = await getStreamingLinks(title, year);
  console.log("📡 [StreamingLinksService] API returned:", streamingLinks);
  console.log(
    "📡 [StreamingLinksService] API returned length:",
    streamingLinks?.length || 0
  );

  // Cache the result (even if empty to avoid repeated failed requests)
  streamingLinksCache.set(cacheKey, streamingLinks);
  console.log(
    "💾 [StreamingLinksService] ✅ Cached result for:",
    cacheKey,
    "->",
    streamingLinks.length,
    "links"
  );
  console.log("💾 [StreamingLinksService] ========== CACHE DONE ==========");

  return streamingLinks;
};
