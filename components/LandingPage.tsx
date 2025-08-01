
import React from 'react';

interface LandingPageProps {
  onStartOnboarding: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartOnboarding }) => {

  const appStyle: React.CSSProperties = {
    background: `
      radial-gradient(ellipse farthest-corner at 10% 15%, rgba(165, 180, 252, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse farthest-corner at 85% 90%, rgba(192, 132, 252, 0.07) 0%, transparent 50%),
      #0f172a
    `,
    backgroundAttachment: 'fixed',
  };

  const FeatureCard: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center transform hover:-translate-y-1 transition-transform duration-200">
      <div className="flex items-center justify-center mb-4 w-12 h-12 rounded-full bg-purple-500/20 mx-auto"
           dangerouslySetInnerHTML={{ __html: icon }}>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-purple-300">{title}</h3>
      <p className="text-slate-400 text-sm">{children}</p>
    </div>
  );

  return (
    <div style={appStyle} className="min-h-screen flex flex-col items-center justify-center p-4 text-slate-100 text-center overflow-hidden">
      <main className="flex-grow flex flex-col items-center justify-center">
        <div style={{ animation: 'fade-in-hero 0.8s ease-out forwards' }} className="opacity-0">
            <div className="flex items-center justify-center space-x-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 sm:w-14 sm:h-14 text-purple-400">
                <path d="M18 4H6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1.1c.42 3.38 1.42 6.55 2.9 9l2-5 2 5c1.48-2.45 2.48-5.62 2.9-9H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 6h10v3H7V6zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                </svg>
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                CineMan AI
                </h1>
            </div>
            <p className="max-w-xl text-lg sm:text-2xl font-semibold text-slate-200 mb-4">
                Stop Scrolling, Start Watching.
            </p>
            <p className="max-w-2xl text-md sm:text-lg text-slate-300 mb-10">
                Tired of endless browsing? Let our advanced AI learn your unique taste and find your next favorite movie or series in seconds.
            </p>
            <button
                onClick={onStartOnboarding}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 text-lg"
            >
                Get Started For Free
            </button>
        </div>

        <div className="mt-24 w-full max-w-5xl mx-auto opacity-0" style={{ animation: 'fade-in-hero 0.8s ease-out 0.3s forwards' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-sky-400"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>`}
              title="AI Suggestions"
            >
              Tell us your mood and genres, we'll find the perfect match.
            </FeatureCard>
            <FeatureCard
              icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-sky-400"><path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25V8.625c0-.621.504-1.125 1.125-1.125H7.5M12 15V7.5" /></svg>`}
              title="Discover & Rate"
            >
              Refine your taste profile with our fun, swipe-style rating system.
            </FeatureCard>
            <FeatureCard
              icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-sky-400"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m10.117 0a5.971 5.971 0 0 0-.941-3.197M12 12.75a2.25 2.25 0 0 0-2.25 2.25a2.25 2.25 0 0 0 2.25 2.25a2.25 2.25 0 0 0 2.25-2.25a2.25 2.25 0 0 0-2.25-2.25M12 12.75V11.25m0 1.5V14.25m0-1.5H10.5m1.5 0H13.5m-3-3.75h.643c.621 0 1.223.256 1.657.7l.657.657a.75.75 0 0 1 0 1.06l-.657.657a2.528 2.528 0 0 1-1.657.7H10.5m3-3.75h-.643c-.621 0-1.223.256-1.657.7l-.657.657a.75.75 0 0 0 0 1.06l.657.657a2.528 2.528 0 0 0 1.657.7H13.5" /></svg>`}
              title="Watch Party"
            >
              Organize movie nights and find something everyone will enjoy.
            </FeatureCard>
          </div>
        </div>

      </main>
      <footer className="py-6 text-center">
        <p className="text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} CineMan AI. Powered by Gemini.
        </p>
      </footer>
    </div>
  );
};
