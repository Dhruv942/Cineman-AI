
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PreferenceForm } from './components/PreferenceForm';
import { MovieList } from './components/MovieList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import { getMovieRecommendations, findSimilarMovieByName, getMoreSimilarMovies } from './services/geminiService';
import type { UserPreferences, Movie, SessionPreferences, StableUserPreferences, ActiveTab, CurrentAppView } from './types';
import { WelcomeMessage } from './components/WelcomeMessage';
import { SimilarMovieSearch } from './components/SimilarMovieSearch';
import { MovieCard } from './components/MovieCard';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DiscoveryView } from './components/DiscoveryView';
import { MyAccountPage } from './components/MyAccountPage';
import { OtherSettingsPage } from './components/OtherSettingsPage';
import { CINE_SUGGEST_ONBOARDING_COMPLETE_KEY, CINE_SUGGEST_STABLE_PREFERENCES_KEY, MOVIE_FREQUENCIES, ACTOR_DIRECTOR_PREFERENCES, MOVIE_LANGUAGES, MOVIE_ERAS, MOVIE_DURATIONS, ICONS } from './constants';
import { saveMovieFeedback } from './services/feedbackService';


const getDefaultStablePreferences = (): StableUserPreferences => {
  const defaultLang = MOVIE_LANGUAGES.find(l => l.code === 'any')?.code || 'any';
  return {
    movieFrequency: MOVIE_FREQUENCIES[1],
    actorDirectorPreference: ACTOR_DIRECTOR_PREFERENCES[0],
    preferredLanguages: [defaultLang],
    ottPlatforms: [],
    era: [MOVIE_ERAS[0]],
    movieDuration: [MOVIE_DURATIONS[0]],
  };
};


const App: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [hasSearchedRecommendations, setHasSearchedRecommendations] = useState<boolean>(false);

  const [similarMovieResult, setSimilarMovieResult] = useState<Movie | null>(null);
  const [isLoadingSimilarMovie, setIsLoadingSimilarMovie] = useState<boolean>(false);
  const [similarMovieError, setSimilarMovieError] = useState<string | null>(null);
  const [hasSearchedSimilarMovie, setHasSearchedSimilarMovie] = useState<boolean>(false);
  const [originalQueryTextForSimilarSearch, setOriginalQueryTextForSimilarSearch] = useState<string | null>(null);


  // State for "View More Similar Movies"
  const [additionalSimilarMovies, setAdditionalSimilarMovies] = useState<Movie[]>([]);
  const [isLoadingAdditionalSimilar, setIsLoadingAdditionalSimilar] = useState<boolean>(false);
  const [additionalSimilarError, setAdditionalSimilarError] = useState<string | null>(null);
  const [hasAttemptedViewMore, setHasAttemptedViewMore] = useState<boolean>(false);


  const [activeTab, setActiveTab] = useState<ActiveTab>('recommendations');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false); // For initial onboarding only
  const [stablePreferences, setStablePreferences] = useState<StableUserPreferences | null>(null);

  const [currentAppView, setCurrentAppView] = useState<CurrentAppView>('main');


  const recommendationsTitleRef = useRef<HTMLHeadingElement>(null);
  const additionalSimilarTitleRef = useRef<HTMLHeadingElement>(null);
  const loadingIndicatorRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const onboardingComplete = localStorage.getItem(CINE_SUGGEST_ONBOARDING_COMPLETE_KEY);
    if (!onboardingComplete) {
      setShowOnboarding(true);
      setCurrentAppView('main');
    } else {
      setShowOnboarding(false);
      const storedStablePrefsString = localStorage.getItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY);
      if (storedStablePrefsString) {
        try {
          const parsedPrefs = JSON.parse(storedStablePrefsString) as Partial<StableUserPreferences>;
          const validatedPrefs: StableUserPreferences = {
            ...getDefaultStablePreferences(),
            ...parsedPrefs,
            era: Array.isArray(parsedPrefs.era) ? parsedPrefs.era : (parsedPrefs.era ? [parsedPrefs.era] : [MOVIE_ERAS[0]]),
            movieDuration: Array.isArray(parsedPrefs.movieDuration) ? parsedPrefs.movieDuration : (parsedPrefs.movieDuration ? [parsedPrefs.movieDuration] : [MOVIE_DURATIONS[0]]),
          };
          setStablePreferences(validatedPrefs);
        } catch (e) {
          console.error("Failed to parse stable preferences, using defaults.", e);
          const defaultPrefs = getDefaultStablePreferences();
          setStablePreferences(defaultPrefs);
           localStorage.setItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY, JSON.stringify(defaultPrefs));
        }
      } else {
         console.warn("Onboarding complete but no stable preferences found. Using defaults.");
         const defaultPrefs = getDefaultStablePreferences();
         setStablePreferences(defaultPrefs);
         localStorage.setItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY, JSON.stringify(defaultPrefs));
      }
    }
  }, []);

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
    if (currentAppView === 'main' && activeTab === 'similarSearch' && additionalSimilarMovies.length > 0 && !isLoadingAdditionalSimilar && hasAttemptedViewMore) {
      const timer = setTimeout(() => {
        if (additionalSimilarTitleRef.current) {
          additionalSimilarTitleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [additionalSimilarMovies, isLoadingAdditionalSimilar, hasAttemptedViewMore, activeTab, currentAppView]);


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
      
      setSimilarMovieResult(null);
      setHasSearchedSimilarMovie(false);
      setSimilarMovieError(null);
      setOriginalQueryTextForSimilarSearch(null);


      // Reset "View More Similar Movies" state
      setAdditionalSimilarMovies([]);
      setAdditionalSimilarError(null);
      setHasAttemptedViewMore(false);
      // Do not reset isLoading... states here if tab switch happens during loading.
      // They will be reset by their respective handlers.
  };

  const handleTabChange = (newTab: ActiveTab) => {
    if (activeTab !== newTab) { 
        clearAllTabData();
    }
    setActiveTab(newTab);
  };


  const handleGetRecommendations = useCallback(async (sessionPreferences: SessionPreferences) => {
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    setHasSearchedRecommendations(true);
    setRecommendations([]);

    // Scroll to loading indicator
    // Use a short timeout to ensure the DOM updates and ref is available for scrolling.
    setTimeout(() => {
        if (loadingIndicatorRef.current) {
            loadingIndicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 0);


    let currentStablePrefs = stablePreferences;
    if (!currentStablePrefs) {
        const storedPrefsString = localStorage.getItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY);
        if (storedPrefsString) {
            try {
                const parsedPrefs = JSON.parse(storedPrefsString) as Partial<StableUserPreferences>;
                 currentStablePrefs = {
                    ...getDefaultStablePreferences(),
                    ...parsedPrefs,
                    era: Array.isArray(parsedPrefs.era) ? parsedPrefs.era : (parsedPrefs.era ? [parsedPrefs.era] : [MOVIE_ERAS[0]]),
                    movieDuration: Array.isArray(parsedPrefs.movieDuration) ? parsedPrefs.movieDuration : (parsedPrefs.movieDuration ? [parsedPrefs.movieDuration] : [MOVIE_DURATIONS[0]]),
                  };
            } catch (e) {
                console.error("Error reading stable prefs during submit, using defaults", e);
                currentStablePrefs = getDefaultStablePreferences();
            }
        } else {
            currentStablePrefs = getDefaultStablePreferences();
        }
        setStablePreferences(currentStablePrefs);
    }

    const fullPreferences: UserPreferences = {
      ...currentStablePrefs,
      ...sessionPreferences,
    };

    try {
      const movies = await getMovieRecommendations(fullPreferences);
      setRecommendations(movies);
    } catch (err) {
      if (err instanceof Error) {
        setRecommendationError(err.message || 'Failed to fetch recommendations. Please check your API key and try again.');
      } else {
        setRecommendationError('An unknown error occurred while fetching recommendations.');
      }
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [stablePreferences]);

  const handleFindSimilarMovie = useCallback(async (movieTitleFromInput: string) => {
    setIsLoadingSimilarMovie(true);
    setSimilarMovieError(null);
    setHasSearchedSimilarMovie(true);
    setSimilarMovieResult(null);
    setOriginalQueryTextForSimilarSearch(movieTitleFromInput);


    // Reset "View More" states when a new primary search is initiated
    setAdditionalSimilarMovies([]);
    setAdditionalSimilarError(null);
    setIsLoadingAdditionalSimilar(false); 
    setHasAttemptedViewMore(false);

    try {
      const movie = await findSimilarMovieByName(movieTitleFromInput);
      setSimilarMovieResult(movie);
      if (movie) {
        // We save feedback for the *identified* movie, not necessarily the raw query text
        saveMovieFeedback(movie.title, movie.year, "Loved it!"); 
      }
    } catch (err) {
      if (err instanceof Error) {
        setSimilarMovieError(err.message || 'Failed to find similar movie.');
      } else {
        setSimilarMovieError('An unknown error occurred while finding similar movie.');
      }
      setSimilarMovieResult(null);
    } finally {
      setIsLoadingSimilarMovie(false);
    }
  }, []);

  const handleViewMoreSimilarMovies = useCallback(async (
    queryTextForPrompt: string, 
    contextualYearForPrompt: number, 
    actualMovieIdToExclude: string | undefined
  ) => {
    setIsLoadingAdditionalSimilar(true);
    setAdditionalSimilarError(null);
    setAdditionalSimilarMovies([]);
    setHasAttemptedViewMore(true);

    try {
      const movies = await getMoreSimilarMovies(queryTextForPrompt, contextualYearForPrompt, actualMovieIdToExclude);
      setAdditionalSimilarMovies(movies);
    } catch (err) {
      if (err instanceof Error) {
        setAdditionalSimilarError(err.message || 'Failed to fetch more similar movies.');
      } else {
        setAdditionalSimilarError('An unknown error occurred while fetching more similar movies.');
      }
      setAdditionalSimilarMovies([]);
    } finally {
      setIsLoadingAdditionalSimilar(false);
    }
  }, []);


  const TabButton: React.FC<{tabName: ActiveTab; currentTab: ActiveTab; onClick: () => void; children: React.ReactNode, icon?: string}> =
    ({ tabName, currentTab, onClick, children, icon }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center px-4 py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
                  ${currentTab === tabName
                    ? 'bg-slate-800 text-purple-300 border-b-2 border-purple-400'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
      role="tab"
      aria-selected={currentTab === tabName}
    >
      {icon && <span dangerouslySetInnerHTML={{ __html: icon }} className="mr-1.5 w-4 h-4 inline-block" />}
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

        <nav className="mb-8 flex justify-center space-x-1 sm:space-x-2 border-b border-slate-700 w-full max-w-3xl" role="tablist">
          <TabButton tabName="recommendations" currentTab={activeTab} onClick={() => handleTabChange('recommendations')} icon={ICONS.recommendations_tab_icon}>
            Recommendations
          </TabButton>
          <TabButton tabName="similarSearch" currentTab={activeTab} onClick={() => handleTabChange('similarSearch')} icon={ICONS.similar_search_tab_icon}>
            Find Similar
          </TabButton>
          <TabButton tabName="discovery" currentTab={activeTab} onClick={() => handleTabChange('discovery')} icon={ICONS.discovery_tab_icon}>
            Discover & Rate
          </TabButton>
        </nav>

        <div className="w-full max-w-7xl relative flex flex-col flex-grow min-h-0"> {/* Added min-h-0 */}
          {/* Recommendations Tab Content */}
          <section
            role="tabpanel"
            aria-labelledby="tab-recommendations"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'recommendations'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' // Added min-h-0
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <div className="max-w-3xl mx-auto">
              <PreferenceForm onSubmit={handleGetRecommendations} isLoading={isLoadingRecommendations} />
            </div>

            {isLoadingRecommendations && (
              <div ref={loadingIndicatorRef} className="mt-12 flex justify-center"> {/* Added ref */}
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
                  <h2 className="text-2xl font-semibold text-slate-300">No Movies Found</h2>
                </div>
                <p>We couldn't find any movies matching your criteria. Try adjusting your preferences for a wider search!</p>
              </div>
            )}

            {!isLoadingRecommendations && !recommendationError && recommendations.length > 0 && (
              <div className="w-full mt-12">
                <MovieList movies={recommendations} titleRef={recommendationsTitleRef} titleText="Your Personalised Movie Recommendations" />
              </div>
            )}

            {!hasSearchedRecommendations && !isLoadingRecommendations && !recommendationError && (
              <div className="max-w-3xl mx-auto">
                <WelcomeMessage />
              </div>
            )}
          </section>

          {/* Similar Movie Search Tab Content */}
          <section
            role="tabpanel"
            aria-labelledby="tab-similarSearch"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'similarSearch'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' // Added min-h-0
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <div className="max-w-3xl mx-auto">
              <SimilarMovieSearch
                onSearch={handleFindSimilarMovie}
                isLoading={isLoadingSimilarMovie}
                isActive={activeTab === 'similarSearch'}
              />
            </div>
            {isLoadingSimilarMovie && (
              <div className="mt-8 flex justify-center">
                <LoadingSpinner />
              </div>
            )}
            {similarMovieError && (
              <div className="mt-8 max-w-3xl mx-auto text-center text-red-400 bg-red-900/30 p-4 rounded-lg shadow-xl">
                <p>{similarMovieError}</p>
              </div>
            )}
            {hasSearchedSimilarMovie && !isLoadingSimilarMovie && !similarMovieError && similarMovieResult && originalQueryTextForSimilarSearch && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
                  Found a Match for "{originalQueryTextForSimilarSearch}"!
                </h2>
                <div className="max-w-sm mx-auto">
                  <MovieCard movie={similarMovieResult} isSearchResult={true} />
                </div>
                {/* "View More Similar Movies" Button and Section */}
                <div className="mt-8 text-center max-w-3xl mx-auto">
                  {!isLoadingAdditionalSimilar && (
                    <button
                      onClick={() => {
                        if (originalQueryTextForSimilarSearch && similarMovieResult) {
                           handleViewMoreSimilarMovies(originalQueryTextForSimilarSearch, similarMovieResult.year, similarMovieResult.id);
                        }
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
                      aria-label={`View more movies similar to ${originalQueryTextForSimilarSearch}`}
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
            {!isLoadingAdditionalSimilar && !additionalSimilarError && hasAttemptedViewMore && additionalSimilarMovies.length === 0 && originalQueryTextForSimilarSearch && (
               <div className="mt-8 max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-4 rounded-lg shadow-xl">
                <p>No more similar movies found for "{originalQueryTextForSimilarSearch}".</p>
              </div>
            )}
            {!isLoadingAdditionalSimilar && !additionalSimilarError && additionalSimilarMovies.length > 0 && originalQueryTextForSimilarSearch && (
              <div className="w-full mt-12">
                 <MovieList 
                    movies={additionalSimilarMovies} 
                    titleRef={additionalSimilarTitleRef} 
                    titleText={`More Movies Like "${originalQueryTextForSimilarSearch}"`}
                  />
              </div>
            )}
            {hasSearchedSimilarMovie && !isLoadingSimilarMovie && !similarMovieError && !similarMovieResult && originalQueryTextForSimilarSearch && (
              <div className="mt-8 max-w-3xl mx-auto text-center text-slate-400 bg-slate-800 p-4 rounded-lg shadow-xl">
                <p>Could not find a direct match for "{originalQueryTextForSimilarSearch}". Try being more specific or check for typos.</p>
              </div>
            )}
          </section>

          {/* Discovery Tab Content */}
          <section
            role="tabpanel"
            aria-labelledby="tab-discovery"
            className={`transition-opacity duration-500 ease-in-out
              ${activeTab === 'discovery'
                ? 'opacity-100 pointer-events-auto flex flex-col flex-grow min-h-0' // Added min-h-0
                : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
          >
            <DiscoveryView isActive={activeTab === 'discovery'} />
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;