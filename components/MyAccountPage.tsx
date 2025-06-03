
import React from 'react';

interface MyAccountPageProps {
  onBackToMain: () => void;
}

export const MyAccountPage: React.FC<MyAccountPageProps> = ({ onBackToMain }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900 p-4 text-slate-100">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-purple-400 mx-auto mb-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          My Account
        </h1>
        <p className="text-slate-300 mb-6">
          This is where your account details and settings would be managed.
        </p>
        <p className="text-slate-400 text-sm mb-8">
          (Feature under construction)
        </p>
        <button
          onClick={onBackToMain}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
        >
          Back to App
        </button>
      </div>
       <footer className="absolute bottom-6 text-center w-full">
        <p className="text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} What to watch!
        </p>
      </footer>
    </div>
  );
};