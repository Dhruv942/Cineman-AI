import React, { useEffect, useRef } from 'react';

interface ReviewPromptProps {
  onRate: () => void;
  onDismiss: () => void;
}

export const ReviewPrompt: React.FC<ReviewPromptProps> = ({ onRate, onDismiss }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-prompt-title"
    >
      <div
        ref={modalRef}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md text-center p-8 border border-purple-600/50 transform animate-scale-in"
      >
        <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        `}</style>
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        </div>
        <h2 id="review-prompt-title" className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
          Enjoying CineMan AI?
        </h2>
        <p className="text-slate-300 mb-8">
          Please rate it to help us grow the community and keep improving the app!
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onDismiss}
            className="w-full sm:w-1/2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md transition-all duration-150"
          >
            Maybe Later
          </button>
          <button
            onClick={onRate}
            className="w-full sm:w-1/2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
          >
            Rate Now
          </button>
        </div>
      </div>
    </div>
  );
};