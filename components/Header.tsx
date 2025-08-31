import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants'; // Assuming ICONS might be used for dropdown items

interface HeaderProps {
  onEditPreferences: () => void;
  onShowMyAccount: () => void;
  onShowOtherSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onEditPreferences, onShowMyAccount, onShowOtherSettings }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownItemClick = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
  };

  return (
    <header className={`bg-slate-900/50 backdrop-blur-md shadow-lg sticky top-0 z-50 transition-all duration-300 ease-in-out ${isScrolled ? 'py-2' : 'py-3 sm:py-5'}`}>
      <div className="container mx-auto px-3 sm:px-4 relative flex items-center justify-between h-14 sm:h-16">
        {/* Scrolled Header Content (left-aligned) */}
        <div className={`flex items-center space-x-2 sm:space-x-3 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          <img
            src="./icons/icon32.png"
            alt="CineMan AI logo"
            className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0"
          />
          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 whitespace-nowrap">
            CineMan AI
          </h1>
        </div>
        
        {/* Unscrolled Header Content (centered, absolute position) */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-opacity duration-300 ${isScrolled ? 'opacity-0 invisible' : 'opacity-100'}`}>
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-1">
            <img
              src="./icons/icon32.png"
              alt="CineMan AI logo"
              className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0"
            />
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 whitespace-nowrap">
              CineMan AI
            </h1>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300 tracking-wide text-center max-w-[220px] sm:max-w-none">
            Your Personalised Movie Recommender
          </p>
        </div>

        {/* Settings Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleDropdown}
            className="p-2 sm:p-2.5 rounded-full hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-colors"
            aria-label="Open settings menu"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-slate-400 hover:text-purple-300 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.44 1.022.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.427.27 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 sm:w-56 origin-top-right bg-slate-800 border border-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50">
              <button
                onClick={() => handleDropdownItemClick(onEditPreferences)}
                className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-200 hover:bg-purple-600 hover:text-white transition-colors duration-150"
                role="menuitem"
              >
                Saved Preferences
              </button>
              <button
                onClick={() => handleDropdownItemClick(onShowMyAccount)}
                className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-200 hover:bg-purple-600 hover:text-white transition-colors duration-150"
                role="menuitem"
              >
                My Account
              </button>
              <button
                onClick={() => handleDropdownItemClick(onShowOtherSettings)}
                className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-200 hover:bg-purple-600 hover:text-white transition-colors duration-150"
                role="menuitem"
              >
                Other Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
