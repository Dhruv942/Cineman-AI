import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageSelector } from './LanguageSelector';
import { LANDING_PAGE_POSTERS, CINE_SUGGEST_CHROME_STORE_URL, ICONS } from '../constants';

interface LandingPageProps {
  onStartOnboarding: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartOnboarding }) => {
  const { t, supportedLanguages } = useLanguage();
  const [isExiting, setIsExiting] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    window.open(CINE_SUGGEST_CHROME_STORE_URL, '_blank', 'noopener,noreferrer');
    // Stay on the landing page — don't trigger onboarding
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

  const navLinks = [
    { label: 'Features', href: '/features/imdb-ratings-overlay.html' },
    { label: 'Genres', href: '/genre/' },
    { label: 'Blog', href: '/blogs/' },
    { label: 'FAQ', href: '/faq.html' },
  ];

  const genres = [
    { name: 'Action', icon: ICONS.action, href: '/genre/action.html' },
    { name: 'Sci-Fi', icon: ICONS.scifi, href: '/genre/sci-fi.html' },
    { name: 'Thriller', icon: ICONS.thriller, href: '/genre/thriller.html' },
    { name: 'Comedy', icon: ICONS.comedy, href: '/genre/comedy.html' },
    { name: 'Drama', icon: ICONS.drama, href: '/genre/drama.html' },
    { name: 'Horror', icon: ICONS.horror, href: '/genre/horror.html' },
    { name: 'Romance', icon: ICONS.romance, href: '/genre/romance.html' },
    { name: 'Animation', icon: ICONS.animation, href: '/genre/animation.html' },
  ];

  const blogPosts = [
    {
      title: 'How to See IMDb Ratings on Netflix',
      desc: 'A step-by-step guide to surfacing IMDb scores right inside the Netflix UI.',
      href: '/blogs/how-to-see-imdb-ratings-on-netflix.html',
    },
    {
      title: 'Movies Like Interstellar',
      desc: 'Explore mind-bending sci-fi picks ranked by your personal taste profile.',
      href: '/blogs/movies-like-interstellar.html',
    },
    {
      title: 'Why Netflix Recommendations Are Wrong',
      desc: 'How streaming algorithms fall short and what AI taste-matching does differently.',
      href: '/blogs/why-netflix-recommendations-are-wrong.html',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col items-center bg-slate-900 text-slate-100 text-center overflow-auto ${isExiting ? 'landing-page-exit' : ''}`}>

      {/* Background Poster Grid */}
      <div className="poster-grid-background" aria-hidden="true">
        {LANDING_PAGE_POSTERS.map((url, index) => <img key={index} src={url} alt="Decorative movie poster backdrop" />)}
      </div>

      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img src="./icons/icon128.png" alt="CineMan AI logo" className="w-8 h-8" />
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 hidden sm:inline">CineMan AI</span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-slate-300 hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA + Language */}
          <div className="hidden md:flex items-center gap-3">
            {showLanguageSelector && <LanguageSelector />}
            <button
              onClick={handleStart}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-200 hover:scale-105"
            >
              Add to Chrome &mdash; Free
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 px-4 pb-4">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="block py-2 text-sm text-slate-300 hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
            <button
              onClick={handleStart}
              className="mt-3 w-full px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              Add to Chrome &mdash; Free
            </button>
            {showLanguageSelector && (
              <div className="mt-3">
                <LanguageSelector />
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative z-10">
        <div style={{ animation: 'fade-in-hero 0.8s ease-out forwards' }} className="opacity-0">
            <div className="mb-4">
               <img
            src="./icons/icon128.png"
            alt="CineMan AI logo"
            className="w-20 h-20 text-purple-400 mx-auto mb-6"
          />
                <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {t('appName', 'CineMan AI')}
                </h1>
            </div>
            <p className="max-w-xl text-xl sm:text-3xl font-semibold text-slate-100 mb-6" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {t('landing_subtitle', 'Stop Scrolling, Start Watching.')}
            </p>
            <p className="max-w-2xl text-md sm:text-lg text-slate-200 mb-10" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                {t('landing_description', "The best AI movie & TV show recommender. See IMDb & Rotten Tomatoes ratings on Netflix, Prime Video, and Disney+ — plus get personalized recommendations that actually match your taste.")}
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

        {/* How It Works */}
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

        {/* Features (6 cards) */}
        <Section useAngledDivider className="bg-slate-800/50 section-animate-in">
          <SectionTitle>{t('landing_features_title', "Why You'll Love CineMan AI")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Personalized Picks */}
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10">
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_feature_ai_title', 'Personalized Picks')}</h3>
              <p className="text-slate-400 text-sm">{t('landing_feature_ai_desc', "Tell us your mood and genres, or find movies similar to your favorites.")}</p>
            </div>
            {/* Card 2: Taste Check */}
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10">
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_feature_taste_check_title', 'Taste Check')}</h3>
              <p className="text-slate-400 text-sm">{t('landing_feature_taste_check_desc', 'Ask our AI "Will I like this?" before you commit to watching.')}</p>
            </div>
            {/* Card 3: Universal Watchlist */}
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10">
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg></div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">{t('landing_feature_watchlist_title', 'Universal Watchlist')}</h3>
              <p className="text-slate-400 text-sm">{t('landing_feature_watchlist_desc', 'Save movies from anywhere on the web to your personal CineMan AI list.')}</p>
            </div>
            {/* Card 4: IMDb & RT Overlay */}
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10">
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">IMDb &amp; RT Ratings Overlay</h3>
              <p className="text-slate-400 text-sm">See IMDb and Rotten Tomatoes ratings directly on every Netflix, Prime Video, and Disney+ card as you browse.</p>
            </div>
            {/* Card 5: Similar Movie Search */}
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10">
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">Find Similar Movies</h3>
              <p className="text-slate-400 text-sm">Search any movie and get similar titles ranked by your personal taste -- not generic popularity lists.</p>
            </div>
            {/* Card 6: Privacy First */}
            <div className="bg-slate-900/50 p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-200 border border-transparent hover:border-purple-500 hover:shadow-purple-500/10">
              <div className="flex items-center justify-center mb-4 w-16 h-16 rounded-full bg-purple-500/20 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">100% Private &amp; Local</h3>
              <p className="text-slate-400 text-sm">Your taste profile and viewing history never leave your device. No accounts, no servers, no tracking.</p>
            </div>
          </div>
        </Section>

        {/* Ratings at a Glance */}
        <Section className="section-animate-in">
          <SectionTitle>Ratings Right Where You Browse</SectionTitle>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-slate-300 text-lg mb-8">
              CineMan adds IMDb scores and Rotten Tomatoes ratings to every title on Netflix, Prime Video, and Disney+. No more tab-switching to check if a movie is worth watching.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="px-4 py-2 rounded-full bg-red-600/20 text-red-400 font-semibold text-sm border border-red-600/30">Netflix</span>
              <span className="px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 font-semibold text-sm border border-blue-600/30">Prime Video</span>
              <span className="px-4 py-2 rounded-full bg-indigo-600/20 text-indigo-400 font-semibold text-sm border border-indigo-600/30">Disney+</span>
            </div>
            <a href="/features/imdb-ratings-overlay.html" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Learn more &rarr;
            </a>
          </div>
        </Section>

        {/* Works Where You Watch */}
        <Section className="bg-slate-800/50 section-animate-in">
          <SectionTitle>Works Where You Watch</SectionTitle>
          <p className="text-slate-300 text-lg text-center max-w-3xl mx-auto mb-12">
            IMDb ratings, Rotten Tomatoes scores, taste match, and AI recommendations on all major streaming platforms.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 max-w-3xl mx-auto">
            {[
              { name: 'Netflix', color: 'text-red-400' },
              { name: 'Prime Video', color: 'text-blue-400' },
              { name: 'Disney+', color: 'text-indigo-400' },
              { name: 'Hotstar', color: 'text-yellow-400' },
              { name: 'JioCinema', color: 'text-pink-400' },
            ].map((platform) => (
              <div key={platform.name} className="bg-slate-900/60 rounded-lg p-5 flex flex-col items-center justify-center border border-slate-700/50 hover:border-purple-500/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-10 h-10 mb-3 ${platform.color}`}><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" /></svg>
                <span className="text-sm font-semibold text-slate-200">{platform.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Explore by Genre */}
        <Section className="section-animate-in">
          <SectionTitle>Explore by Genre</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {genres.map((genre) => (
              <a
                key={genre.name}
                href={genre.href}
                className="group bg-slate-800/60 rounded-lg p-5 text-center border border-slate-700/50 hover:border-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
              >
                <span className="block mb-2 [&_svg]:w-8 [&_svg]:h-8 [&_svg]:mx-auto [&_img]:w-8 [&_img]:h-8 [&_img]:mx-auto" dangerouslySetInnerHTML={{ __html: genre.icon }} />
                <span className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">{genre.name}</span>
              </a>
            ))}
          </div>
          <div className="text-center">
            <a href="/genre/" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Browse all 20 genres &rarr;
            </a>
          </div>
        </Section>

        {/* Testimonials */}
        <Section className="bg-slate-800/50 section-animate-in">
          <SectionTitle>{t('landing_testimonials_title', "Don't Just Take Our Word For It")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700/50 flex flex-col"> <div className="text-6xl font-bold text-purple-600/50 -mt-4 mb-2">"</div> <p className="text-slate-300 italic mb-4 flex-grow text-left">"{t('landing_testimonial1_text', "I've discovered so many hidden gems with CineMan AI. The 'Find Similar' feature is a game-changer. My weekend movie nights have never been better!")}"</p> <div className="flex items-center mt-auto pt-4 border-t border-slate-700"> <div className="text-yellow-400 mr-2">&#9733;&#9733;&#9733;&#9733;&#9733;</div> <p className="font-semibold text-purple-300">- {t('landing_testimonial1_author', 'Jessica M.')}</p> </div> </div>
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700/50 flex flex-col"> <div className="text-6xl font-bold text-purple-600/50 -mt-4 mb-2">"</div> <p className="text-slate-300 italic mb-4 flex-grow text-left">"{t('landing_testimonial2_text', "Finally, an app that actually understands my weird taste in movies. The taste-check is brutally honest and I love it. 10/10 would recommend.")}"</p> <div className="flex items-center mt-auto pt-4 border-t border-slate-700"> <div className="text-yellow-400 mr-2">&#9733;&#9733;&#9733;&#9733;&#9733;</div> <p className="font-semibold text-purple-300">- {t('landing_testimonial2_author', 'David R.')}</p> </div> </div>
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700/50 flex flex-col"> <div className="text-6xl font-bold text-purple-600/50 -mt-4 mb-2">"</div> <p className="text-slate-300 italic mb-4 flex-grow text-left">"{t('landing_testimonial3_text', "As a browser extension, it's seamless. It automatically learns from my Netflix list. I don't have to do anything but get great recommendations.")}"</p> <div className="flex items-center mt-auto pt-4 border-t border-slate-700"> <div className="text-yellow-400 mr-2">&#9733;&#9733;&#9733;&#9733;&#9733;</div> <p className="font-semibold text-purple-300">- {t('landing_testimonial3_author', 'Priya K.')}</p> </div> </div>
          </div>
        </Section>

        {/* From the Blog */}
        <Section className="section-animate-in">
          <SectionTitle>From the Blog</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {blogPosts.map((post) => (
              <a
                key={post.title}
                href={post.href}
                className="bg-slate-800/60 p-6 rounded-lg border border-slate-700/50 hover:border-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 text-left group"
              >
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-purple-300 transition-colors mb-2">{post.title}</h3>
                <p className="text-slate-400 text-sm">{post.desc}</p>
              </a>
            ))}
          </div>
          <div className="text-center">
            <a href="/blogs/" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Read more on the blog &rarr;
            </a>
          </div>
        </Section>

        {/* FAQ Section — visible on page for SEO + AEO */}
        <Section className="section-animate-in">
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">What is CineMan AI?</h3>
              <p className="text-slate-400 text-sm">CineMan AI is a free Chrome extension that overlays IMDb and Rotten Tomatoes ratings directly on streaming platforms like Netflix, Prime Video, and Disney+. It also provides AI-powered personalized movie and TV show recommendations based on your taste profile — the best AI movie and TV show recommender available.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">How do I see IMDb ratings on Netflix?</h3>
              <p className="text-slate-400 text-sm">Install the CineMan AI Chrome extension for free. Once installed, you will see IMDb and Rotten Tomatoes ratings overlaid directly on every movie and show while browsing Netflix — no tab-switching needed. CineMan also works on Prime Video, Disney+, and other streaming platforms.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">Is CineMan AI free?</h3>
              <p className="text-slate-400 text-sm">Yes, CineMan AI is completely free. Install it from the Chrome Web Store and start seeing IMDb ratings on your streaming platforms immediately. There are no premium tiers or hidden costs.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">What streaming platforms does CineMan support?</h3>
              <p className="text-slate-400 text-sm">CineMan AI shows IMDb and Rotten Tomatoes ratings on Netflix, Amazon Prime Video, Disney+, JioHotstar, and other major streaming platforms. It also provides personalized AI recommendations across all supported services.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">How does CineMan AI recommend movies?</h3>
              <p className="text-slate-400 text-sm">CineMan AI builds a local taste profile based on your viewing history and ratings. It uses a tag-based scoring engine that runs entirely in your browser — no data is sent to any server. It matches your taste against genre, themes, director style, cast preferences, and audience reception to find movies you will love.</p>
            </div>
          </div>
        </Section>

        {/* Gemini Callout + Final CTA */}
        <Section className="bg-slate-800/50 section-animate-in">
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

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 py-12 px-4 z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left mb-10">
          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="/features/imdb-ratings-overlay.html" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Features</a></li>
              <li><a href="/features/taste-match.html" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Taste Match</a></li>
              <li><a href="/features/similar-search.html" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Similar Search</a></li>
              <li><a href="/features/privacy.html" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Privacy</a></li>
              <li><a href="/changelog.html" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Changelog</a></li>
            </ul>
          </div>
          {/* Browse */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Browse</h4>
            <ul className="space-y-2">
              <li><a href="/genre/" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Genres</a></li>
              <li><a href="/blogs/" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Blog</a></li>
              <li><a href="/faq.html" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">FAQ</a></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-slate-400 hover:text-purple-400 text-sm transition-colors">Terms</a></li>
            </ul>
          </div>
          {/* CineMan */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="./icons/icon128.png" alt="CineMan AI logo" className="w-8 h-8" />
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">CineMan AI</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">AI-powered movie recommendations for every streaming platform.</p>
            <button
              onClick={handleStart}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-200 hover:scale-105"
            >
              Add to Chrome &mdash; Free
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-6 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            {t('footer_copyright', '\u00A9 {year} CineMan AI. Powered by Gemini.', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
};
