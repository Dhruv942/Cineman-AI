import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageSelector } from './LanguageSelector';
import { LANDING_PAGE_POSTERS } from '../constants';

interface LandingPageProps {
  onStartOnboarding: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartOnboarding }) => {
  const { t, supportedLanguages } = useLanguage();
  const [isExiting, setIsExiting] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    const browserLangs = navigator.languages || [navigator.language];
    if (
      browserLangs &&
      supportedLanguages.length > 1 &&
      (browserLangs.length > 1 || (browserLangs.length > 0 && !browserLangs[0].startsWith('en')))
    ) {
      setShowLanguageSelector(true);
    }
  }, [supportedLanguages.length]);

  const handleStart = () => {
    setIsExiting(true);
    setTimeout(() => {
      onStartOnboarding();
    }, 500); // Match animation time
  };

  const Section: React.FC<{ children: React.ReactNode; className?: string; useAngledDivider?: boolean; }> = ({ children, className = '', useAngledDivider = false }) => (
    <section className={`py-20 sm:py-28 px-4 w-full flex justify-center relative ${useAngledDivider ? 'angled-section' : ''} ${className}`}>
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </section>
  );

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-4xl sm:text-5xl font-bold mb-16 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
      {children}
    </h2>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center bg-slate-900 text-slate-100 text-center overflow-auto ${isExiting ? 'landing-page-exit' : ''}`}>
      
      {/* Background Poster Grid */}
      <div className="poster-grid-background" aria-hidden="true">
        {LANDING_PAGE_POSTERS.map((url, index) => <img key={index} src={url} alt="" />)}
      </div>

      {/* Hero Section */}
      <header className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative z-10">
         {showLanguageSelector && (
            <div className="absolute top-4 right-4 z-10">
              <LanguageSelector />
            </div>
        )}
        <div style={{ animation: 'fade-in-hero 0.8s ease-out forwards' }} className="opacity-0">
            <div className="mb-4">
                <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {t('appName', 'CineMan AI')}
                </h1>
            </div>
            <p className="max-w-xl text-xl sm:text-3xl font-semibold text-slate-100 mb-6" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {t('landing_subtitle', 'Stop Scrolling, Start Watching.')}
            </p>
            <p className="max-w-2xl text-md sm:text-lg text-slate-200 mb-10" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                {t('landing_description', "Tired of endless browsing? Let our advanced AI learn your unique taste and find your next favorite movie or series in seconds.")}
            </p>
            <button
                onClick={handleStart}
                disabled={isExiting}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 text-lg disabled:opacity-50 disabled:cursor-wait"
            >
                {t('landing_cta', 'Get Started For Free')}
            </button>
        </div>
        <div className="absolute bottom-10 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
      </header>

      <main className="w-full flex-grow flex flex-col items-center bg-slate-900 z-10">
        
        <Section className="section-animate-in">
          <SectionTitle>{t('landing_how_it_works_title', 'Find Your Next Binge in 3 Easy Steps')}</SectionTitle>
          <div className="flex flex-col md:flex-row gap-12 md:gap-8 items-start">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="relative mb-4"><div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-purple-800/50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg></div><span className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold text-white border-4 border-slate-900">1</span></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_how_it_works_step1_title', 'Tell Us Your Vibe')}</h3>
              <p className="text-slate-400 text-sm max-w-xs">{t('landing_how_it_works_step1_desc', 'Select genres, moods, and keywords, or just tell us a movie you already love.')}</p>
            </div>
            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center text-center" style={{ animationDelay: '0.2s' }}>
              <div className="relative mb-4"><div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-purple-800/50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg></div><span className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold text-white border-4 border-slate-900">2</span></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_how_it_works_step2_title', 'AI Magic Happens')}</h3>
              <p className="text-slate-400 text-sm max-w-xs">{t('landing_how_it_works_step2_desc', "Our AI, powered by Gemini, analyzes your taste to find hyper-personalized picks from a vast library.")}</p>
            </div>
            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center text-center" style={{ animationDelay: '0.4s' }}>
               <div className="relative mb-4"><div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-purple-800/50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" /></svg></div><span className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold text-white border-4 border-slate-900">3</span></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_how_it_works_step3_title', 'Watch & Enjoy')}</h3>
              <p className="text-slate-400 text-sm max-w-xs">{t('landing_how_it_works_step3_desc', "Get a curated list of movies and series with details on where to watch them. Simple as that!")}</p>
            </div>
          </div>
        </Section>
        
        <Section useAngledDivider className="bg-slate-800/50 section-animate-in">
          <SectionTitle>{t('landing_features_title', "Why You'll Love CineMan AI")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10">
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_feature_ai_title', 'Personalized Picks')}</h3>
              <p className="text-slate-400 text-sm">{t('landing_feature_ai_desc', "Tell us your mood and genres, or find movies similar to your favorites.")}</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_feature_taste_check_title', 'Taste Check')}</h3>
              <p className="text-slate-400 text-sm">{t('landing_feature_taste_check_desc', 'Ask our AI "Will I like this?" before you commit to watching.')}</p>
            </div>
             <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_feature_watchlist_title', 'Universal Watchlist')}</h3>
              <p className="text-slate-400 text-sm">{t('landing_feature_watchlist_desc', 'Save movies from anywhere on the web to your personal CineMan AI list.')}</p>
            </div>
          </div>
        </Section>
        
        <Section className="section-animate-in">
          <SectionTitle>{t('landing_testimonials_title', "Don't Just Take Our Word For It")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700/50 flex flex-col"> <div className="text-6xl font-bold text-purple-600/50 -mt-4 mb-2">“</div> <p className="text-slate-300 italic mb-4 flex-grow text-left">"{t('landing_testimonial1_text', "I've discovered so many hidden gems with CineMan AI. The 'Find Similar' feature is a game-changer. My weekend movie nights have never been better!")}"</p> <div className="flex items-center mt-auto pt-4 border-t border-slate-700"> <div className="text-yellow-400 mr-2">★★★★★</div> <p className="font-semibold text-purple-300">- {t('landing_testimonial1_author', 'Jessica M.')}</p> </div> </div>
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700/50 flex flex-col"> <div className="text-6xl font-bold text-purple-600/50 -mt-4 mb-2">“</div> <p className="text-slate-300 italic mb-4 flex-grow text-left">"{t('landing_testimonial2_text', "Finally, an app that actually understands my weird taste in movies. The taste-check is brutally honest and I love it. 10/10 would recommend.")}"</p> <div className="flex items-center mt-auto pt-4 border-t border-slate-700"> <div className="text-yellow-400 mr-2">★★★★★</div> <p className="font-semibold text-purple-300">- {t('landing_testimonial2_author', 'David R.')}</p> </div> </div>
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700/50 flex flex-col"> <div className="text-6xl font-bold text-purple-600/50 -mt-4 mb-2">“</div> <p className="text-slate-300 italic mb-4 flex-grow text-left">"{t('landing_testimonial3_text', "As a browser extension, it's seamless. It automatically learns from my Netflix list. I don't have to do anything but get great recommendations.")}"</p> <div className="flex items-center mt-auto pt-4 border-t border-slate-700"> <div className="text-yellow-400 mr-2">★★★★★</div> <p className="font-semibold text-purple-300">- {t('landing_testimonial3_author', 'Priya K.')}</p> </div> </div>
          </div>
        </Section>
        
        <Section className="section-animate-in">
            <div className="text-center bg-slate-800/50 p-10 rounded-lg shadow-2xl border border-purple-800/30">
                <h3 className="text-2xl font-bold mb-4 text-sky-300">{t('landing_powered_by_title', 'Powered by Google Gemini')}</h3>
                <p className="max-w-2xl mx-auto text-slate-300 mb-8">{t('landing_powered_by_desc', "Our smart recommendations are made possible by Google's most advanced AI, ensuring you get the highest quality suggestions that truly understand nuance and context.")}</p>
                <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{t('landing_final_cta_title', 'Ready to End Endless Scrolling?')}</h2>
                <button
                    onClick={handleStart}
                    disabled={isExiting}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 text-lg disabled:opacity-50 disabled:cursor-wait"
                >
                    {t('landing_final_cta_button', 'Find My First Recommendation')}
                </button>
             </div>
        </Section>

      </main>
      <footer className="py-8 text-center z-10">
        <p className="text-slate-400 text-sm">
          {t('footer_copyright', '© {year} CineMan AI. Powered by Gemini.', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
};