
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants'; // Assuming ICONS might be used for dropdown items

interface HeaderProps {
  onEditPreferences: () => void;
  onShowMyAccount: () => void;
  onShowOtherSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onEditPreferences, onShowMyAccount, onShowOtherSettings }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

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
    <header className="bg-slate-900/50 backdrop-blur-md shadow-lg sticky top-0 z-50 py-5">
      <div className="container mx-auto px-4 relative flex items-center justify-between">
        {/* Placeholder for spacing */}
        <div className="w-8 h-8 sm:w-10 sm:h-10"></div>

        {/* Centered Title Content */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400">
              <path d="M18 4H6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1.1c.42 3.38 1.42 6.55 2.9 9l2-5 2 5c1.48-2.45 2.48-5.62 2.9-9H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 6h10v3H7V6zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
            </svg>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              What to watch!
            </h1>
          </div>
          <p className="text-base sm:text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300 tracking-wide">
            Personalised movie recommender
          </p>
        </div>

        {/* Settings Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleDropdown}
            className="p-2 rounded-full hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-colors"
            aria-label="Open settings menu"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-400 hover:text-purple-300 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.44 1.022.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.427.27 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right bg-slate-800 border border-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50">
              <button
                onClick={() => handleDropdownItemClick(onEditPreferences)}
                className="block w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-purple-600 hover:text-white transition-colors duration-150"
                role="menuitem"
              >
                Saved Preferences
              </button>
              <button
                onClick={() => handleDropdownItemClick(onShowMyAccount)}
                className="block w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-purple-600 hover:text-white transition-colors duration-150"
                role="menuitem"
              >
                My Account
              </button>
              <button
                onClick={() => handleDropdownItemClick(onShowOtherSettings)}
                className="block w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-purple-600 hover:text-white transition-colors duration-150"
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