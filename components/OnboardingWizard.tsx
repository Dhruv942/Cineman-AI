import React, { useState, useEffect } from 'react';
import type { StableUserPreferences } from '../types';
import { MOVIE_FREQUENCIES, ACTOR_DIRECTOR_PREFERENCES, MOVIE_LANGUAGES, OTT_PLATFORMS, MOVIE_ERAS, MOVIE_DURATIONS, SERIES_SEASON_COUNTS, ICONS, CINE_SUGGEST_STABLE_PREFERENCES_KEY, CINE_SUGGEST_ONBOARDING_COMPLETE_KEY, TOTAL_ONBOARDING_STEPS, ONBOARDING_STEP_MILESTONES, COUNTRIES } from '../constants';

interface OnboardingWizardProps {
  onComplete: (preferences: StableUserPreferences) => void;
  initialData?: StableUserPreferences;
  isEditMode: boolean;
  onBack?: () => void;
}

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

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, initialData, isEditMode, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const initializePreferences = (): StableUserPreferences => {
    const defaults = getDefaultStablePreferences();
    if (initialData) {
      return {
        ...defaults,
        ...initialData,
        preferredNumberOfSeasons: Array.isArray(initialData.preferredNumberOfSeasons) && initialData.preferredNumberOfSeasons.length > 0 ? initialData.preferredNumberOfSeasons : defaults.preferredNumberOfSeasons,
        era: Array.isArray(initialData.era) && initialData.era.length > 0 ? initialData.era : defaults.era,
        movieDuration: Array.isArray(initialData.movieDuration) && initialData.movieDuration.length > 0 ? initialData.movieDuration : defaults.movieDuration,
        preferredLanguages: Array.isArray(initialData.preferredLanguages) && initialData.preferredLanguages.length > 0 ? initialData.preferredLanguages : defaults.preferredLanguages,
        country: typeof initialData.country === 'string' && COUNTRIES.some(c => c.code === initialData.country) ? initialData.country : defaults.country,
      };
    }
    // For new onboarding, start with country unselected
    return { ...defaults, country: isEditMode ? defaults.country : '' };
  };

  const [preferences, setPreferences] = useState<StableUserPreferences>(initializePreferences());
  const [animationClass, setAnimationClass] = useState('opacity-100');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setPreferences(initializePreferences());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isEditMode]);

  const handleChange = (field: keyof StableUserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageToggle = (langCode: string) => {
    if (langCode === 'any') {
        handleChange('preferredLanguages', ['any']);
    } else {
        setPreferences(prev => {
            const newSelection = prev.preferredLanguages.includes(langCode)
                ? prev.preferredLanguages.filter(l => l !== langCode)
                : [...prev.preferredLanguages.filter(l => l !== 'any'), langCode];
            return { ...prev, preferredLanguages: newSelection.length === 0 ? ['any'] : newSelection };
        });
    }
  };

  const handleOttPlatformToggle = (platform: string) => {
    setPreferences(prev => {
      const newPlatforms = prev.ottPlatforms.includes(platform)
        ? prev.ottPlatforms.filter(p => p !== platform)
        : [...prev.ottPlatforms, platform];
      return { ...prev, ottPlatforms: newPlatforms };
    });
  };

  const getOttIcon = (platform: string) => {
    const iconKey = platform.toLowerCase().replace(/\s+/g, '_').replace('+', '_plus').replace(/\(max\)/g, 'max').trim();
    return (ICONS as any)[iconKey] || ICONS.default_ott;
  };

  const handleMovieEraToggle = (eraValue: string) => {
    setPreferences(prev => {
      let newEras: string[];
      if (eraValue === MOVIE_ERAS[0]) { 
        newEras = [MOVIE_ERAS[0]];
      } else {
        const currentEras = prev.era.filter(e => e !== MOVIE_ERAS[0]); 
        if (currentEras.includes(eraValue)) {
          newEras = currentEras.filter(e => e !== eraValue);
        } else {
          newEras = [...currentEras, eraValue];
        }
        if (newEras.length === 0) { 
          newEras = [MOVIE_ERAS[0]];
        }
      }
      return { ...prev, era: newEras };
    });
  };

  const handleMovieDurationToggle = (durationValue: string) => {
     setPreferences(prev => {
      let newDurations: string[];
      if (durationValue === MOVIE_DURATIONS[0]) { 
        newDurations = [MOVIE_DURATIONS[0]];
      } else {
        const currentDurations = prev.movieDuration.filter(d => d !== MOVIE_DURATIONS[0]);
        if (currentDurations.includes(durationValue)) {
          newDurations = currentDurations.filter(d => d !== durationValue);
        } else {
          newDurations = [...currentDurations, durationValue];
        }
        if (newDurations.length === 0) {
          newDurations = [MOVIE_DURATIONS[0]];
        }
      }
      return { ...prev, movieDuration: newDurations };
    });
  };

  const handleSeasonCountToggle = (seasonCountValue: string) => {
    setPreferences(prev => {
      let newSeasonCounts: string[];
      if (seasonCountValue === SERIES_SEASON_COUNTS[0]) { 
        newSeasonCounts = [SERIES_SEASON_COUNTS[0]];
      } else {
        const currentSeasonCounts = prev.preferredNumberOfSeasons.filter(s => s !== SERIES_SEASON_COUNTS[0]);
        if (currentSeasonCounts.includes(seasonCountValue)) {
          newSeasonCounts = currentSeasonCounts.filter(s => s !== seasonCountValue);
        } else {
          newSeasonCounts = [...currentSeasonCounts, seasonCountValue];
        }
        if (newSeasonCounts.length === 0) {
          newSeasonCounts = [SERIES_SEASON_COUNTS[0]];
        }
      }
      return { ...prev, preferredNumberOfSeasons: newSeasonCounts };
    });
  };

  const nextStep = () => {
    if (isTransitioning) return;
    if (currentStep === 4 && preferences.country === '') {
        return;
    }
    setIsTransitioning(true);
    setAnimationClass('opacity-0 transition-opacity duration-150 ease-out'); 
    setTimeout(() => {
        setCurrentStep(prev => {
            const newStep = Math.min(prev + 1, TOTAL_ONBOARDING_STEPS);
            if (prev !== newStep) { 
                setAnimationClass('opacity-0'); 
                setTimeout(() => {
                    setAnimationClass('opacity-100 transition-opacity duration-300 ease-in'); 
                    setIsTransitioning(false);
                }, 30); 
            } else {
                setAnimationClass('opacity-100 transition-opacity duration-300 ease-in');
                setIsTransitioning(false); 
            }
            return newStep;
        });
    }, 150); 
  };

  const prevStep = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setAnimationClass('opacity-0 transition-opacity duration-150 ease-out'); 
    setTimeout(() => {
        setCurrentStep(prev => {
            const newStep = Math.max(prev - 1, 1);
             if (prev !== newStep) { 
                setAnimationClass('opacity-0'); 
                setTimeout(() => {
                    setAnimationClass('opacity-100 transition-opacity duration-300 ease-in'); 
                    setIsTransitioning(false);
                }, 30); 
            } else {
                 setAnimationClass('opacity-100 transition-opacity duration-300 ease-in');
                 setIsTransitioning(false);
            }
            return newStep;
        });
    }, 150); 
  };

  const handleSubmit = () => {
    if (isTransitioning) return;
    const finalPreferences = { ...preferences };
    if (finalPreferences.country === '') {
        finalPreferences.country = COUNTRIES.find(c => c.code === 'any')?.code || 'any';
    }
    localStorage.setItem(CINE_SUGGEST_STABLE_PREFERENCES_KEY, JSON.stringify(finalPreferences));
    if (!isEditMode) {
      localStorage.setItem(CINE_SUGGEST_ONBOARDING_COMPLETE_KEY, 'true');
    }
    onComplete(finalPreferences);
  };

  const QuestionLabel: React.FC<{ htmlFor?: string; id?: string; icon: string; text: string; className?: string; }> =
  ({ htmlFor, id, icon, text, className = "block text-xl font-semibold mb-4 text-purple-300 text-center" }) => (
    <label htmlFor={htmlFor} id={id} className={className}>
      <span dangerouslySetInnerHTML={{ __html: icon }} className="inline-block align-middle" />
      {text}
    </label>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Welcome
        return (
          <div className="text-center">
            {isEditMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-purple-400 mx-auto mb-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.44 1.022.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.427.27 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0 .55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-purple-400 mx-auto mb-6">
                <path d="M18 4H6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1.1c.42 3.38 1.42 6.55 2.9 9l2-5 2 5c1.48-2.45 2.48-5.62 2.9-9H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 6h10v3H7V6zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              </svg>
            )}
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              {isEditMode ? "Edit Your Preferences" : "Welcome to CineMan AI"}
            </h2>
            <p className="text-slate-300 text-lg mb-6">
              {isEditMode ? "Update your stable preferences below. These help us tailor movie and series recommendations to your long-term tastes." : "Let's set up some basic preferences to help us find movies and series you'll love. This will only take a moment!"}
            </p>
          </div>
        );
      case 2: // Viewing Habits (Movie Frequency, Movie Duration, Series Seasons)
        return (
          <>
            <div className="mb-8">
              <QuestionLabel icon={ICONS.question_frequency} id="movieFrequency-label" text="How often do you watch movies/series?" />
              <div role="radiogroup" aria-labelledby="movieFrequency-label" className="flex flex-wrap gap-3 justify-center">
                {MOVIE_FREQUENCIES.map(freq => (
                  <button type="button" key={freq} onClick={() => handleChange('movieFrequency', freq)}
                    aria-pressed={preferences.movieFrequency === freq} role="radio" aria-checked={preferences.movieFrequency === freq}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${preferences.movieFrequency === freq ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {freq}
                  </button>
                ))}
              </div>
            </div>
             <div className="mb-8 w-full max-w-lg mx-auto">
                <QuestionLabel icon={ICONS.question_duration} id="movieDuration-label" text="Preferred Movie Duration(s)" />
                <div role="group" aria-labelledby="movieDuration-label" className="flex flex-wrap gap-3 justify-center">
                    {MOVIE_DURATIONS.map(duration => (
                    <button type="button" key={duration} onClick={() => handleMovieDurationToggle(duration)}
                        aria-pressed={preferences.movieDuration.includes(duration)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${preferences.movieDuration.includes(duration) ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {duration}
                    </button>
                    ))}
                </div>
                <p className="text-xs text-slate-400 text-center mt-3">This primarily applies when looking for movies.</p>
            </div>
            <div className="w-full max-w-lg mx-auto">
                <QuestionLabel icon={ICONS.question_seasons} id="seriesSeasons-label" text="Preferred Number of Seasons (for series)" />
                <div role="group" aria-labelledby="seriesSeasons-label" className="flex flex-wrap gap-3 justify-center">
                    {SERIES_SEASON_COUNTS.map(count => (
                    <button type="button" key={count} onClick={() => handleSeasonCountToggle(count)}
                        aria-pressed={preferences.preferredNumberOfSeasons.includes(count)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${preferences.preferredNumberOfSeasons.includes(count) ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {count}
                    </button>
                    ))}
                </div>
                <p className="text-xs text-slate-400 text-center mt-3">This applies when looking for series recommendations.</p>
            </div>
          </>
        );
      case 3: // Content Style (Actor/Director, Era)
        return (
          <>
            <div className="mb-8">
              <QuestionLabel icon={ICONS.question_actor_director} id="actorDirectorPreference-label" text="Prefer known actors or directors?" />
              <div role="radiogroup" aria-labelledby="actorDirectorPreference-label" className="flex flex-wrap gap-3 justify-center">
                {ACTOR_DIRECTOR_PREFERENCES.map(pref => (
                  <button type="button" key={pref} onClick={() => handleChange('actorDirectorPreference', pref)}
                    aria-pressed={preferences.actorDirectorPreference === pref} role="radio" aria-checked={preferences.actorDirectorPreference === pref}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${preferences.actorDirectorPreference === pref ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full max-w-lg mx-auto">
              <QuestionLabel icon={ICONS.question_era} id="movieEra-label" text="Preferred Movie/Series Era(s)" />
              <div role="group" aria-labelledby="movieEra-label" className="flex flex-wrap gap-3 justify-center">
                {MOVIE_ERAS.map(e => (
                  <button type="button" key={e} onClick={() => handleMovieEraToggle(e)}
                    aria-pressed={preferences.era.includes(e)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${preferences.era.includes(e) ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      case 4: // Access & Language (Language, OTT, Country)
        return (
          <>
            <div className="mb-8">
              <QuestionLabel icon={ICONS.question_language} id="languagePreference-label" text="Preferred Movie/Series Languages" />
              <div role="group" aria-labelledby="languagePreference-label" className="flex flex-wrap gap-3 justify-center">
                {MOVIE_LANGUAGES.map(lang => (
                  <button type="button" key={lang.code} onClick={() => handleLanguageToggle(lang.code)}
                    aria-pressed={preferences.preferredLanguages.includes(lang.code)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 flex items-center ${preferences.preferredLanguages.includes(lang.code) ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {lang.name === "Any Language" && <span dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1.5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-5.834A8.959 8.959 0 0 0 3 12c0 .778-.099 1.533.284 2.253m0 0A11.978 11.978 0 0 0 12 16.5c2.998 0 5.74 1.1 7.843 2.918" /></svg>` }} />}
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <QuestionLabel icon={ICONS.question_country} id="country-label" text="Your Country (for content availability)" />
                <select
                    id="country"
                    value={preferences.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-slate-200 placeholder-slate-400 text-sm ${preferences.country === '' ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-600'}`}
                    aria-labelledby="country-label"
                    aria-required="true"
                >
                    {isEditMode && !COUNTRIES.find(c => c.code === preferences.country) && <option value={preferences.country} disabled>{preferences.country} (current)</option>}
                    {!isEditMode && preferences.country === '' && <option value="" disabled>-- Select your country --</option>}
                    {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                        {country.name}
                    </option>
                    ))}
                </select>
                {preferences.country === '' && (
                    <p className="text-xs text-red-400 text-center mt-2">Please select your country to continue. This helps us find content available in your region.</p>
                )}
                 {preferences.country !== '' && (
                    <p className="text-xs text-slate-400 text-center mt-2">This helps us find content available in your region.</p>
                 )}
            </div>
            <div>
              <QuestionLabel icon={ICONS.question_ott} text="Your Streaming Services (optional)" />
              <div className="flex flex-wrap gap-3 justify-center">
                {OTT_PLATFORMS.map(platform => (
                  <button type="button" key={platform} onClick={() => handleOttPlatformToggle(platform)}
                    aria-pressed={preferences.ottPlatforms.includes(platform)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 flex items-center ${preferences.ottPlatforms.includes(platform) ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    <span dangerouslySetInnerHTML={{ __html: getOttIcon(platform) }} />
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
       case 5: // Confirmation
        return (
          <div className="text-center">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-green-400 mx-auto mb-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                {isEditMode ? "Preferences Updated!" : "You're All Set!"}
            </h2>
            <p className="text-slate-300 text-lg mb-6">
                {isEditMode ? "Your preferences have been saved." : "Your preferences have been saved. You can change these later using the settings icon in the header."}
            </p>
            <p className="text-slate-400 text-sm">
                {isEditMode ? "Click \"Save Changes\" to return to the app." : "Click \"Start Discovering\" to find your next favorite movie or series."}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const isCountryStepAndInvalid = currentStep === 4 && preferences.country === '';

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-[100]">
      {isEditMode && onBack && currentStep === 1 && (
        <button
          type="button"
          onClick={onBack}
          disabled={isTransitioning}
          className={`absolute top-4 left-4 sm:top-6 sm:left-6 z-[110] p-2 rounded-full hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Back to application"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
      )}
      <div className="bg-slate-800 p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-300 bg-purple-800/60">
                   {ONBOARDING_STEP_MILESTONES[currentStep - 1]}
                </span>
              </div>
               <div className="text-right">
                <span className="text-xs font-semibold inline-block text-purple-300">
                  Step {currentStep} of {TOTAL_ONBOARDING_STEPS}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200/30">
              <div style={{ width: `${(currentStep / TOTAL_ONBOARDING_STEPS) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"></div>
            </div>
          </div>
        </div>

        <div className={`flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-slate-700 min-h-0 ${animationClass}`}>
          {renderStepContent()}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
          <div className="flex items-center">
            {isEditMode && onBack && currentStep > 1 && ( 
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isTransitioning}
                    className={`px-6 py-2.5 bg-slate-500 hover:bg-slate-400 text-white font-medium rounded-lg shadow-md transition-colors duration-150 mr-3 ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Back to main application"
                >
                    Back to App
                </button>
            )}
            {currentStep > 1 && ( 
              <button
                type="button"
                onClick={prevStep}
                disabled={isTransitioning || (isEditMode && currentStep === 1 && !!onBack)} 
                className={`px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg shadow-md transition-colors duration-150 ${isTransitioning || (isEditMode && currentStep ===1 && !!onBack) ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Previous step"
              >
                Back
              </button>
            )}
             {currentStep === 1 && (!isEditMode || !onBack) && <div className="w-0 h-0 invisible"></div>}

          </div>
          {currentStep < TOTAL_ONBOARDING_STEPS ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isTransitioning || isCountryStepAndInvalid}
              className={`px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ${isTransitioning || isCountryStepAndInvalid ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Next step"
              title={isCountryStepAndInvalid ? "Please select a country to proceed" : undefined}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isTransitioning}
              className={`px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isEditMode ? "Save Changes" : "Start Discovering"}
            >
              {isEditMode ? "Save Changes" : "Start Discovering!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};