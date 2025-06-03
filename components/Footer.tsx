
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900/30 py-6 text-center mt-12 border-t border-slate-700">
      <p className="text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} What to watch!. Powered by Gemini.
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Disclaimer: Movie recommendations are AI-generated and may not always be perfect.
      </p>
    </footer>
  );
};