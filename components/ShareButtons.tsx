import React from 'react';
import { ICONS, CINE_SUGGEST_SHARE_URL } from '../constants';
import { trackEvent } from '../services/analyticsService';
import { useLanguage } from '../hooks/useLanguage';

export const ShareButtons: React.FC = () => {
  const { t } = useLanguage();
  const shareMessage = "Here's my personalized movie list from CineMan AI — get yours!";
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
      <p className="text-sm text-slate-400 mb-3">{t('share_prompt', 'Enjoying your list? Share it!')}</p>
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => handleShare('whatsapp')}
          className="w-12 h-12 rounded-full   hover:bg-[#25D366] transition-all duration-200 transform hover:scale-110 flex items-center justify-center overflow-hidden"
          title="Share on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <div 
            dangerouslySetInnerHTML={{ __html: ICONS.whatsapp }} 
            className="[&>img]:w-15 [&>img]:h-15 [&>img]:rounded-full [&>img]:object-cover [&>img]:m-0"
          />
        </button>
        <button
          onClick={() => handleShare('x')}
          className="w-12 h-12 rounded-full hover:bg-black hover:border-black transition-all duration-200 transform hover:scale-110 flex items-center justify-center overflow-hidden"
          title="Share on X"
          aria-label="Share on X"
        >
          <div 
            dangerouslySetInnerHTML={{ __html: ICONS.twitter }} 
            className="[&>img]:w-15 [&>img]:h-15 [&>img]:rounded-full [&>img]:object-cover [&>img]:m-0"
          />
        </button>
        <button
          onClick={() => handleShare('facebook')}
          className="w-12 h-12 rounded-full  hover:bg-[#1877F2] transition-all duration-200 transform hover:scale-110 flex items-center justify-center overflow-hidden"
          title="Share on Facebook"
          aria-label="Share on Facebook"
        >
          <div 
            dangerouslySetInnerHTML={{ __html: ICONS.facebook }} 
            className="[&>img]:w-15 [&>img]:h-15 [&>img]:rounded-full [&>img]:object-cover [&>img]:m-0"
          />
        </button>
      </div>
    </div>
  );
};