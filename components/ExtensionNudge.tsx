import React from "react";

interface ExtensionNudgeProps {
  onInstallClick: () => void;
  onDismiss: () => void;
}

export const ExtensionNudge: React.FC<ExtensionNudgeProps> = ({
  onInstallClick,
  onDismiss,
}) => {
  return (
    <div className="mt-8 mb-4 p-6 sm:p-8 bg-gradient-to-br from-sky-900/30 to-cyan-900/30 border border-sky-500/30 rounded-xl shadow-lg backdrop-blur-sm animate-fade-in">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-20 h-20 text-sky-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
            />
          </svg>
        </div>
        {/* Text Content */}
        <div className="flex-grow text-center sm:text-left">
          <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-teal-300">
            Unlock Deeper Personalization
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Install our free browser extension to automatically build your taste
            profile from Netflix, Prime Video, and more. Get hyper-personalized
            suggestions effortlessly!
          </p>
        </div>
        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button
            onClick={onInstallClick}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.562-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
            Unlock for Free
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
