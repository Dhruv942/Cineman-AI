import React, { useState, useEffect, useRef } from 'react';
import { CINE_SUGGEST_SHARE_URL } from '../constants';

interface ReferralPromptProps {
  onShare: () => void;
  onDismiss: () => void;
}

export const ReferralPrompt: React.FC<ReferralPromptProps> = ({ onShare, onDismiss }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copyButtonText, setCopyButtonText] = useState('Share with Friends');
  const isWebShareSupported = typeof navigator.share === 'function';

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

  const handleShareClick = async () => {
    const shareData = {
      title: 'CineMan AI',
      text: "I'm using CineMan AI to get awesome movie and series recommendations powered by Gemini! It's great for finding what to watch next. You should check it out:",
      url: CINE_SUGGEST_SHARE_URL,
    };

    if (isWebShareSupported) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully');
        onShare(); // Close prompt after successful share
      } catch (err) {
        console.error('Error sharing:', err);
        // User might have cancelled the share, which is fine. We don't close the prompt in this case.
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
        setCopyButtonText('Link Copied!');
        setTimeout(() => {
          onShare(); // Close prompt after showing confirmation
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        setCopyButtonText('Failed to Copy');
        setTimeout(() => setCopyButtonText('Share with Friends'), 2000);
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-prompt-title"
    >
      <div
        ref={modalRef}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md text-center p-8 border border-sky-600/50 transform animate-scale-in"
      >
        <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        `}</style>
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-100 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m10.117 0a5.971 5.971 0 00-.941-3.197M12 12.75a2.25 2.25 0 00-2.25 2.25a2.25 2.25 0 002.25 2.25a2.25 2.25 0 002.25-2.25a2.25 2.25 0 00-2.25-2.25M12 12.75V11.25m0 1.5V14.25m0-1.5H10.5m1.5 0H13.5m-3-3.75h.643c.621 0 1.223.256 1.657.7l.657.657a.75.75 0 010 1.06l-.657.657a2.528 2.528 0 01-1.657.7H10.5m3-3.75h-.643c-.621 0-1.223.256-1.657.7l-.657.657a.75.75 0 000 1.06l.657.657a2.528 2.528 0 001.657.7H13.5" />
          </svg>
        </div>
        <h2 id="referral-prompt-title" className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-teal-400">
          Share the Discovery!
        </h2>
        <p className="text-slate-300 mb-8">
          Help 3 of your friends end endless scrolling. Share CineMan AI and help them find their next favorite movie or series!
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onDismiss}
            className="w-full sm:w-1/2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md transition-all duration-150"
          >
            Maybe Later
          </button>
          <button
            onClick={handleShareClick}
            className="w-full sm:w-1/2 px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
          >
            {copyButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
