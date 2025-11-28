declare const chrome: any;
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { PreferenceForm } from "./components/PreferenceForm";
import { MovieList } from "./components/MovieList";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { Footer } from "./components/Footer";
import {
  getMovieRecommendations,
  findSimilarItems,
  checkTasteMatch,
  getSingleReplacementRecommendation,
  enrichViewingHistory,
  getNumberOfRecommendationsSetting,
} from "./services/geminiService";
import type {
  UserPreferences,
  Movie,
  SessionPreferences,
  StableUserPreferences,
  ActiveTab,
  RecommendationType,
  MovieFeedback,
  GrowthPromptState,
} from "./types";
import { WelcomeMessage } from "./components/WelcomeMessage";
import { SimilarMovieSearch } from "./components/SimilarMovieSearch";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { DiscoveryView } from "./components/DiscoveryView";
import { MyAccountPage } from "./components/MyAccountPage";
import { OtherSettingsPage } from "./components/OtherSettingsPage";
import { WatchlistView } from "./components/WatchPartyView";
import { LandingPage } from "./components/LandingPage";
import {
  CINE_SUGGEST_ONBOARDING_COMPLETE_KEY,
  CINE_SUGGEST_STABLE_PREFERENCES_KEY,
  MOVIE_FREQUENCIES,
  ACTOR_DIRECTOR_PREFERENCES,
  MOVIE_LANGUAGES,
  MOVIE_ERAS,
  MOVIE_DURATIONS,
  SERIES_SEASON_COUNTS,
  ICONS,
  COUNTRIES,
  CINE_SUGGEST_APP_SETTINGS_KEY,
  CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY,
  CINE_SUGGEST_SESSION_COUNT_KEY,
  CINE_SUGGEST_STORE_REVIEW_URL,
  CINE_SUGGEST_SHARE_URL,
  CINE_SUGGEST_EXTENSION_NUDGE_DISMISSED_KEY,
  CINE_SUGGEST_CHROME_STORE_URL,
} from "./constants";
import { TrailerModal } from "./components/TrailerModal";
import { ReviewPrompt } from "./components/ReviewPrompt";
import { ReferralPrompt } from "./components/ReferralPrompt";
import { ExtensionNudge } from "./components/ExtensionNudge";
import { trackEvent } from "./services/analyticsService";
import { importExternalFeedback } from "./services/feedbackService";
import { storeChromeHistory } from "./services/chromeHistoryService";
import { useLanguage } from "./hooks/useLanguage";
import { MovieCard } from "./components/MovieCard";

type AppView =
  | "loading"
  | "landing"
  | "onboarding"
  | "main"
  | "onboardingEdit"
  | "myAccount"
  | "otherSettings";

const getDefaultStablePreferences = (): StableUserPreferences => {
  const defaultLang =
    MOVIE_LANGUAGES.find((l) => l.code === "any")?.code || "any";
  const defaultCountry = COUNTRIES.find((c) => c.code === "any")?.code || "any";
  return {
    movieFrequency: MOVIE_FREQUENCIES[1],
    actorDirectorPreference: ACTOR_DIRECTOR_PREFERENCES[0],
    preferredLanguages: [defaultLang],
    ottPlatforms: [],
    era: [MOVIE_ERAS[0]],
    movieDuration: [MOVIE_DURATIONS[0]],
    preferredNumberOfSeasons: [SERIES_SEASON_COUNTS[0]],
    country: defaultCountry,
  };
};

const App: React.FC = () => {
  const { isLoading: isLoadingTranslations, t, language } = useLanguage();
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [prefetchedRecommendations, setPrefetchedRecommendations] = useState<
    Movie[]
  >([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState<boolean>(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null
  );
  const [hasSearchedRecommendations, setHasSearchedRecommendations] =
    useState<boolean>(false);
  const [sessionExcludedRecommendations, setSessionExcludedRecommendations] =
    useState<Movie[]>([]);
  const [lastSessionPreferences, setLastSessionPreferences] =
    useState<SessionPreferences | null>(null);

  const [similarItems, setSimilarItems] = useState<Movie[]>([]);
  const [isLoadingSimilarItems, setIsLoadingSimilarItems] =
    useState<boolean>(false);
  const [similarItemsError, setSimilarItemsError] = useState<string | null>(
    null
  );
  const [hasSearchedSimilarItems, setHasSearchedSimilarItems] =
    useState<boolean>(false);
  const [originalQueryForSimilar, setOriginalQueryForSimilar] = useState<
    string | null
  >(null);
  const [initialSimilarSearchQuery, setInitialSimilarSearchQuery] = useState<
    string | null
  >(null);

  const [tasteCheckResult, setTasteCheckResult] = useState<Movie | null>(null);
  const [isLoadingTasteCheck, setIsLoadingTasteCheck] =
    useState<boolean>(false);
  const [tasteCheckError, setTasteCheckError] = useState<string | null>(null);
  const [hasSearchedTasteCheck, setHasSearchedTasteCheck] =
    useState<boolean>(false);
  const [tasteCheckJustification, setTasteCheckJustification] = useState<
    string | null
  >(null);
  const [originalQueryForTasteCheck, setOriginalQueryForTasteCheck] = useState<
    string | null
  >(null);

  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>("recommendations");
  const [stablePreferences, setStablePreferences] =
    useState<StableUserPreferences | null>(null);
  const [recommendationType, setRecommendationType] =
    useState<RecommendationType>("movie");

  const [view, setView] = useState<AppView>("loading");

  const [promptToShow, setPromptToShow] = useState<
    "review" | "referral" | null
  >(null);
  const [promptTriggeredThisSession, setPromptTriggeredThisSession] =
    useState<boolean>(false);
  const [showExtensionNudge, setShowExtensionNudge] = useState<boolean>(false);
  const sessionCountRef = useRef<number>(0);

  const recommendationsTitleRef = useRef<HTMLHeadingElement>(null);
  const similarItemsTitleRef = useRef<HTMLHeadingElement>(null);
  const loadingIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t("seo_title");

    // Create or update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", t("seo_description"));
  }, [language, t]);

  const getEnsuredStablePreferences =
    useCallback(async (): Promise<StableUserPreferences> => {
      if (stablePreferences) {
        return stablePreferences;
      }

      const defaultValues = getDefaultStablePreferences();

      return new Promise((resolve) => {
        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.local
        ) {
          chrome.storage.local.get(
            [CINE_SUGGEST_STABLE_PREFERENCES_KEY],
            (result: any) => {
              const storedPrefs = result[CINE_SUGGEST_STABLE_PREFERENCES_KEY];
              if (storedPrefs) {
                const parsedPrefs =
                  typeof storedPrefs === "string"
                    ? JSON.parse(storedPrefs)
                    : storedPrefs;
                const validatedPrefs: StableUserPreferences = {
                  ...defaultValues,
                  ...parsedPrefs,
                  era:
                    Array.isArray(parsedPrefs.era) && parsedPrefs.era.length > 0
                      ? parsedPrefs.era
                      : defaultValues.era,
                  movieDuration:
                    Array.isArray(parsedPrefs.movieDuration) &&
                    parsedPrefs.movieDuration.length > 0
                      ? parsedPrefs.movieDuration
                      : defaultValues.movieDuration,
                  preferredNumberOfSeasons:
                    Array.isArray(parsedPrefs.preferredNumberOfSeasons) &&
                    parsedPrefs.preferredNumberOfSeasons.length > 0
                      ? parsedPrefs.preferredNumberOfSeasons
                      : defaultValues.preferredNumberOfSeasons,
                  preferredLanguages:
                    Array.isArray(parsedPrefs.preferredLanguages) &&
                    parsedPrefs.preferredLanguages.length > 0
                      ? parsedPrefs.preferredLanguages
                      : defaultValues.preferredLanguages,
                  country:
                    typeof parsedPrefs.country === "string" &&
                    COUNTRIES.some((c) => c.code === parsedPrefs.country)
                      ? parsedPrefs.country
                      : defaultValues.country,
                };
                setStablePreferences(validatedPrefs);
                resolve(validatedPrefs);
              } else {
                setStablePreferences(defaultValues);
                chrome.storage.local.set({
                  [CINE_SUGGEST_STABLE_PREFERENCES_KEY]: defaultValues,
                });
                resolve(defaultValues);
              }
            }
          );
        } else {
          // Fallback to localStorage if chrome API not available
          const storedPrefsString = localStorage.getItem(
            CINE_SUGGEST_STABLE_PREFERENCES_KEY
          );
          if (storedPrefsString) {
            try {
              const parsedPrefs = JSON.parse(storedPrefsString);
              // Basic validation
              const validatedPrefs = { ...defaultValues, ...parsedPrefs };
              setStablePreferences(validatedPrefs);
              resolve(validatedPrefs);
            } catch {
              setStablePreferences(defaultValues);
              localStorage.setItem(
                CINE_SUGGEST_STABLE_PREFERENCES_KEY,
                JSON.stringify(defaultValues)
              );
              resolve(defaultValues);
            }
          } else {
            setStablePreferences(defaultValues);
            localStorage.setItem(
              CINE_SUGGEST_STABLE_PREFERENCES_KEY,
              JSON.stringify(defaultValues)
            );
            resolve(defaultValues);
          }
        }
      });
    }, [stablePreferences]);

  useEffect(() => {
    const initializeApp = async () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        // Extension environment
        const result = await new Promise<any>((resolve) => {
          chrome.storage.local.get(
            [
              CINE_SUGGEST_SESSION_COUNT_KEY,
              CINE_SUGGEST_ONBOARDING_COMPLETE_KEY,
              "netflixTitlesToProcess",
            ],
            resolve
          );
        });

        const storedSessionCount = result[CINE_SUGGEST_SESSION_COUNT_KEY] || 0;
        const newSessionCount = storedSessionCount + 1;
        sessionCountRef.current = newSessionCount;
        chrome.storage.local.set({
          [CINE_SUGGEST_SESSION_COUNT_KEY]: newSessionCount,
        });
        trackEvent("app_session_start", { session_count: newSessionCount });

        const titlesToProcess = result["netflixTitlesToProcess"];
        if (titlesToProcess && titlesToProcess.length > 0) {
          console.log(
            `Found ${titlesToProcess.length} Netflix titles to process.`
          );
          trackEvent("auto_import_start", {
            source: "netflix",
            count: titlesToProcess.length,
          });
          const enriched = await enrichViewingHistory(titlesToProcess);
          const newFeedback: MovieFeedback[] = enriched.map((item) => ({
            id: `${item.title.toLowerCase().replace(/[^a-z0-9]/g, "")}${
              item.year
            }`,
            title: item.title,
            year: item.year,
            feedback: "Liked it",
            source: "netflix-import",
          }));
          await importExternalFeedback(newFeedback);
          chrome.storage.local.remove("netflixTitlesToProcess"); // Clear after processing
          chrome.action.setBadgeText({ text: "" }); // Clear badge
          trackEvent("auto_import_complete", {
            source: "netflix",
            new_count: newFeedback.length,
          });
        }

        // Store Chrome history for streaming platforms (simple storage, no processing)
        if (typeof chrome !== "undefined" && chrome.history) {
          storeChromeHistory().catch((err) => {
            console.error("Failed to store Chrome history:", err);
          });
        }

        if (!result[CINE_SUGGEST_ONBOARDING_COMPLETE_KEY]) {
          setView("landing");
        } else {
          const currentPrefs = await getEnsuredStablePreferences();
          if (!stablePreferences) {
            setStablePreferences(currentPrefs);
          }
          setView("main");
        }
      } else {
        // Non-extension environment (fallback to localStorage)
        const storedSessionCount = parseInt(
          localStorage.getItem(CINE_SUGGEST_SESSION_COUNT_KEY) || "0",
          10
        );
        const newSessionCount = storedSessionCount + 1;
        localStorage.setItem(
          CINE_SUGGEST_SESSION_COUNT_KEY,
          newSessionCount.toString()
        );
        sessionCountRef.current = newSessionCount;
        trackEvent("app_session_start", { session_count: newSessionCount });

        const onboardingComplete = localStorage.getItem(
          CINE_SUGGEST_ONBOARDING_COMPLETE_KEY
        );
        if (!onboardingComplete) {
          setView("landing");
        } else {
          const currentPrefs = await getEnsuredStablePreferences();
          if (!stablePreferences) {
            setStablePreferences(currentPrefs);
          }
          setView("main");
        }
      }
    };
    initializeApp();
  }, [getEnsuredStablePreferences, stablePreferences]);

  // Handle initial search from content script
  useEffect(() => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.session
    ) {
      chrome.storage.session.get("initialSearch", (result) => {
        if (result.initialSearch) {
          const { tab, query, type } = result.initialSearch;

          if (tab === "similarSearch" && query) {
            setTimeout(() => {
              handleTabChange("similarSearch");
              if (type && type !== recommendationType) {
                handleRecommendationTypeChange(type);
              }
              const searchInput = document.querySelector(
                "#similar-search-input"
              ) as HTMLInputElement;
              if (searchInput) {
                searchInput.value = query;
              }
              handleFindSimilarItems(query);
            }, 100);
          }
          chrome.storage.session.remove("initialSearch");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      view === "main" &&
      activeTab === "recommendations" &&
      recommendations.length > 0 &&
      !isLoadingRecommendations &&
      hasSearchedRecommendations
    ) {
      const timer = setTimeout(() => {
        if (recommendationsTitleRef.current) {
          recommendationsTitleRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    recommendations,
    isLoadingRecommendations,
    hasSearchedRecommendations,
    activeTab,
    view,
  ]);

  // Check if extension nudge should be shown
  useEffect(() => {
    // Reset nudge state when switching tabs
    if (activeTab !== "recommendations") {
      setShowExtensionNudge(false);
      return;
    }

    if (
      view === "main" &&
      activeTab === "recommendations" &&
      hasSearchedRecommendations
    ) {
      // Only show if NOT in extension mode
      // Check if chrome.runtime.id exists (extension installed)
      const isExtensionMode =
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.id !== "undefined" &&
        chrome.runtime.id !== null;

      console.log("Extension nudge check:", {
        view,
        activeTab,
        hasSearchedRecommendations,
        isExtensionMode,
      });

      if (!isExtensionMode) {
        const storage =
          typeof chrome !== "undefined" && chrome.storage
            ? chrome.storage.local
            : null;

        const checkDismissal = (dismissedTimestamp: string | null) => {
          if (!dismissedTimestamp) {
            // Never dismissed before - show it
            console.log("Showing extension nudge - never dismissed");
            setShowExtensionNudge(true);
          } else {
            // Previously dismissed
            const dismissedTime = parseInt(dismissedTimestamp, 10);
            const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
            const timeSinceDismissal = Date.now() - dismissedTime;
            // If it has been more than 7 days, show it again
            if (timeSinceDismissal > sevenDaysInMillis) {
              console.log("Showing extension nudge - 7 days passed");
              setShowExtensionNudge(true);
            } else {
              console.log(
                "Extension nudge dismissed - time remaining:",
                Math.ceil(
                  (sevenDaysInMillis - timeSinceDismissal) /
                    (1000 * 60 * 60 * 24)
                ),
                "days"
              );
            }
          }
        };

        if (storage) {
          storage.get(
            [CINE_SUGGEST_EXTENSION_NUDGE_DISMISSED_KEY],
            (result: any) => {
              checkDismissal(
                result[CINE_SUGGEST_EXTENSION_NUDGE_DISMISSED_KEY]
              );
            }
          );
        } else {
          // Fallback to localStorage
          const dismissedTimestamp = localStorage.getItem(
            CINE_SUGGEST_EXTENSION_NUDGE_DISMISSED_KEY
          );
          checkDismissal(dismissedTimestamp);
        }
      } else {
        console.log("Extension installed - nudge not shown");
      }
    } else {
      // Reset when conditions not met
      setShowExtensionNudge(false);
    }
  }, [view, activeTab, hasSearchedRecommendations]);

  useEffect(() => {
    if (
      view === "main" &&
      activeTab === "similarSearch" &&
      similarItems.length > 0 &&
      !isLoadingSimilarItems &&
      hasSearchedSimilarItems
    ) {
      const timer = setTimeout(() => {
        if (similarItemsTitleRef.current) {
          similarItemsTitleRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    similarItems,
    isLoadingSimilarItems,
    hasSearchedSimilarItems,
    activeTab,
    view,
  ]);

  const handleStartOnboarding = () => {
    trackEvent("onboarding_start", {});
    setView("onboarding");
  };

  const handleOnboardingComplete = (
    completedStablePreferences: StableUserPreferences
  ) => {
    setStablePreferences(completedStablePreferences);
    setView("main");
  };

  const handleEditPreferences = () => {
    setView("onboardingEdit");
  };

  const handleShowMyAccount = () => {
    setView("myAccount");
  };

  const handleShowOtherSettings = () => {
    setView("otherSettings");
  };

  const handleBackToMain = () => {
    setView("main");
  };

  const handleViewTrailer = async (movie: Movie) => {
    console.log("🎬 [App] handleViewTrailer called for:", movie.title, movie.year);
    trackEvent("view_trailer", { title: movie.title, year: movie.year });
    
    // Always fetch fresh trailer from Perplexity to ensure we get a working link
    // Even if youtubeTrailerId exists, it might be unavailable/removed
    console.log("🔍 [App] Fetching fresh trailer from Perplexity...");
    setIsLoadingTrailer(true);
    try {
      const { getTrailerLinkCached } = await import("./services/trailerService");
      console.log("📞 [App] Calling getTrailerLinkCached...");
      const trailerLink = await getTrailerLinkCached(movie.title, movie.year);
      console.log("📥 [App] Received trailer link:", trailerLink);
      
      if (trailerLink) {
        console.log("✅ [App] Setting trailer ID:", trailerLink);
        setTrailerId(trailerLink);
      } else {
        console.warn("⚠️ [App] Trailer link is null/empty");
        // Fallback to existing ID if available
        if (movie.youtubeTrailerId) {
          console.log("🔄 [App] Falling back to existing trailer ID:", movie.youtubeTrailerId);
          setTrailerId(movie.youtubeTrailerId);
        } else {
          // Show error message
          alert("Trailer not found. Please try again later.");
        }
      }
    } catch (error) {
      console.error("❌ [App] Error fetching trailer:", error);
      if (error instanceof Error) {
        console.error("❌ [App] Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
      // Fallback to existing ID if available
      if (movie.youtubeTrailerId) {
        console.log("🔄 [App] Error occurred, falling back to existing trailer ID:", movie.youtubeTrailerId);
        setTrailerId(movie.youtubeTrailerId);
      } else {
        alert("Failed to fetch trailer. Please try again later.");
      }
    } finally {
      console.log("🏁 [App] Trailer fetch completed, setting loading to false");
      setIsLoadingTrailer(false);
    }
  };

  const handleCloseTrailer = () => {
    setTrailerId(null);
  };

  const updateGrowthState = (updates: Partial<GrowthPromptState>) => {
    const storage =
      typeof chrome !== "undefined" && chrome.storage
        ? chrome.storage.local
        : null;
    if (storage) {
      storage.get([CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY], (result: any) => {
        const currentState = result[CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY] || {
          lastPromptSession: 0,
          hasRated: false,
          hasShared: false,
        };
        const newState = { ...currentState, ...updates };
        storage.set({ [CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY]: newState });
      });
    } else {
      const growthStateString = localStorage.getItem(
        CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY
      );
      const currentState: GrowthPromptState = growthStateString
        ? JSON.parse(growthStateString)
        : { lastPromptSession: 0, hasRated: false, hasShared: false };
      const newState = { ...currentState, ...updates };
      localStorage.setItem(
        CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY,
        JSON.stringify(newState)
      );
    }
  };

  const handleRateApp = () => {
    updateGrowthState({
      hasRated: true,
      lastPromptSession: sessionCountRef.current,
    });
    setPromptToShow(null);
    trackEvent("review_prompt_action", { action: "rate" });
    window.open(CINE_SUGGEST_STORE_REVIEW_URL, "_blank", "noopener,noreferrer");
  };

  const handleDismissReviewPrompt = () => {
    updateGrowthState({ lastPromptSession: sessionCountRef.current });
    setPromptToShow(null);
    trackEvent("review_prompt_action", { action: "dismiss" });
  };

  const handleShareApp = () => {
    updateGrowthState({
      hasShared: true,
      lastPromptSession: sessionCountRef.current,
    });
    setPromptToShow(null);
    trackEvent("referral_prompt_action", { action: "share" });
  };

  const handleDismissReferralPrompt = () => {
    updateGrowthState({ lastPromptSession: sessionCountRef.current });
    setPromptToShow(null);
    trackEvent("referral_prompt_action", { action: "dismiss" });
  };

  const handleExtensionNudgeInstall = () => {
    trackEvent("extension_nudge_install_click", {});
    window.open(CINE_SUGGEST_CHROME_STORE_URL, "_blank", "noopener,noreferrer");
  };

  const handleExtensionNudgeDismiss = () => {
    setShowExtensionNudge(false);
    const currentTimestamp = Date.now().toString();
    const storage =
      typeof chrome !== "undefined" && chrome.storage
        ? chrome.storage.local
        : null;

    if (storage) {
      storage.set({
        [CINE_SUGGEST_EXTENSION_NUDGE_DISMISSED_KEY]: currentTimestamp,
      });
    } else {
      localStorage.setItem(
        CINE_SUGGEST_EXTENSION_NUDGE_DISMISSED_KEY,
        currentTimestamp
      );
    }

    trackEvent("extension_nudge_dismiss", {
      temporary: true,
      duration_days: 7,
    });
  };

  const clearAllTabData = () => {
    setRecommendations([]);
    setPrefetchedRecommendations([]);
    setHasSearchedRecommendations(false);
    setRecommendationError(null);
    setSessionExcludedRecommendations([]);
    setLastSessionPreferences(null);
    setShowExtensionNudge(false);

    setSimilarItems([]);
    setHasSearchedSimilarItems(false);
    setSimilarItemsError(null);
    setOriginalQueryForSimilar(null);

    setTasteCheckResult(null);
    setTasteCheckJustification(null);
    setHasSearchedTasteCheck(false);
    setTasteCheckError(null);
    setOriginalQueryForTasteCheck(null);
  };

  const handleTabChange = (newTab: ActiveTab) => {
    if (activeTab !== newTab) {
      clearAllTabData();
      trackEvent("tab_view", { tab_name: newTab });
    }
    setActiveTab(newTab);
  };

  const handleRecommendationTypeChange = (newType: RecommendationType) => {
    if (recommendationType !== newType) {
      setRecommendationType(newType);
      clearAllTabData();
      trackEvent("content_type_change", { content_type: newType });
    }
  };

  const handleGetRecommendations = useCallback(
    async (sessionPreferences: SessionPreferences) => {
      setIsLoadingRecommendations(true);
      setRecommendationError(null);
      setHasSearchedRecommendations(true);
      setLastSessionPreferences(sessionPreferences);

      trackEvent("recommendation_search", {
        type: recommendationType,
        genres: sessionPreferences.genres,
        excluded_genres: sessionPreferences.excludedGenres,
        mood: sessionPreferences.mood,
        keywords: sessionPreferences.keywords,
      });

      const combinedExclusions = [
        ...sessionExcludedRecommendations,
        ...recommendations,
        ...prefetchedRecommendations,
      ];
      setSessionExcludedRecommendations(combinedExclusions);

      setRecommendations([]);
      setPrefetchedRecommendations([]);

      setTimeout(() => {
        if (loadingIndicatorRef.current) {
          loadingIndicatorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 0);

      const currentStablePrefs = await getEnsuredStablePreferences();

      const fullPreferences: UserPreferences = {
        ...currentStablePrefs,
        ...sessionPreferences,
      };

      try {
        const [items, numToDisplay] = await Promise.all([
          getMovieRecommendations(
            fullPreferences,
            recommendationType,
            combinedExclusions
          ),
          getNumberOfRecommendationsSetting(),
        ]);

        setRecommendations(items.slice(0, numToDisplay));
        setPrefetchedRecommendations(items.slice(numToDisplay));

        if (!promptTriggeredThisSession && items.length > 0) {
          const showPrompt = (growthState: GrowthPromptState) => {
            const currentSession = sessionCountRef.current;
            const canShowAnyPrompt =
              currentSession > 3 &&
              currentSession >= (growthState.lastPromptSession || 0) + 3;
            if (canShowAnyPrompt) {
              let promptType: "review" | "referral" | null = null;
              if (!growthState.hasRated) {
                promptType = "review";
              } else if (!growthState.hasShared) {
                promptType = "referral";
              }
              if (promptType) {
                setTimeout(() => {
                  setPromptToShow(promptType);
                  trackEvent(`${promptType}_prompt_view`, {});
                }, 4000);
                setPromptTriggeredThisSession(true);
              }
            }
          };

          const storage =
            typeof chrome !== "undefined" && chrome.storage
              ? chrome.storage.local
              : null;
          if (storage) {
            storage.get(
              [CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY],
              (result: any) => {
                const growthState = result[
                  CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY
                ] || {
                  lastPromptSession: 0,
                  hasRated: false,
                  hasShared: false,
                };
                showPrompt(growthState);
              }
            );
          } else {
            const growthStateString = localStorage.getItem(
              CINE_SUGGEST_GROWTH_PROMPT_STATE_KEY
            );
            const growthState = growthStateString
              ? JSON.parse(growthStateString)
              : { lastPromptSession: 0, hasRated: false, hasShared: false };
            showPrompt(growthState);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          setRecommendationError(
            err.message ||
              `Failed to fetch ${
                recommendationType === "series" ? "series" : "movie"
              } recommendations. Please check your API key and try again.`
          );
        } else {
          setRecommendationError(
            `An unknown error occurred while fetching ${
              recommendationType === "series" ? "series" : "movie"
            } recommendations.`
          );
        }
        setRecommendations([]);
        trackEvent("recommendation_search_error", {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setIsLoadingRecommendations(false);
      }
    },
    [
      getEnsuredStablePreferences,
      recommendationType,
      recommendations,
      sessionExcludedRecommendations,
      prefetchedRecommendations,
      promptTriggeredThisSession,
    ]
  );

  const fetchAndAddToBuffer = useCallback(async () => {
    if (!lastSessionPreferences) return;

    const allCurrentItems = [
      ...recommendations,
      ...prefetchedRecommendations,
      ...sessionExcludedRecommendations,
    ];

    const currentStablePrefs = await getEnsuredStablePreferences();
    const fullPreferences: UserPreferences = {
      ...currentStablePrefs,
      ...lastSessionPreferences,
    };

    try {
      const replacement = await getSingleReplacementRecommendation(
        fullPreferences,
        recommendationType,
        allCurrentItems
      );
      if (replacement) {
        setPrefetchedRecommendations((prev) => [...prev, replacement]);
      }
    } catch (err) {
      console.error("Failed to fetch item for buffer:", err);
    }
  }, [
    lastSessionPreferences,
    recommendations,
    prefetchedRecommendations,
    sessionExcludedRecommendations,
    getEnsuredStablePreferences,
    recommendationType,
  ]);

  const handleRecommendationFeedback = (
    movieId: string,
    feedbackType: MovieFeedback["feedback"]
  ) => {
    const movieToReplace = recommendations.find((m) => m.id === movieId);
    if (!movieToReplace) return;

    trackEvent("recommendation_feedback", {
      title: movieToReplace.title,
      year: movieToReplace.year,
      feedback: feedbackType,
    });

    setSessionExcludedRecommendations((prev) => [...prev, movieToReplace]);

    if (prefetchedRecommendations.length > 0) {
      const replacement = prefetchedRecommendations[0];
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === movieId ? replacement : rec))
      );
      setPrefetchedRecommendations((prev) => prev.slice(1));
      fetchAndAddToBuffer(); // Top up buffer in the background
    } else {
      // If buffer is empty, just remove the card and try to fetch for the buffer.
      setRecommendations((prev) => prev.filter((rec) => rec.id !== movieId));
      fetchAndAddToBuffer();
    }
  };

  const handleFindSimilarItems = useCallback(
    async (itemTitleFromInput: string) => {
      setIsLoadingSimilarItems(true);
      setSimilarItemsError(null);
      setHasSearchedSimilarItems(true);
      setSimilarItems([]);
      setOriginalQueryForSimilar(itemTitleFromInput);

      trackEvent("similar_search", {
        type: recommendationType,
        query: itemTitleFromInput,
      });

      const currentStablePrefs = await getEnsuredStablePreferences();

      try {
        const items = await findSimilarItems(
          itemTitleFromInput,
          recommendationType,
          currentStablePrefs
        );
        setSimilarItems(items);
      } catch (err) {
        if (err instanceof Error) {
          setSimilarItemsError(
            err.message || `Failed to find similar ${recommendationType}.`
          );
        } else {
          setSimilarItemsError(
            `An unknown error occurred while finding similar ${recommendationType}.`
          );
        }
        setSimilarItems([]);
        trackEvent("similar_search_error", {
          query: itemTitleFromInput,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setIsLoadingSimilarItems(false);
      }
    },
    [recommendationType, getEnsuredStablePreferences]
  );

  const handleFindSimilarFromCard = (title: string) => {
    trackEvent("find_similar_from_card", { title });
    setInitialSimilarSearchQuery(title);
    handleTabChange("similarSearch");
  };

  const handleCheckTasteMatch = useCallback(
    async (itemTitle: string) => {
      setIsLoadingTasteCheck(true);
      setTasteCheckError(null);
      setHasSearchedTasteCheck(true);
      setTasteCheckResult(null);
      setTasteCheckJustification(null);
      setOriginalQueryForTasteCheck(itemTitle);

      trackEvent("taste_check_search", {
        type: recommendationType,
        query: itemTitle,
      });

      const currentStablePrefs = await getEnsuredStablePreferences();

      try {
        const result = await checkTasteMatch(
          itemTitle,
          recommendationType,
          currentStablePrefs
        );
        if (result.itemFound && result.movie) {
          setTasteCheckResult(result.movie);
          setTasteCheckJustification(result.justification);
        } else if (!result.itemFound) {
          setTasteCheckResult(null);
          setTasteCheckJustification(null);
          setTasteCheckError(
            result.error ||
              `Could not find "${itemTitle}". Please check the spelling or try another title.`
          );
        } else {
          // Found item but something else is off
          setTasteCheckResult(result.movie); // May be partially populated
          setTasteCheckJustification(result.justification);
          if (result.error) setTasteCheckError(result.error);
        }
      } catch (err) {
        if (err instanceof Error) {
          setTasteCheckError(
            err.message || `Failed to check taste match for "${itemTitle}".`
          );
        } else {
          setTasteCheckError(
            `An unknown error occurred while checking taste match for "${itemTitle}".`
          );
        }
        setTasteCheckResult(null);
        setTasteCheckJustification(null);
        trackEvent("taste_check_error", {
          query: itemTitle,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setIsLoadingTasteCheck(false);
      }
    },
    [recommendationType, getEnsuredStablePreferences]
  );

  const TabButton: React.FC<{
    tabName: ActiveTab;
    currentTab: ActiveTab;
    onClick: () => void;
    children: React.ReactNode;
    icon?: string;
  }> = ({ tabName, currentTab, onClick, children, icon }) => (
    <button
      id={`tab-${tabName}`}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center px-1.5 sm:px-3 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 whitespace-nowrap
                  ${
                    currentTab === tabName
                      ? "bg-slate-800 text-purple-300 border-b-2 border-purple-400"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
      role="tab"
      aria-selected={currentTab === tabName}
      aria-controls={`tabpanel-${tabName}`}
    >
      {icon && (
        <span
          dangerouslySetInnerHTML={{ __html: icon }}
          className="mr-1 sm:mr-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block flex-shrink-0"
        />
      )}
      {children}
    </button>
  );

  const appStyle: React.CSSProperties = {
    background: `
      radial-gradient(ellipse farthest-corner at 10% 15%, rgba(165, 180, 252, 0.06) 0%, transparent 55%),
      radial-gradient(ellipse farthest-corner at 85% 90%, rgba(192, 132, 252, 0.05) 0%, transparent 55%),
      radial-gradient(circle at 50% 50%, rgba(107, 33, 168, 0.04) 0%, transparent 45%),
      radial-gradient(ellipse farthest-corner at 90% 20%, rgba(224, 204, 252, 0.03) 0%, transparent 65%),
      linear-gradient(to bottom right, #0f172a, #4c1d95, #0f172a)
    `,
    backgroundAttachment: "fixed",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  };

  const GlobalLoadingOverlay = () => {
    if (!isLoadingTranslations) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
          <p className="text-lg font-semibold text-purple-300">
            {t("translation_loading", "Translating UI...")}
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case "loading":
        return (
          <div
            style={appStyle}
            className="flex-grow flex flex-col items-center justify-center"
          >
            <LoadingSpinner />
          </div>
        );
      case "landing":
        return <LandingPage onStartOnboarding={handleStartOnboarding} />;
      case "onboarding":
        return (
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            isEditMode={false}
          />
        );
      case "onboardingEdit":
        return (
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            initialData={stablePreferences!}
            isEditMode={true}
            onBack={handleBackToMain}
          />
        );
      case "myAccount":
        return <MyAccountPage onBackToMain={handleBackToMain} />;
      case "otherSettings":
        return <OtherSettingsPage onBackToMain={handleBackToMain} />;
      case "main":
        return (
          <div
            style={appStyle}
            className="flex-grow flex flex-col text-slate-100"
          >
            {isLoadingTrailer && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-900 rounded-lg p-8 shadow-2xl">
                  <LoadingSpinner />
                  <p className="text-slate-300 mt-4 text-center">Fetching trailer...</p>
                </div>
              </div>
            )}
            {trailerId && !isLoadingTrailer && (
              <TrailerModal
                trailerId={trailerId}
                onClose={handleCloseTrailer}
              />
            )}
            {promptToShow === "review" && (
              <ReviewPrompt
                onRate={handleRateApp}
                onDismiss={handleDismissReviewPrompt}
              />
            )}
            {promptToShow === "referral" && (
              <ReferralPrompt
                onShare={handleShareApp}
                onDismiss={handleDismissReferralPrompt}
              />
            )}
            <Header
              onEditPreferences={handleEditPreferences}
              onShowMyAccount={handleShowMyAccount}
              onShowOtherSettings={handleShowOtherSettings}
            />
            <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex flex-col items-center">
              <div className="mb-6 bg-slate-700/60 p-1 rounded-xl shadow-md w-full max-w-xs sm:max-w-sm mx-auto flex">
                <button
                  onClick={() => handleRecommendationTypeChange("movie")}
                  className={`flex-1 flex items-center justify-center px-3 py-2.5 text-sm sm:text-base rounded-lg font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 ${
                    recommendationType === "movie"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-600/70 hover:text-slate-100"
                  }`}
                  aria-pressed={recommendationType === "movie"}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ICONS.movie_toggle_icon,
                    }}
                    className="w-5 h-5 mr-2"
                  />
                  {t("movies", "Movies")}
                </button>
                <button
                  onClick={() => handleRecommendationTypeChange("series")}
                  className={`flex-1 flex items-center justify-center px-3 py-2.5 text-sm sm:text-base rounded-lg font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 ${
                    recommendationType === "series"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-600/70 hover:text-slate-100"
                  }`}
                  aria-pressed={recommendationType === "series"}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ICONS.series_toggle_icon,
                    }}
                    className="w-5 h-5 mr-2"
                  />
                  {t("series", "Series")}
                </button>
              </div>

              <nav
                className="mb-6 sm:mb-8 flex justify-center space-x-0.5 sm:space-x-1 border-b border-slate-700 w-full max-w-5xl"
                role="tablist"
              >
                <TabButton
                  tabName="recommendations"
                  currentTab={activeTab}
                  onClick={() => handleTabChange("recommendations")}
                  icon={ICONS.recommendations_tab_icon}
                >
                  <span className="hidden sm:inline">
                    {t("tab_recommendations", "Recommendations")}
                  </span>
                  <span className="inline sm:hidden">
                    {t("tab_recommendations_short", "Recs")}
                  </span>
                </TabButton>
                <TabButton
                  tabName="similarSearch"
                  currentTab={activeTab}
                  onClick={() => handleTabChange("similarSearch")}
                  icon={ICONS.similar_search_tab_icon}
                >
                  <span className="hidden sm:inline">
                    {t("tab_find_similar", "Find Similar")}
                  </span>
                  <span className="inline sm:hidden">
                    {t("tab_find_similar_short", "Similar")}
                  </span>
                </TabButton>
                <TabButton
                  tabName="tasteCheck"
                  currentTab={activeTab}
                  onClick={() => handleTabChange("tasteCheck")}
                  icon={ICONS.taste_check_tab_icon}
                >
                  <span className="hidden sm:inline">
                    {t("tab_taste_check", "Will I Like This?")}
                  </span>
                  <span className="inline sm:hidden">
                    {t("tab_taste_check_short", "Taste")}
                  </span>
                </TabButton>
                <TabButton
                  tabName="discovery"
                  currentTab={activeTab}
                  onClick={() => handleTabChange("discovery")}
                  icon={ICONS.discovery_tab_icon}
                >
                  <span className="hidden sm:inline">
                    {t("tab_discover_rate", "Discover & Rate")}
                  </span>
                  <span className="inline sm:hidden">
                    {t("tab_discover_rate_short", "Discover")}
                  </span>
                </TabButton>
                <TabButton
                  tabName="watchlist"
                  currentTab={activeTab}
                  onClick={() => handleTabChange("watchlist")}
                  icon={ICONS.watchlist_tab_icon}
                >
                  <span className="hidden sm:inline">
                    {t("tab_watchlist", "Watchlist")}
                  </span>
                  <span className="inline sm:hidden">
                    {t("tab_watchlist_short", "List")}
                  </span>
                </TabButton>
              </nav>

              <div className="w-full max-w-7xl relative flex flex-col flex-grow min-h-0">
                <section
                  id="tabpanel-recommendations"
                  role="tabpanel"
                  aria-labelledby="tab-recommendations"
                  className={`transition-opacity duration-500 ease-in-out
                      ${
                        activeTab === "recommendations"
                          ? "opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0"
                          : "opacity-0 pointer-events-none absolute inset-0"
                      }`}
                >
                  <div className="max-w-3xl mx-auto w-full">
                    <PreferenceForm
                      onSubmit={handleGetRecommendations}
                      isLoading={isLoadingRecommendations}
                      recommendationType={recommendationType}
                    />
                  </div>

                  {isLoadingRecommendations && (
                    <div
                      ref={loadingIndicatorRef}
                      className="mt-12 flex justify-center"
                    >
                      <LoadingSpinner />
                    </div>
                  )}

                  {recommendationError &&
                    (() => {
                      let title = t("error_generic_title");
                      let primaryMessage = t("error_generic_primary");
                      let secondaryAdvice = t("error_generic_secondary");

                      const lowerCaseError = recommendationError.toLowerCase();

                      if (lowerCaseError.includes("api key invalid")) {
                        title = t("error_api_key_invalid_title");
                        primaryMessage = t("error_api_key_invalid_primary");
                        secondaryAdvice = t("error_api_key_invalid_secondary");
                      } else if (
                        lowerCaseError.includes("usage limit") ||
                        lowerCaseError.includes("quota") ||
                        lowerCaseError.includes("billing")
                      ) {
                        title = t("error_usage_limit_title");
                        primaryMessage = t("error_usage_limit_primary");
                        secondaryAdvice = t("error_usage_limit_secondary");
                      } else if (lowerCaseError.includes("safety filter")) {
                        title = t("error_safety_filter_title");
                        primaryMessage = t("error_safety_filter_primary");
                        secondaryAdvice = t("error_safety_filter_secondary");
                      } else if (
                        lowerCaseError.includes("service unavailable")
                      ) {
                        title = t("error_service_unavailable_title");
                        primaryMessage = t("error_service_unavailable_primary");
                        secondaryAdvice = t(
                          "error_service_unavailable_secondary"
                        );
                      } else if (
                        lowerCaseError.includes("invalid request") ||
                        lowerCaseError.includes("malformed")
                      ) {
                        title = t("error_invalid_request_title");
                        primaryMessage = t("error_invalid_request_primary");
                        secondaryAdvice = t("error_invalid_request_secondary");
                      } else {
                        primaryMessage = recommendationError;
                      }

                      return (
                        <div className="mt-12 w-full max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-4 sm:p-6 rounded-lg shadow-xl border border-red-800/50">
                          <div className="flex items-center justify-center mb-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-8 h-8 mr-3 text-red-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                              />
                            </svg>
                            <h2 className="text-xl sm:text-2xl font-semibold">
                              {title}
                            </h2>
                          </div>
                          <p className="text-red-300 text-sm sm:text-base mb-4">
                            {primaryMessage}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-400 bg-slate-800/40 p-3 rounded-md">
                            {secondaryAdvice}
                          </p>
                        </div>
                      );
                    })()}

                  {!isLoadingRecommendations &&
                    !recommendationError &&
                    hasSearchedRecommendations &&
                    recommendations.length === 0 && (
                      <div className="mt-12 w-full max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-6 rounded-lg shadow-xl">
                        <div className="flex items-center justify-center mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8 mr-2 text-sky-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                            />
                          </svg>
                          <h2 className="text-xl sm:text-2xl font-semibold text-slate-300">
                            {recommendationType === "series"
                              ? t("no_series_found_title")
                              : t("no_movies_found_title")}
                          </h2>
                        </div>
                        <p className="text-sm sm:text-base">
                          {t("no_results_found_message", undefined, {
                            itemType: recommendationType,
                          })}
                        </p>
                      </div>
                    )}

                  {!isLoadingRecommendations &&
                    !recommendationError &&
                    recommendations.length > 0 && (
                      <div className="w-full mt-12">
                        <MovieList
                          movies={recommendations}
                          titleRef={recommendationsTitleRef}
                          titleText={
                            recommendationType === "series"
                              ? t("list_title_series_default")
                              : t("list_title_movie_default")
                          }
                          onCardFeedback={handleRecommendationFeedback}
                          onViewTrailer={handleViewTrailer}
                          onFindSimilar={handleFindSimilarFromCard}
                        />
                        {showExtensionNudge && (
                          <div className="max-w-3xl mx-auto w-full mt-6">
                            <ExtensionNudge
                              onInstallClick={handleExtensionNudgeInstall}
                              onDismiss={handleExtensionNudgeDismiss}
                            />
                          </div>
                        )}
                      </div>
                    )}

                  {/* Show nudge even when no results but user has searched */}
                  {!isLoadingRecommendations &&
                    !recommendationError &&
                    hasSearchedRecommendations &&
                    recommendations.length === 0 &&
                    showExtensionNudge && (
                      <div className="max-w-3xl mx-auto w-full mt-6">
                        <ExtensionNudge
                          onInstallClick={handleExtensionNudgeInstall}
                          onDismiss={handleExtensionNudgeDismiss}
                        />
                      </div>
                    )}

                  {!hasSearchedRecommendations &&
                    !isLoadingRecommendations &&
                    !recommendationError && (
                      <div className="max-w-3xl mx-auto w-full">
                        <WelcomeMessage itemType={recommendationType} />
                      </div>
                    )}
                </section>

                <section
                  id="tabpanel-similarSearch"
                  role="tabpanel"
                  aria-labelledby="tab-similarSearch"
                  className={`transition-opacity duration-500 ease-in-out
                      ${
                        activeTab === "similarSearch"
                          ? "opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0"
                          : "opacity-0 pointer-events-none absolute inset-0"
                      }`}
                >
                  <div className="max-w-3xl mx-auto w-full">
                    <SimilarMovieSearch
                      onSearch={handleFindSimilarItems}
                      isLoading={isLoadingSimilarItems}
                      isActive={activeTab === "similarSearch"}
                      recommendationType={recommendationType}
                      searchContext="similar"
                      initialQuery={initialSimilarSearchQuery}
                      onSearchComplete={() =>
                        setInitialSimilarSearchQuery(null)
                      }
                    />
                  </div>
                  {isLoadingSimilarItems && (
                    <div className="mt-8 flex justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                  {similarItemsError &&
                    (() => {
                      let title = t("similar_search_failed_title");
                      let primaryMessage = t("similar_search_failed_primary");
                      let secondaryAdvice = t(
                        "similar_search_failed_secondary"
                      );

                      const lowerCaseError = similarItemsError.toLowerCase();

                      if (lowerCaseError.includes("api key invalid")) {
                        title = t("error_api_key_invalid_title");
                        primaryMessage = t("similar_search_api_key_error");
                        secondaryAdvice = "";
                      } else if (
                        lowerCaseError.includes("usage limit") ||
                        lowerCaseError.includes("quota") ||
                        lowerCaseError.includes("billing")
                      ) {
                        title = t("error_usage_limit_title");
                        primaryMessage = t("similar_search_usage_limit_error");
                        secondaryAdvice = "";
                      } else if (lowerCaseError.includes("safety filter")) {
                        title = t("error_safety_filter_title");
                        primaryMessage = t("similar_search_safety_error");
                        secondaryAdvice = "";
                      } else {
                        primaryMessage = similarItemsError;
                      }

                      return (
                        <div className="mt-8 max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-4 rounded-lg shadow-xl">
                          <h3 className="text-lg font-semibold mb-2">
                            {title}
                          </h3>
                          <p className="text-red-300 text-sm mb-3">
                            {primaryMessage}
                          </p>
                          <p className="text-xs text-slate-400">
                            {secondaryAdvice}
                          </p>
                        </div>
                      );
                    })()}

                  {!isLoadingSimilarItems &&
                    hasSearchedSimilarItems &&
                    similarItems.length > 0 &&
                    originalQueryForSimilar && (
                      <div className="w-full mt-12">
                        <MovieList
                          movies={similarItems}
                          titleRef={similarItemsTitleRef}
                          titleText={t("list_title_more_like", undefined, {
                            itemType:
                              recommendationType === "series"
                                ? "Series"
                                : "Movies",
                            title: originalQueryForSimilar,
                          })}
                          onViewTrailer={handleViewTrailer}
                          onFindSimilar={handleFindSimilarFromCard}
                        />
                      </div>
                    )}

                  {!isLoadingSimilarItems &&
                    hasSearchedSimilarItems &&
                    similarItems.length === 0 &&
                    originalQueryForSimilar && (
                      <div className="mt-8 max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-4 rounded-lg shadow-xl">
                        <p>
                          {t("similar_search_not_found", undefined, {
                            itemType: recommendationType,
                            query: originalQueryForSimilar,
                          })}
                        </p>
                      </div>
                    )}
                </section>

                <section
                  id="tabpanel-tasteCheck"
                  role="tabpanel"
                  aria-labelledby="tab-tasteCheck"
                  className={`transition-opacity duration-500 ease-in-out
                      ${
                        activeTab === "tasteCheck"
                          ? "opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0"
                          : "opacity-0 pointer-events-none absolute inset-0"
                      }`}
                >
                  <div className="max-w-3xl mx-auto w-full">
                    <SimilarMovieSearch
                      onSearch={handleCheckTasteMatch}
                      isLoading={isLoadingTasteCheck}
                      isActive={activeTab === "tasteCheck"}
                      recommendationType={recommendationType}
                      searchContext="tasteCheck"
                    />
                  </div>
                  {isLoadingTasteCheck && (
                    <div className="mt-8 flex justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                  {tasteCheckError &&
                    (() => {
                      let title = t("taste_check_analysis_failed_title");
                      let primaryMessage = t(
                        "taste_check_analysis_failed_primary"
                      );
                      let secondaryAdvice = t(
                        "taste_check_analysis_failed_secondary"
                      );

                      const lowerCaseError = tasteCheckError.toLowerCase();

                      if (lowerCaseError.includes("api key invalid")) {
                        title = t("error_api_key_invalid_title");
                        primaryMessage = t("taste_check_api_key_error");
                        secondaryAdvice = "";
                      } else if (
                        lowerCaseError.includes("usage limit") ||
                        lowerCaseError.includes("quota") ||
                        lowerCaseError.includes("billing")
                      ) {
                        title = t("error_usage_limit_title");
                        primaryMessage = t("taste_check_usage_limit_error");
                        secondaryAdvice = "";
                      } else if (lowerCaseError.includes("safety filter")) {
                        title = t("error_safety_filter_title");
                        primaryMessage = t("taste_check_safety_error");
                        secondaryAdvice = "";
                      } else {
                        primaryMessage = tasteCheckError;
                      }

                      return (
                        <div className="mt-8 max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-6 rounded-lg shadow-xl">
                          <div className="flex items-center justify-center mb-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-8 h-8 mr-2 text-red-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                              />
                            </svg>
                            <h2 className="text-xl font-semibold">{title}</h2>
                          </div>
                          <p className="text-red-300 mb-3">{primaryMessage}</p>
                          <p className="text-xs text-slate-400">
                            {secondaryAdvice}
                          </p>
                        </div>
                      );
                    })()}
                  {hasSearchedTasteCheck &&
                    !isLoadingTasteCheck &&
                    !tasteCheckError &&
                    tasteCheckResult && (
                      <div className="mt-8">
                        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                          {t("taste_check_result_title", undefined, {
                            query: originalQueryForTasteCheck,
                          })}
                        </h2>
                        <div className="max-w-sm mx-auto">
                          <MovieCard
                            movie={{
                              ...tasteCheckResult,
                              matchScore: tasteCheckResult.matchScore,
                            }}
                            isSearchResult={false}
                            onViewTrailer={handleViewTrailer}
                            onFindSimilar={handleFindSimilarFromCard}
                          />
                        </div>
                        {tasteCheckJustification && (
                          <div className="mt-6 p-4 sm:p-6 bg-slate-700/60 backdrop-blur-sm rounded-lg shadow-lg max-w-xl mx-auto">
                            <h4 className="text-lg sm:text-xl font-semibold text-purple-300 mb-2 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6 mr-2 text-purple-300"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.055 15.055 0 0 1-4.5 0m4.5 0 3.06-3.06m-3.06 3.06a2.25 2.25 0 0 1 3.06 0M12 6.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 0a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"
                                />
                              </svg>
                              {t("card_justification_prefix")}
                            </h4>
                            <p className="text-slate-200 whitespace-pre-line text-sm sm:text-base">
                              {tasteCheckJustification}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  {hasSearchedTasteCheck &&
                    !isLoadingTasteCheck &&
                    !tasteCheckError &&
                    !tasteCheckResult && (
                      <div className="mt-8 max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-6 rounded-lg shadow-xl">
                        <div className="flex items-center justify-center mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8 mr-2 text-sky-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                            />
                          </svg>
                          <h2 className="text-xl sm:text-2xl font-semibold text-slate-300">
                            {t("taste_check_inconclusive_title")}
                          </h2>
                        </div>
                        <p>
                          {t("taste_check_inconclusive_message", undefined, {
                            query: originalQueryForTasteCheck,
                            itemType: recommendationType,
                          })}
                        </p>
                      </div>
                    )}
                </section>

                <section
                  id="tabpanel-discovery"
                  role="tabpanel"
                  aria-labelledby="tab-discovery"
                  className={`transition-opacity duration-500 ease-in-out
                      ${
                        activeTab === "discovery"
                          ? "opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0"
                          : "opacity-0 pointer-events-none absolute inset-0"
                      }`}
                >
                  <DiscoveryView
                    isActive={activeTab === "discovery"}
                    recommendationType={recommendationType}
                  />
                </section>

                <section
                  id="tabpanel-watchlist"
                  role="tabpanel"
                  aria-labelledby="tab-watchlist"
                  className={`transition-opacity duration-500 ease-in-out
                      ${
                        activeTab === "watchlist"
                          ? "opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0"
                          : "opacity-0 pointer-events-none absolute inset-0"
                      }`}
                >
                  <WatchlistView isActive={activeTab === "watchlist"} />
                </section>
              </div>
            </main>
            <Footer />
          </div>
        );
      default:
        return null; // Should not happen
    }
  };

  return (
    <>
      <GlobalLoadingOverlay />
      {renderContent()}
    </>
  );
};

export default App;
