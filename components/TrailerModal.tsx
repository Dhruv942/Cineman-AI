import React, { useEffect, useRef, useState } from 'react';

interface TrailerModalProps {
  trailerId: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ trailerId, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [embedId, setEmbedId] = useState<string>("");
  
  // Normalize trailerId - extract video ID from URL or use direct if it's just an ID
  const getEmbedId = (input: string): string => {
    console.log("🔍 [TrailerModal] Processing trailer input:", input);
    try {
      // If it's already a clean ID (no special chars except - _), return as-is
      if (/^[a-zA-Z0-9_-]{6,}$/i.test(input) && !input.includes('http')) {
        console.log("✅ [TrailerModal] Input is already a clean ID:", input);
        return input;
      }
      
      // Try to parse as URL
      const url = new URL(input);
      console.log("🔗 [TrailerModal] Parsed URL:", url.href);
      
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get('v');
      if (v) {
        console.log("✅ [TrailerModal] Extracted video ID from watch URL:", v);
        return v;
      }
      
      // Short URL: https://youtu.be/VIDEO_ID
      if (url.hostname.includes('youtu.be')) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0]) {
          console.log("✅ [TrailerModal] Extracted video ID from short URL:", parts[0]);
          return parts[0];
        }
      }
      
      // Embed URL already: https://www.youtube.com/embed/VIDEO_ID
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.replace('/embed/', '').split('/')[0];
        if (id) {
          console.log("✅ [TrailerModal] Extracted video ID from embed URL:", id);
          return id;
        }
      }
    } catch (e) {
      console.log("⚠️ [TrailerModal] Could not parse as URL, treating as ID:", input);
      // If it's not a valid URL, treat as video ID
      return input;
    }
    // Fallback to raw input
    console.log("⚠️ [TrailerModal] Fallback to raw input:", input);
    return input;
  };

  useEffect(() => {
    const id = getEmbedId(trailerId);
    console.log("🎬 [TrailerModal] Embed ID extracted:", id, "from:", trailerId);
    setEmbedId(id);
    setVideoError(false);
  }, [trailerId]);

  const handleIframeError = () => {
    console.error("❌ [TrailerModal] Video unavailable for ID:", embedId);
    setVideoError(true);
  };

  // Listen for YouTube iframe API messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // YouTube iframe API sends messages about video state
      if (event.origin !== "https://www.youtube.com") return;
      
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        console.log("📺 [TrailerModal] YouTube message:", data);
        
        // Check for error events
        if (data.event === "error" || data.info === "ERROR" || data.info === "UNSTARTED") {
          console.warn("⚠️ [TrailerModal] YouTube video error detected");
          // Don't set error immediately, might be loading
        }
      } catch (e) {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
        {videoError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 rounded-lg p-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-red-400 text-lg font-semibold mb-2">Video Unavailable</p>
            <p className="text-slate-300 text-sm text-center mb-4">
              This trailer video is not available. The video may have been removed or is restricted in your region.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${embedId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onError={handleIframeError}
            onLoad={() => {
              console.log("✅ [TrailerModal] Iframe loaded for ID:", embedId);
              // Check if video title indicates error after a delay
              setTimeout(() => {
                if (iframeRef.current) {
                  try {
                    const iframe = iframeRef.current;
                    const iframeTitle = iframe.title || "";
                    console.log("📺 [TrailerModal] Iframe title:", iframeTitle);
                    
                    // Check if title indicates video is unavailable
                    if (iframeTitle.toLowerCase().includes("unavailable") || 
                        iframeTitle.toLowerCase().includes("private") ||
                        iframeTitle.toLowerCase().includes("removed") ||
                        iframeTitle.toLowerCase().includes("error")) {
                      console.warn("⚠️ [TrailerModal] Video appears to be unavailable based on title");
                      handleIframeError();
                    }
                  } catch (e) {
                    console.log("ℹ️ [TrailerModal] Could not check iframe title (expected for cross-origin)");
                  }
                }
              }, 3000);
            }}
          ></iframe>
        )}
      </div>
    </div>
  );
};
