import React, { useEffect, useRef } from 'react';

interface TrailerModalProps {
  trailerId: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ trailerId, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Normalize trailerId in case a full YouTube URL was provided instead of just the ID
  const getEmbedId = (input: string): string => {
    try {
      // If it's already a clean ID (no special chars except - _), return as-is
      if (/^[a-zA-Z0-9_-]{6,}$/i.test(input) && !input.includes('http')) {
        return input;
      }
      const url = new URL(input);
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get('v');
      if (v) return v;
      // Short URL: https://youtu.be/VIDEO_ID
      if (url.hostname.includes('youtu.be')) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0]) return parts[0];
      }
      // Embed URL already: https://www.youtube.com/embed/VIDEO_ID
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.replace('/embed/', '').split('/')[0];
        if (id) return id;
      }
    } catch {}
    // Fallback to raw input
    return input;
  };
  const embedId = getEmbedId(trailerId);

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
          src={`https://www.youtube.com/embed/${embedId}?autoplay=1&rel=0&modestbranding=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};
