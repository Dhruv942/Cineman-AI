import React from 'react';
import { ICONS, CINE_SUGGEST_SHARE_URL } from '../constants';
import { trackEvent } from '../services/analyticsService';

export const ShareButtons: React.FC = () => {
  const shareMessage = "Here’s my personalized movie list from CineMan AI — get yours!";
  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(CINE_SUGGEST_SHARE_URL);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedMessage}%20${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`,
  };

  const handleShare = (platform: 'whatsapp' | 'x' | 'facebook') => {
    trackEvent('share_recommendations', { platform });
    window.open(shareLinks[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mb-8 text-center">
      <p className="text-sm text-slate-400 mb-3">Enjoying your list? Share it!</p>
      <div className="flex items-center justify-center space-x-4">
        <div
          onClick={() => handleShare('whatsapp')}
          className="cursor-pointer hover:scale-110 transition-transform duration-200"
          title="Share on WhatsApp"
        >
          <span 
            dangerouslySetInnerHTML={{ __html: ICONS.whatsapp }} 
            className="w-12 h-12 sm:w-14 sm:h-14 block" 
          />
        </div>
        <div
          onClick={() => handleShare('x')}
          className="cursor-pointer hover:scale-110 transition-transform duration-200"
          title="Share on X"
        >
          <span 
            dangerouslySetInnerHTML={{ __html: ICONS.twitter }} 
            className="w-12 h-12 sm:w-14 sm:h-14 block" 
          />
        </div>
        <div
          onClick={() => handleShare('facebook')}
          className="cursor-pointer hover:scale-110 transition-transform duration-200"
          title="Share on Facebook"
        >
          <span 
            dangerouslySetInnerHTML={{ __html: ICONS.facebook }} 
            className="w-12 h-12 sm:w-14 sm:h-14 block" 
          />
        </div>
      </div>
    </div>
  );
};
