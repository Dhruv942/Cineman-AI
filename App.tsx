import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PreferenceForm } from './components/PreferenceForm';
import { MovieList } from './components/MovieList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import { getMovieRecommendations, findSimilarItemByName, getMoreSimilarItems, checkTasteMatch } from './services/geminiService';
import type { UserPreferences, Movie, SessionPreferences, StableUserPreferences, ActiveTab, CurrentAppView, RecommendationType } from './types';
import { WelcomeMessage } from './components/WelcomeMessage';
import { SimilarMovieSearch } from './components/SimilarMovieSearch';
import { MovieCard } from './components/MovieCard';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DiscoveryView } from './components/DiscoveryView';
import { MyAccountPage } from './components/MyAccountPage';
import { OtherSettingsPage } from './components/OtherSettingsPage';
import { WatchPartyView } from './components/WatchPartyView';
import { CINE_SUGGEST_ONBOARDING_COMPLETE_KEY, CINE_SUGGEST_STABLE_PREFERENCES_KEY, MOVIE_FREQUENCIES, ACTOR_DIRECTOR_PREFERENCES, MOVIE_LANGUAGES, MOVIE_ERAS, MOVIE_DURATIONS, SERIES_SEASON_COUNTS, ICONS, COUNTRIES } from './constants';


const getDefaultStablePreferences = (): StableUserPreferences => {
  const defaultLang = MOVIE_LANGUAGES.find(l => l.code === 'any')?.code || 'any';
  const defaultCountry = COUNTRIES.find(c => c.code === 'any')?.code || 'any';
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
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [hasSearchedRecommendations, setHasSearchedRecommendations] = useState<boolean>(false);

  const [similarItemResult, setSimilarItemResult] = useState<Movie | null>(null);
  const [isLoadingSimilarItem, setIsLoadingSimilarItem] = useState<boolean>(false);
  const [similarItemError, setSimilarItemError] = useState<string | null>(null);
  const [hasSearchedSimilarItem, setHasSearchedSimilarItem] = useState<boolean>(false);
  const [originalQueryTextForSimilarSearch, setOriginalQueryTextForSimilarSearch] = useState<string | null>(null);

  const [additionalSimilarItems, setAdditionalSimilarItems] = useState<Movie[]>([]);
  const [isLoadingAdditionalSimilar, setIsLoadingAdditionalSimilar] = useState<boolean>(false);
  const [additionalSimilarError, setAdditionalSimilarError] = useState<string | null>(null);
  const [hasAttemptedViewMore, setHasAttemptedViewMore] = useState<boolean>(false);

  // State for "Will I Like This?" feature
  const [tasteCheckResult, setTasteCheckResult] = useState<Movie | null>(null);
  const [isLoadingTasteCheck, setIsLoadingTasteCheck] = useState<boolean>(false);
  const [tasteCheckError, setTasteCheckError] = useState<string | null>(null);
  const [hasSearchedTasteCheck, setHasSearchedTasteCheck] = useState<boolean>(false);
  const [tasteCheckJustification, setTasteCheckJustification] = useState<string | null>(null);
  const [originalQueryForTasteCheck, setOriginalQueryForTasteCheck] = useState<string | null>(null);


  const [activeTab, setActiveTab] = useState<ActiveTab>('recommendations');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false); 
  const [stablePreferences, setStablePreferences] = useState<StableUserPreferences | null>(null);
  const [recommendationType, setRecommendationType] = useState<RecommendationType>('movie');

  const [currentAppView, setCurrentAppView] = useState<CurrentAppView>('main');


  const recommendationsTitleRef = useRef<HTMLHeadingElement>(null);
  const additionalSimilarTitleRef = useRef<HTMLHeadingElement>(null);
  const loadingIndicatorRef = useRef<HTMLDivElement>(null);

  const getEnsuredStablePreferences = useCallback((): StableUserPreferences => {
    if (stablePreferences) {
      return stablePreferences;
    }
    const storedPrefsString = localStorage.getItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY);
    const defaultValues = getDefaultStablePreferences();
    if (storedPrefsString) {
      try {
        const parsedPrefs = JSON.parse(storedPrefsString) as Partial<StableUserPreferences>;
        const validatedPrefs: StableUserPreferences = {
          ...defaultValues,
          ...parsedPrefs,
          era: Array.isArray(parsedPrefs.era) && parsedPrefs.era.length > 0 ? parsedPrefs.era : defaultValues.era,
          movieDuration: Array.isArray(parsedPrefs.movieDuration) && parsedPrefs.movieDuration.length > 0 ? parsedPrefs.movieDuration : defaultValues.movieDuration,
          preferredNumberOfSeasons: Array.isArray(parsedPrefs.preferredNumberOfSeasons) && parsedPrefs.preferredNumberOfSeasons.length > 0 ? parsedPrefs.preferredNumberOfSeasons : defaultValues.preferredNumberOfSeasons,
          preferredLanguages: Array.isArray(parsedPrefs.preferredLanguages) && parsedPrefs.preferredLanguages.length > 0 ? parsedPrefs.preferredLanguages : defaultValues.preferredLanguages,
          country: typeof parsedPrefs.country === 'string' && COUNTRIES.some(c => c.code === parsedPrefs.country) ? parsedPrefs.country : defaultValues.country,
        };
        setStablePreferences(validatedPrefs); // Update state as well
        return validatedPrefs;
      } catch (e) {
        console.error("Failed to parse stable preferences during get, using defaults.", e);
        setStablePreferences(defaultValues); // Update state
        localStorage.setItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY, JSON.stringify(defaultValues));
        return defaultValues;
      }
    }
    setStablePreferences(defaultValues); // Update state
    localStorage.setItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY, JSON.stringify(defaultValues));
    return defaultValues;
  }, [stablePreferences]);


  useEffect(() => {
    const onboardingComplete = localStorage.getItem(CINE_SUGGEST_ONBOARDING_COMPLETE_KEY);
    if (!onboardingComplete) {
      setShowOnboarding(true);
      setCurrentAppView('main');
    } else {
      setShowOnboarding(false);
      const currentPrefs = getEnsuredStablePreferences();
      if (!stablePreferences) { 
          setStablePreferences(currentPrefs);
      }
    }
  }, [getEnsuredStablePreferences, stablePreferences]);

  useEffect(() => {
    if (currentAppView === 'main' && activeTab === 'recommendations' && recommendations.length > 0 && !isLoadingRecommendations && hasSearchedRecommendations) {
      const timer = setTimeout(() => {
        if (recommendationsTitleRef.current) {
          recommendationsTitleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [recommendations, isLoadingRecommendations, hasSearchedRecommendations, activeTab, currentAppView]);

  useEffect(() => {
    if (currentAppView === 'main' && activeTab === 'similarSearch' && additionalSimilarItems.length > 0 && !isLoadingAdditionalSimilar && hasAttemptedViewMore) {
      const timer = setTimeout(() => {
        if (additionalSimilarTitleRef.current) {
          additionalSimilarTitleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [additionalSimilarItems, isLoadingAdditionalSimilar, hasAttemptedViewMore, activeTab, currentAppView]);


  const handleOnboardingComplete = (completedStablePreferences: StableUserPreferences) => {
    setStablePreferences(completedStablePreferences);
    setShowOnboarding(false);
    setCurrentAppView('main');
  };

  const handleEditPreferences = () => {
    setCurrentAppView('onboardingEdit');
  };

  const handleShowMyAccount = () => {
    setCurrentAppView('myAccount');
  };

  const handleShowOtherSettings = () => {
    setCurrentAppView('otherSettings');
  };

  const handleBackToMain = () => {
    setCurrentAppView('main');
  };


  const clearAllTabData = () => {
      setRecommendations([]);
      setHasSearchedRecommendations(false);
      setRecommendationError(null);
      
      setSimilarItemResult(null);
      setHasSearchedSimilarItem(false);
      setSimilarItemError(null);
      setOriginalQueryTextForSimilarSearch(null);

      setAdditionalSimilarItems([]);
      setAdditionalSimilarError(null);
      setHasAttemptedViewMore(false);

      setTasteCheckResult(null);
      setTasteCheckJustification(null);
      setHasSearchedTasteCheck(false);
      setTasteCheckError(null);
      setOriginalQueryForTasteCheck(null);
  };

  const handleTabChange = (newTab: ActiveTab) => {
    if (activeTab !== newTab) { 
        clearAllTabData();
    }
    setActiveTab(newTab);
  };
  
  const handleRecommendationTypeChange = (newType: RecommendationType) => {
    if (recommendationType !== newType) {
        setRecommendationType(newType);
        clearAllTabData(); 
    }
  };


  const handleGetRecommendations = useCallback(async (sessionPreferences: SessionPreferences) => {
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    setHasSearchedRecommendations(true);
    setRecommendations([]);

    setTimeout(() => {
        if (loadingIndicatorRef.current) {
            loadingIndicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 0);

    const currentStablePrefs = getEnsuredStablePreferences();

    const fullPreferences: UserPreferences = {
      ...currentStablePrefs,
      ...sessionPreferences,
    };

    try {
      const items = await getMovieRecommendations(fullPreferences, recommendationType);
      setRecommendations(items);
    } catch (err) {
      if (err instanceof Error) {
        setRecommendationError(err.message || `Failed to fetch ${recommendationType === 'series' ? 'series' : 'movie'} recommendations. Please check your API key and try again.`);
      } else {
        setRecommendationError(`An unknown error occurred while fetching ${recommendationType === 'series' ? 'series' : 'movie'} recommendations.`);
      }
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [getEnsuredStablePreferences, recommendationType]);

  const handleFindSimilarItem = useCallback(async (itemTitleFromInput: string) => {
    setIsLoadingSimilarItem(true);
    setSimilarItemError(null);
    setHasSearchedSimilarItem(true);
    setSimilarItemResult(null);
    setOriginalQueryTextForSimilarSearch(itemTitleFromInput);

    setAdditionalSimilarItems([]);
    setAdditionalSimilarError(null);
    setIsLoadingAdditionalSimilar(false); 
    setHasAttemptedViewMore(false);

    const currentStablePrefs = getEnsuredStablePreferences();

    try {
      const item = await findSimilarItemByName(itemTitleFromInput, recommendationType, currentStablePrefs);
      setSimilarItemResult(item);
    } catch (err) {
      if (err instanceof Error) {
        setSimilarItemError(err.message || `Failed to find similar ${recommendationType}.`);
      } else {
        setSimilarItemError(`An unknown error occurred while finding similar ${recommendationType}.`);
      }
      setSimilarItemResult(null);
    } finally {
      setIsLoadingSimilarItem(false);
    }
  }, [recommendationType, getEnsuredStablePreferences]);

  const handleViewMoreSimilarItems = useCallback(async (
    queryTextForPrompt: string, 
    contextualYearForPrompt: number, 
    actualItemIdToExclude: string | undefined
  ) => {
    setIsLoadingAdditionalSimilar(true);
    setAdditionalSimilarError(null);
    setAdditionalSimilarItems([]);
    setHasAttemptedViewMore(true);
    
    const currentStablePrefs = getEnsuredStablePreferences();

    try {
      const items = await getMoreSimilarItems(queryTextForPrompt, contextualYearForPrompt, recommendationType, actualItemIdToExclude, currentStablePrefs);
      setAdditionalSimilarItems(items);
    } catch (err) {
      if (err instanceof Error) {
        setAdditionalSimilarError(err.message || `Failed to fetch more similar ${recommendationType}s.`);
      } else {
        setAdditionalSimilarError(`An unknown error occurred while fetching more similar ${recommendationType}s.`);
      }
      setAdditionalSimilarItems([]);
    } finally {
      setIsLoadingAdditionalSimilar(false);
    }
  }, [recommendationType, getEnsuredStablePreferences]);

  const handleCheckTasteMatch = useCallback(async (itemTitle: string) => {
    setIsLoadingTasteCheck(true);
    setTasteCheckError(null);
    setHasSearchedTasteCheck(true);
    setTasteCheckResult(null);
    setTasteCheckJustification(null);
    setOriginalQueryForTasteCheck(itemTitle);

    const currentStablePrefs = getEnsuredStablePreferences();

    try {
      const result = await checkTasteMatch(itemTitle, recommendationType, currentStablePrefs);
      if (result.itemFound && result.movie) {
        setTasteCheckResult(result.movie);
        setTasteCheckJustification(result.justification);
      } else if (!result.itemFound) {
        setTasteCheckResult(null);
        setTasteCheckJustification(null);
        setTasteCheckError(result.error || `Could not find "${itemTitle}". Please check the spelling or try another title.`);
      } else { // Found item but something else is off
        setTasteCheckResult(result.movie); // May be partially populated
        setTasteCheckJustification(result.justification);
        if (result.error) setTasteCheckError(result.error);
      }
    } catch (err) {
      if (err instanceof Error) {
        setTasteCheckError(err.message || `Failed to check taste match for "${itemTitle}".`);
      } else {
        setTasteCheckError(`An unknown error occurred while checking taste match for "${itemTitle}".`);
      }
      setTasteCheckResult(null);
      setTasteCheckJustification(null);
    } finally {
      setIsLoadingTasteCheck(false);
    }
  }, [recommendationType, getEnsuredStablePreferences]);


  const TabButton: React.FC<{tabName: ActiveTab; currentTab: ActiveTab; onClick: () => void; children: React.ReactNode, icon?: string}> =
    ({ tabName, currentTab, onClick, children, icon }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center px-2.5 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
                  ${currentTab === tabName
                    ? 'bg-slate-800 text-purple-300 border-b-2 border-purple-400'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
      role="tab"
      aria-selected={currentTab === tabName}
    >
      {icon && <span dangerouslySetInnerHTML={{ __html: icon }} className="mr-1 sm:mr-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block" />}
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
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} isEditMode={false} />;
  }

  if (currentAppView === 'onboardingEdit' && stablePreferences) {
    return <OnboardingWizard
              onComplete={handleOnboardingComplete}
              initialData={stablePreferences}
              isEditMode={true}
              onBack={handleBackToMain}
           />;
  }

  if (currentAppView === 'myAccount') {
    return <MyAccountPage onBackToMain={handleBackToMain} />;
  }

  if (currentAppView === 'otherSettings') {
    return <OtherSettingsPage onBackToMain={handleBackToMain} />;
  }

  return (
    <div style={appStyle} className="flex-grow flex flex-col text-slate-100">
      <Header
        onEditPreferences={handleEditPreferences}
        onShowMyAccount={handleShowMyAccount}
        onShowOtherSettings={handleShowOtherSettings}
      />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-8 flex flex-col items-center">

        <div className="mb-6 bg-slate-700/60 p-1 rounded-xl shadow-md w-full max-w-xs sm:max-w-sm mx-auto flex">
            <button
                onClick={() => handleRecommendationTypeChange('movie')}
                className={`flex-1 flex items-center justify-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 ${
                recommendationType === 'movie'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-600/70 hover:text-slate-100'
                }`}
                aria-pressed={recommendationType === 'movie'}
            >
                <span dangerouslySetInnerHTML={{ __html: ICONS.movie_toggle_icon }} className="w-5 h-5 mr-2" />
                Movies
            </button>
            <button
                onClick={() => handleRecommendationTypeChange('series')}
                className={`flex-1 flex items-center justify-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 ${
                recommendationType === 'series'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-600/70 hover:text-slate-100'
                }`}
                aria-pressed={recommendationType === 'series'}
            >
                <span dangerouslySetInnerHTML={{ __html: ICONS.series_toggle_icon }} className="w-5 h-5 mr-2" />
                Series
            </button>
        </div>

        <nav className="mb-8 flex justify-center space-x-0.5 sm:space-x-1 border-b border-slate-700 w-full max-w-5xl" role="tablist">
          <TabButton tabName="recommendations" currentTab={activeTab} onClick={() => handleTabChange('recommendations')} icon={ICONS.recommendations_tab_icon}>
            Recommendations
          </TabButton>
          <TabButton tabName="similarSearch" currentTab={activeTab} onClick={() => handleTabChange('similarSearch')} icon={ICONS.similar_search_tab_icon}>
            Find Similar
          </TabButton>
           <TabButton tabName="tasteCheck" currentTab={activeTab} onClick={() => handleTabChange('tasteCheck')} icon={ICONS.taste_check_tab_icon}>
            Will I Like This?
          </TabButton>
          <TabButton tabName="discovery" currentTab={activeTab} onClick={() => handleTabChange('discovery')} icon={ICONS.discovery_tab_icon}>
            Discover & Rate
          </TabButton>
          <TabButton tabName="watchParty" currentTab={activeTab} onClick={() => handleTabChange('watchParty')} icon={ICONS.watch_party_tab_icon}>
            Watch Party
          </TabButton>
        </nav>

        <div className="w-full max-w-7xl relative flex flex-col flex-grow min-h-0">
          <section
            role="tabpanel"
            aria-labelledby="tab-recommendations"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'recommendations'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' 
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <div className="max-w-3xl mx-auto">
              <PreferenceForm 
                onSubmit={handleGetRecommendations} 
                isLoading={isLoadingRecommendations}
                recommendationType={recommendationType} 
              />
            </div>

            {isLoadingRecommendations && (
              <div ref={loadingIndicatorRef} className="mt-12 flex justify-center">
                <LoadingSpinner />
              </div>
            )}

            {recommendationError && (
              <div className="mt-12 w-full max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-6 rounded-lg shadow-xl">
                <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-2 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <h2 className="text-2xl font-semibold">Oops! Something went wrong.</h2>
                </div>
                <p className="text-red-300">{recommendationError}</p>
                <p className="mt-4 text-sm text-slate-400">
                  Please ensure your Gemini API key is correctly configured and try adjusting your preferences.
                </p>
              </div>
            )}

            {!isLoadingRecommendations && !recommendationError && hasSearchedRecommendations && recommendations.length === 0 && (
              <div className="mt-12 w-full max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-6 rounded-lg shadow-xl">
                <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-2 text-sky-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <h2 className="text-2xl font-semibold text-slate-300">No {recommendationType === 'series' ? 'Series' : 'Movies'} Found</h2>
                </div>
                <p>We couldn't find any {recommendationType === 'series' ? 'series' : 'movies'} matching your criteria. Try adjusting your preferences for a wider search!</p>
              </div>
            )}

            {!isLoadingRecommendations && !recommendationError && recommendations.length > 0 && (
              <div className="w-full mt-12">
                <MovieList 
                    movies={recommendations} 
                    titleRef={recommendationsTitleRef} 
                    titleText={recommendationType === 'series' ? "Your Personalised Series Recommendations" : "Your Personalised Movie Recommendations"}
                />
              </div>
            )}

            {!hasSearchedRecommendations && !isLoadingRecommendations && !recommendationError && (
              <div className="max-w-3xl mx-auto">
                <WelcomeMessage itemType={recommendationType} />
              </div>
            )}
          </section>

          <section
            role="tabpanel"
            aria-labelledby="tab-similarSearch"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'similarSearch'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' 
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <div className="max-w-3xl mx-auto">
              <SimilarMovieSearch
                onSearch={handleFindSimilarItem}
                isLoading={isLoadingSimilarItem}
                isActive={activeTab === 'similarSearch'}
                recommendationType={recommendationType}
                searchContext="similar"
              />
            </div>
            {isLoadingSimilarItem && (
              <div className="mt-8 flex justify-center">
                <LoadingSpinner />
              </div>
            )}
            {similarItemError && (
              <div className="mt-8 max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-4 rounded-lg shadow-xl">
                <p>{similarItemError}</p>
              </div>
            )}
            {hasSearchedSimilarItem && !isLoadingSimilarItem && !similarItemError && similarItemResult && originalQueryTextForSimilarSearch && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
                  Similar to "{originalQueryTextForSimilarSearch}":
                </h2>
                <div className="max-w-sm mx-auto">
                  <MovieCard movie={similarItemResult} isSearchResult={true} />
                </div>
                <div className="mt-8 text-center max-w-3xl mx-auto">
                  {!isLoadingAdditionalSimilar && (
                    <button
                      onClick={() => {
                        if (similarItemResult) { 
                           handleViewMoreSimilarItems(similarItemResult.title, similarItemResult.year, similarItemResult.id);
                        }
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
                      aria-label={`View more ${recommendationType}s similar to ${similarItemResult.title}`}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 inline">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h3m-3 0V7.5m0 3V13.5" />
                      </svg>
                      View More Like This
                    </button>
                  )}
                </div>
              </div>
            )}
            {isLoadingAdditionalSimilar && (
              <div className="mt-8 flex justify-center">
                <LoadingSpinner /> 
              </div>
            )}
            {additionalSimilarError && (
              <div className="mt-8 max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-4 rounded-lg shadow-xl">
                <p>{additionalSimilarError}</p>
              </div>
            )}
            {!isLoadingAdditionalSimilar && !additionalSimilarError && hasAttemptedViewMore && additionalSimilarItems.length === 0 && originalQueryTextForSimilarSearch && (
               <div className="mt-8 max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-4 rounded-lg shadow-xl">
                <p>No more similar {recommendationType}s found for "{originalQueryTextForSimilarSearch}".</p>
              </div>
            )}
            {!isLoadingAdditionalSimilar && !additionalSimilarError && additionalSimilarItems.length > 0 && originalQueryTextForSimilarSearch && (
              <div className="w-full mt-12">
                 <MovieList 
                    movies={additionalSimilarItems} 
                    titleRef={additionalSimilarTitleRef} 
                    titleText={`More ${recommendationType === 'series' ? 'Series' : 'Movies'} Like "${similarItemResult?.title || originalQueryTextForSimilarSearch}"`}
                  />
              </div>
            )}
            {hasSearchedSimilarItem && !isLoadingSimilarItem && !similarItemError && !similarItemResult && originalQueryTextForSimilarSearch && (
              <div className="mt-8 max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-4 rounded-lg shadow-xl">
                <p>Could not find a distinct {recommendationType === 'series' ? 'series' : 'movie'} similar to "{originalQueryTextForSimilarSearch}". Try a different title or check for typos.</p>
              </div>
            )}
          </section>

          <section
            role="tabpanel"
            aria-labelledby="tab-tasteCheck"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'tasteCheck'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' 
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <div className="max-w-3xl mx-auto">
              <SimilarMovieSearch
                onSearch={handleCheckTasteMatch}
                isLoading={isLoadingTasteCheck}
                isActive={activeTab === 'tasteCheck'}
                recommendationType={recommendationType}
                searchContext="tasteCheck"
              />
            </div>
            {isLoadingTasteCheck && (
              <div className="mt-8 flex justify-center">
                <LoadingSpinner />
              </div>
            )}
            {tasteCheckError && (
              <div className="mt-8 max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-6 rounded-lg shadow-xl">
                 <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-2 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <h2 className="text-xl font-semibold">Analysis Failed</h2>
                </div>
                <p className="text-red-300">{tasteCheckError}</p>
              </div>
            )}
            {hasSearchedTasteCheck && !isLoadingTasteCheck && !tasteCheckError && tasteCheckResult && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  Taste Analysis for "{originalQueryForTasteCheck}"
                </h2>
                <div className="max-w-sm mx-auto">
                  <MovieCard movie={{...tasteCheckResult, matchScore: tasteCheckResult.matchScore}} isSearchResult={false} />
                </div>
                {tasteCheckJustification && (
                  <div className="mt-6 p-4 sm:p-6 bg-slate-700/60 backdrop-blur-sm rounded-lg shadow-lg max-w-xl mx-auto">
                    <h4 className="text-lg sm:text-xl font-semibold text-purple-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-purple-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.055 15.055 0 0 1-4.5 0m4.5 0 3.06-3.06m-3.06 3.06a2.25 2.25 0 0 1 3.06 0M12 6.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 0a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                      </svg>
                      Why you might (or might not) like it:
                    </h4>
                    <p className="text-slate-200 whitespace-pre-line text-sm sm:text-base">{tasteCheckJustification}</p>
                  </div>
                )}
              </div>
            )}
             {hasSearchedTasteCheck && !isLoadingTasteCheck && !tasteCheckError && !tasteCheckResult && (
              <div className="mt-8 max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-6 rounded-lg shadow-xl">
                 <div className="flex items-center justify-center mb-2">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-2 text-sky-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <h2 className="text-2xl font-semibold text-slate-300">Analysis Inconclusive</h2>
                </div>
                <p>We couldn't provide a taste analysis for "{originalQueryForTasteCheck}". This might be because the {recommendationType} wasn't found, or there was an issue with the analysis.</p>
              </div>
            )}
          </section>

          <section
            role="tabpanel"
            aria-labelledby="tab-discovery"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'discovery'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' 
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <DiscoveryView isActive={activeTab === 'discovery'} recommendationType={recommendationType} />
          </section>

          <section
            role="tabpanel"
            aria-labelledby="tab-watchParty"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'watchParty'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' 
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <WatchPartyView isActive={activeTab === 'watchParty'} recommendationType={recommendationType} />
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;