import React, { useState, useEffect, useRef } from "react";
import type { Movie, MovieFeedback } from "../types";
import { ICONS } from "../constants";
import {
  saveMovieFeedback,
  getMovieFeedback,
} from "../services/feedbackService";
import { useLanguage } from "../hooks/useLanguage";
import { addToWatchlist } from "../services/watchlistService";
import { getStreamingLinksCached } from "../services/streamingLinksService";

interface MovieCardProps {
  movie: Movie;
  isSearchResult?: boolean;
  onFeedback?: (feedbackType: MovieFeedback["feedback"]) => void;
  onViewTrailer?: (movie: Movie) => void;
  onFindSimilar?: (title: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isSearchResult = false,
  onFeedback,
  onViewTrailer,
  onFindSimilar,
}) => {
  const { t } = useLanguage();
  const imageIdSeed =
    movie.title.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) + movie.year;
  const placeholderImageUrl = `https://picsum.photos/seed/${imageIdSeed}/400/300`;
  const genericFallbackImageUrl =
    "https://picsum.photos/400/300?grayscale&blur=2";

  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<
    "idle" | "adding" | "added"
  >("idle");
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [fetchedStreamingOptions, setFetchedStreamingOptions] = useState<Array<{
    service: string;
    url: string;
  }> | null>(null);

  useEffect(() => {
    setIsNew(true); // Mark as new whenever the movie prop changes
    setWatchlistStatus("idle"); // Reset watchlist status when card changes
    const timer = setTimeout(() => setIsNew(false), 500); // Animation duration
    return () => clearTimeout(timer);
  }, [movie]);

  useEffect(() => {
    let isActive = true;
    const fetchPoster = async () => {
      try {
        setPosterUrl(null);
        const response = await fetch(
          `https://www.omdbapi.com/?t=${encodeURIComponent(movie.title)}&y=${
            movie.year
          }&apikey=eb2a7002`
        );
        const data = await response.json();
        if (isActive && data?.Poster && data.Poster !== "N/A") {
          setPosterUrl(data.Poster);
        }
      } catch {
        // ignore network errors, keep fallback images
      }
    };

    fetchPoster();
    return () => {
      isActive = false;
    };
  }, [movie.title, movie.year]);

  useEffect(() => {
    if (!onFeedback) return;

    const fetchFeedback = async () => {
      const existingFeedback = await getMovieFeedback(movie.title, movie.year);
      if (existingFeedback) {
        setFeedbackGiven(existingFeedback.feedback);
      } else {
        setFeedbackGiven(null);
      }
    };

    fetchFeedback();
  }, [movie.title, movie.year, onFeedback]);

  // Always fetch streaming links from Prelixty API
  useEffect(() => {
    const fetchStreamingLinks = async () => {
      try {
        const links = await getStreamingLinksCached(movie.title, movie.year);
        if (links && links.length > 0) {
          setFetchedStreamingOptions(links);
          console.log(
            "✅ [MovieCard] Fetched streaming links from Prelixty:",
            links
          );
        } else {
          setFetchedStreamingOptions(null);
        }
      } catch (error) {
        console.error("❌ [MovieCard] Error fetching streaming links:", error);
        setFetchedStreamingOptions(null);
      }
    };

    fetchStreamingLinks();
  }, [movie.title, movie.year]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFeedback = async (feedbackType: MovieFeedback["feedback"]) => {
    await saveMovieFeedback(movie.title, movie.year, feedbackType);
    setFeedbackGiven(feedbackType);
    if (onFeedback) {
      onFeedback(feedbackType);
    }
  };

  const handleAddToWatchlist = async () => {
    setWatchlistStatus("adding");
    const response = await addToWatchlist(movie);
    if (response.success) {
      setWatchlistStatus("added");
      setTimeout(() => {
        setIsOptionsOpen(false); // Close menu on success
      }, 1200);
    } else {
      // Handle error case if needed
      setWatchlistStatus("idle");
    }
  };

  const handleFindSimilar = () => {
    if (onFindSimilar) {
      onFindSimilar(movie.title);
      setIsOptionsOpen(false);
    }
  };

  const getServiceStyles = (serviceName: string) => {
    const lowerName = serviceName.toLowerCase();
    if (lowerName.includes("netflix"))
      return "bg-red-600 hover:bg-red-700 text-white";
    if (lowerName.includes("prime") || lowerName.includes("amazon"))
      return "bg-[#00A8E1] hover:bg-[#008dbd] text-white";
    if (lowerName.includes("disney") || lowerName.includes("hotstar"))
      return "bg-[#113CCF] hover:bg-[#0e31aa] text-white";
    if (lowerName.includes("hbo") || lowerName.includes("max"))
      return "bg-purple-700 hover:bg-purple-800 text-white";
    if (lowerName.includes("hulu"))
      return "bg-[#1CE783] hover:bg-[#15b366] text-black";
    if (lowerName.includes("apple"))
      return "bg-gray-900 hover:bg-black text-white border border-gray-700";
    if (lowerName.includes("jiocinema") || lowerName.includes("jio cinema"))
      return "bg-blue-600 hover:bg-blue-700 text-white";
    return "bg-slate-600 hover:bg-slate-500 text-white"; // Default
  };

  // Extract platform info from availability note (only for "Included with")
  const getPlatformFromAvailability = (availabilityNote: string) => {
    const note = availabilityNote.toLowerCase();

    // Only process if it says "Included with"
    const includedMatch = note.match(/included with\s+([^.]+)/i);
    if (!includedMatch) {
      return null;
    }

    const platformText = includedMatch[1].trim();
    const searchQuery = encodeURIComponent(movie.title);

    // Use only Prelixty fetched streaming options
    const streamingOptions = fetchedStreamingOptions || [];

    // Detect platform and return info
    if (platformText.includes("netflix")) {
      // Prefer: Check if we have a Netflix streaming option with direct link first
      const netflixOption = streamingOptions.find((opt: any) =>
        opt.service?.toLowerCase().includes("netflix")
      );

      let netflixUrl: string;

      // Priority 1: If streamingOptions has a direct URL, use it (preferred)
      if (netflixOption?.url) {
        if (netflixOption.url.startsWith("http")) {
          // Full URL provided - use directly (highest priority)
          netflixUrl = netflixOption.url;
        } else {
          // Title ID provided - construct Netflix title link
          netflixUrl = `https://www.netflix.com/title/${netflixOption.url}`;
        }
      } else {
        // Priority 2: Fallback to search if no streamingOption found
        netflixUrl = `https://www.netflix.com/search?q=${searchQuery}`;
      }

      return {
        name: "Netflix",
        url: netflixUrl,
      };
    }

    if (
      platformText.includes("prime video") ||
      platformText.includes("amazon prime")
    ) {
      // Prefer: Check if we have a Prime Video streaming option with direct link first
      const primeOption = streamingOptions.find(
        (opt: any) =>
          opt.service?.toLowerCase().includes("prime") ||
          opt.service?.toLowerCase().includes("amazon")
      );

      let primeUrl: string;

      // Priority 1: If streamingOptions has a direct URL, use it (preferred)
      if (primeOption?.url) {
        if (primeOption.url.startsWith("http")) {
          // Full URL provided - use directly (highest priority)
          primeUrl = primeOption.url;
        } else {
          // Title ID provided - construct Prime Video detail link
          primeUrl = `https://www.primevideo.com/detail/${primeOption.url}`;
        }
      } else {
        // Priority 2: Fallback to search if no streamingOption found
        primeUrl = `https://www.primevideo.com/search/ref=atv_sr?query=${searchQuery}`;
      }

      return {
        name: "Prime Video",
        url: primeUrl,
      };
    }

    if (platformText.includes("amazon")) {
      // Prefer: Check if we have an Amazon streaming option with direct link first
      const amazonOption = streamingOptions.find((opt: any) =>
        opt.service?.toLowerCase().includes("amazon")
      );

      let amazonUrl: string;

      // Priority 1: If streamingOptions has a direct URL, use it (preferred)
      if (amazonOption?.url) {
        if (amazonOption.url.startsWith("http")) {
          // Full URL provided - use directly (highest priority)
          amazonUrl = amazonOption.url;
        } else {
          // Title ID provided - construct Prime Video detail link
          amazonUrl = `https://www.primevideo.com/detail/${amazonOption.url}`;
        }
      } else {
        // Priority 2: Fallback to search if no streamingOption found
        amazonUrl = `https://www.amazon.com/s?k=${searchQuery}&i=prime-instant-video`;
      }

      return {
        name: "Amazon",
        url: amazonUrl,
      };
    }

    if (platformText.includes("disney") && platformText.includes("hotstar")) {
      return {
        name: "Disney+ Hotstar",
        url: `https://www.hotstar.com/in/search?q=${searchQuery}`,
      };
    }

    if (platformText.includes("hotstar")) {
      return {
        name: "Hotstar",
        url: `https://www.hotstar.com/in/search?q=${searchQuery}`,
      };
    }

    if (platformText.includes("disney")) {
      return {
        name: "Disney+",
        url: `https://www.disneyplus.com/search?q=${searchQuery}`,
      };
    }

    if (
      platformText.includes("jiocinema") ||
      platformText.includes("jio cinema")
    ) {
      return {
        name: "JioCinema",
        url: `https://www.jiocinema.com/search?q=${searchQuery}`,
      };
    }

    if (platformText.includes("hulu")) {
      return {
        name: "Hulu",
        url: `https://www.hulu.com/search?q=${searchQuery}`,
      };
    }

    if (platformText.includes("hbo") || platformText.includes("max")) {
      return {
        name: "Max",
        url: `https://www.max.com/search?q=${searchQuery}`,
      };
    }

    if (platformText.includes("apple")) {
      return {
        name: "Apple TV+",
        url: `https://tv.apple.com/search?term=${searchQuery}`,
      };
    }

    return null;
  };

  const initialImageUrl = posterUrl || movie.posterUrl || placeholderImageUrl;

  const matchScoreColor =
    movie.matchScore && movie.matchScore >= 75
      ? "text-green-400"
      : movie.matchScore && movie.matchScore >= 50
      ? "text-yellow-400"
      : movie.matchScore
      ? "text-red-400"
      : "text-slate-400";

  const scoreLabel = isSearchResult
    ? t("card_score_similarity", "Similarity Score")
    : t("card_score_taste", "Taste Match");
  const scoreIcon = isSearchResult
    ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-5.834A8.959 8.959 0 0 0 3 12c0 .778-.099 1.533.284 2.253m0 0A11.978 11.978 0 0 0 12 16.5c2.998 0 5.74 1.1 7.843 2.918" /></svg>` // Globe / Target icon
    : "❤️";

  return (
    <div
      className={`bg-slate-800 rounded-t-2xl shadow-xl flex flex-col transition-all duration-300 w-full relative ${
        isSearchResult ? "border-2 border-purple-500" : "hover:shadow-2xl"
      } ${isNew ? "movie-card-enter" : ""}`}
    >
      <div className="relative rounded-t-lg overflow-hidden flex items-center justify-center group ">
        <img
          src={initialImageUrl}
          alt={`Poster for ${movie.title}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            if (
              target.src === movie.posterUrl &&
              movie.posterUrl !== placeholderImageUrl
            ) {
              target.src = placeholderImageUrl;
            } else if (
              target.src === placeholderImageUrl &&
              placeholderImageUrl !== genericFallbackImageUrl
            ) {
              target.src = genericFallbackImageUrl;
            } else if (target.src !== genericFallbackImageUrl) {
              target.src = genericFallbackImageUrl;
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

        {/* Options Menu Button */}
        <div ref={optionsMenuRef} className="absolute top-2 left-2 z-20">
          <button
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            className="w-8 h-8 flex items-center justify-center bg-black/60 rounded-full hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 focus-within:opacity-100"
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={isOptionsOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-white"
            >
              <path d="M10 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM11.5 16.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </button>
          {isOptionsOpen && (
            <div className="movie-card-options-menu">
              {onFindSimilar && (
                <button
                  onClick={handleFindSimilar}
                  className="movie-card-options-button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.5 3.75a6.75 6.75 0 1 0 4.216 12.041l4.246 4.247a.75.75 0 1 0 1.06-1.06l-4.247-4.247A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Find Similar
                </button>
              )}
              {movie.id && (
                <button
                  onClick={handleAddToWatchlist}
                  disabled={watchlistStatus !== "idle"}
                  className="movie-card-options-button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6.32 2.577A1.5 1.5 0 0 1 7.5 2.25h9a1.5 1.5 0 0 1 1.5 1.5v16.06a.75.75 0 0 1-1.147.638L12 17.19l-4.853 3.258A.75.75 0 0 1 6 19.81V3.75a1.5 1.5 0 0 1 .32-.173Z" />
                    <path d="M12 7.5a.75.75 0 0 1 .75.75V10.5h2.25a.75.75 0 0 1 0 1.5H12.75v2.25a.75.75 0 0 1-1.5 0V12H9a.75.75 0 0 1 0-1.5h2.25V8.25A.75.75 0 0 1 12 7.5Z" />
                  </svg>
                  {watchlistStatus === "idle" && "Add to Watchlist"}
                  {watchlistStatus === "adding" && "Adding..."}
                  {watchlistStatus === "added" && "Added ✓"}
                </button>
              )}
            </div>
          )}
        </div>

        {movie.socialProofTag && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-10">
            ⭐ {movie.socialProofTag}
          </div>
        )}

        {onViewTrailer && (
          <button
            onClick={() => onViewTrailer(movie)}
            className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg z-10 flex items-center hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100"
            aria-label={`View trailer for ${movie.title}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 mr-1"
            >
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
            {t("card_trailer", "Trailer")}
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <div className="min-w-0 text-center">
          <h3 className="truncate text-xl font-semibold text-purple-300 mb-1">
            {movie.title} ({movie.year})
          </h3>
        </div>

        {movie.matchScore !== undefined && (
          <div
            className={`flex items-center justify-center text-sm font-semibold mt-2 mb-1 ${matchScoreColor}`}
          >
            <span
              role="img"
              aria-label="Score icon"
              className="mr-1.5 flex items-center justify-center text-lg"
              dangerouslySetInnerHTML={{ __html: scoreIcon }}
            />
            {scoreLabel}: {movie.matchScore}/100
          </div>
        )}

        {movie.durationMinutes && (
          <p className="text-xs text-slate-400 mb-3 text-center">
            {t("card_duration", "Duration: {minutes} min", {
              minutes: movie.durationMinutes,
            })}
          </p>
        )}

        {movie.justification && (
          <div className="my-2 p-2 sm:p-3 bg-purple-900/30 rounded-lg border border-purple-800/50">
            <p className="text-sm italic text-purple-200 text-center flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 mr-2 flex-shrink-0 text-yellow-300"
              >
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.75 4.97a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM4.25 15.03a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM15.03 15.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM4.97 4.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM2.25 10a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM17.75 10a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM3.52 6.03a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM13.97 16.48a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM6.03 16.48a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06ZM16.48 3.97a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Z" />
              </svg>
              <span className="flex-1">"{movie.justification}"</span>
            </p>
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-1.5 justify-center">
          {movie.genres &&
            movie.genres.length > 0 &&
            movie.genres.slice(0, 4).map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 bg-slate-700 text-xs text-purple-200 rounded-full"
              >
                {genre}
              </span>
            ))}
        </div>
        <div className="min-w-0 flex-grow mb-4">
          <p className="text-slate-300 text-sm leading-relaxed text-center line-clamp-4">
            {movie.summary}
          </p>
        </div>

        {/* Streaming Options - Only from Prelixty */}
        {fetchedStreamingOptions && fetchedStreamingOptions.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {fetchedStreamingOptions.map((option: any, idx: number) => {
              const serviceLower = option.service.toLowerCase();
              let finalUrl: string;

              // Priority 1 (Preferred): If option.url is already a full URL, use it directly
              if (option.url && option.url.startsWith("http")) {
                finalUrl = option.url;
              }
              // Priority 2: If URL is just an ID, construct the full URL based on platform
              else if (serviceLower.includes("netflix") && option.url) {
                // Construct Netflix title link from ID
                finalUrl = `https://www.netflix.com/title/${option.url}`;
              } else if (
                (serviceLower.includes("prime") ||
                  serviceLower.includes("amazon")) &&
                option.url
              ) {
                // Construct Prime Video detail link from ID
                finalUrl = `https://www.primevideo.com/detail/${option.url}`;
              } else {
                // Fallback: Use option.url as-is if no special handling needed
                finalUrl = option.url || "#";
              }

              return (
                <a
                  key={idx}
                  href={finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-transform transform hover:scale-105 flex items-center ${getServiceStyles(
                    option.service
                  )}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3 mr-1.5"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                  {option.service}
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-700 space-y-3">
          {movie.similarTo && (
            <p className="text-xs text-slate-300 flex items-start justify-center text-center">
              <span
                dangerouslySetInnerHTML={{ __html: ICONS.similar_to }}
                className="flex-shrink-0 w-4 h-4 mr-1.5 text-yellow-400 mt-px"
              />
              <span className="min-w-0 truncate" title={movie.similarTo}>
                <span className="italic font-semibold text-slate-400">
                  {t("card_similar_to", "Similar to:")}&nbsp;
                </span>
                <span className="font-bold text-yellow-300">
                  {movie.similarTo}
                </span>
              </span>
            </p>
          )}

          {movie.availabilityNote &&
            (() => {
              const platformInfo = getPlatformFromAvailability(
                movie.availabilityNote
              );

              // If platform detected from "Included with", show button
              if (platformInfo) {
                return (
                  <div className="flex justify-center">
                    <a
                      href={platformInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-transform transform hover:scale-105 flex items-center ${getServiceStyles(
                        platformInfo.name
                      )}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3 h-3 mr-1.5"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                      </svg>
                      Watch on {platformInfo.name}
                    </a>
                  </div>
                );
              }

              // Otherwise show text as fallback
              return (
                <p className="text-xs text-sky-300 flex items-start justify-center text-center">
                  <span
                    dangerouslySetInnerHTML={{ __html: ICONS.availability }}
                    className="flex-shrink-0 w-4 h-4 mr-1.5 text-sky-400 mt-px"
                  />
                  <span className="min-w-0">
                    <span className="font-semibold text-sky-400">
                      {t("card_availability", "Availability:")}&nbsp;
                    </span>
                    <span className="font-bold text-sky-200">
                      {movie.availabilityNote}
                    </span>
                  </span>
                </p>
              );
            })()}

          {onFeedback && (
            <div className="pt-2">
              {feedbackGiven ? (
                <p className="text-sm text-center text-green-400 font-semibold">
                  {t("card_feedback_success_prefix", "Your feedback:")}{" "}
                  {feedbackGiven}
                  {t("card_feedback_success_suffix", "!")}
                </p>
              ) : (
                <>
                  <div className="group relative text-center">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out bg-purple-500/30 text-purple-200 hover:bg-purple-500/50 hover:text-white ring-1 ring-purple-500/50"
                      aria-expanded="false"
                      aria-haspopup="true"
                    >
                      {t("card_feedback_prompt", "Already Watched This?")}
                    </button>
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2
                                    bg-slate-900 border border-slate-600 rounded-md shadow-lg
                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible
                                    transition-all duration-200 ease-in-out flex space-x-2 z-20"
                      role="menu"
                    >
                      <button
                        onClick={() => handleFeedback("Loved it!")}
                        className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white font-semibold"
                        role="menuitem"
                      >
                        {t("card_feedback_loved", "Loved it! 😍")}
                      </button>
                      <button
                        onClick={() => handleFeedback("Liked it")}
                        className="text-xs px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                        role="menuitem"
                      >
                        {t("card_feedback_liked", "Liked it 😊")}
                      </button>
                      <button
                        onClick={() => handleFeedback("Not my vibe")}
                        className="text-xs px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold"
                        role="menuitem"
                      >
                        {t("card_feedback_not_my_vibe", "Not my vibe 😕")}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic text-center mt-2 px-2">
                    {t(
                      "card_feedback_thanks",
                      "Your feedback makes future recommendations even better!"
                    )}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
