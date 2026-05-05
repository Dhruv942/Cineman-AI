import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Tag the root <html> when running as a Chrome extension popup so popup-only
// styles (min-width to fit the discovery card, e.g.) can be applied via CSS.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = (globalThis as any).chrome;
  if (c && c.runtime && c.runtime.id) {
    document.documentElement.classList.add('cineman-popup');
  }
} catch { /* not in chrome context */ }

// Surface unhandled promise rejections (which error boundaries don't catch)
// to the console with a CineMan-prefixed marker. Keeps the popup alive.
window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('[CineMan unhandledrejection]', event.reason);
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
