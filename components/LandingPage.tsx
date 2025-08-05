import React, { useEffect } from 'react';

interface LandingPageProps {
  onStartOnboarding: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartOnboarding }) => {
  console.log('[LandingPage] Rendered');

  useEffect(() => {
    console.log('[LandingPage] Mounted');
  }, []);

  const appStyle: React.CSSProperties = {
    background: `
      radial-gradient(ellipse farthest-corner at 10% 15%, rgba(165, 180, 252, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse farthest-corner at 85% 90%, rgba(192, 132, 252, 0.07) 0%, transparent 50%),
      #0f172a
    `,
    backgroundAttachment: 'fixed',
  };

  const FeatureCard: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => {
    console.log('[LandingPage] Rendering FeatureCard:', title);
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-1 transition-transform duration-200">
        <div
          className="flex items-center justify-center mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 mx-auto"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{title}</h3>
        <p className="text-sm sm:text-base text-slate-300">{children}</p>
      </div>
    );
  };

  return (
    <div style={appStyle} className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-slate-100 text-center overflow-hidden">
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-7xl mx-auto">
        <div style={{ animation: 'fade-in-hero 0.8s ease-out forwards' }} className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
            <img
              src="./icons/icon128.png"
              alt="CineMan AI logo"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              CineMan AI
            </h1>
          </div>
          
          <p className="max-w-sm sm:max-w-xl lg:max-w-2xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-slate-200 mb-3 sm:mb-4 px-4">
            Stop Scrolling, Start Watching.
          </p>
          
          <p className="max-w-xs sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-300 mb-6 sm:mb-8 lg:mb-10 px-4 leading-relaxed">
            Tired of endless browsing? Let our advanced AI learn your unique taste and find your next favorite movie or series in seconds.
          </p>
          
          <button
            onClick={onStartOnboarding}
            className="w-full max-w-xs sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 text-base sm:text-lg"
          >
            Get Started For Free
          </button>
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-24 w-full max-w-6xl mx-auto px-2 sm:px-4" style={{ animation: 'fade-in-hero 0.8s ease-out 0.3s forwards' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <FeatureCard
              icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 sm:w-6 sm:h-6 text-sky-400"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>`}
              title="AI Suggestions"
            >
              Tell us your mood and genres, we'll find the perfect match.
            </FeatureCard>
            <FeatureCard
              icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 sm:w-6 sm:h-6 text-sky-400"><path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V8.625c0-.621.504-1.125 1.125-1.125H7.5M12 15V7.5" /></svg>`}
              title="Discover & Rate"
            >
              Refine your taste profile with our fun, swipe-style rating system.
            </FeatureCard>
            <FeatureCard
              icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 sm:w-6 sm:h-6 text-sky-400"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m10.117 0a5.971 5.971 0 0 0-.941-3.197M12 12.75a2.25 2.25 0 0 0-2.25 2.25a2.25 2.25 0 0 0 2.25 2.25a2.25 2.25 0 0 0 2.25-2.25a2.25 2.25 0 0 0-2.25-2.25M12 12.75V11.25m0 1.5V14.25m0-1.5H10.5m1.5 0H13.5m-3-3.75h.643c.621 0 1.223.256 1.657.7l.657.657a.75.75 0 0 1 0 1.06l-.657.657a2.528 2.528 0 0 1-1.657.7H10.5m3-3.75h-.643c-.621 0-1.223.256-1.657.7l-.657.657a.75.75 0 0 0 0 1.06l.657.657a2.528 2.528 0 0 0 1.657.7H13.5" /></svg>`}
              title="Watch Party"
            >
              Organize movie nights and find something everyone will enjoy.
            </FeatureCard>
          </div>
          
          {/* Third card spans full width on mobile when in 2-column layout */}
          <div className="sm:hidden lg:hidden mt-4">
            {/* This div ensures proper spacing on mobile */}
          </div>
        </div>
      </main>

      <footer className="py-4 sm:py-6 text-center w-full">
        <p className="text-slate-400 text-xs sm:text-sm px-4">
          &copy; {new Date().getFullYear()} CineMan AI. Powered by Gemini.
        </p>
      </footer>
    </div>
  );
};