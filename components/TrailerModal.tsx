import React, { useEffect, useRef } from 'react';

interface TrailerModalProps {
  trailerId: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ trailerId, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Focus trapping could be added here for production-grade accessibility
    // For now, escape and click outside are handled.

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="trailer-modal-title"
    >
      <div 
        ref={modalRef} 
        className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl relative aspect-video"
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 z-20">
            <button
                onClick={onClose}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-200 transition-colors shadow-lg"
                aria-label="Close trailer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0&modestbranding=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};
