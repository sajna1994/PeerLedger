import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Only attempt to register service worker in production
if (process.env.NODE_ENV === 'production') {
  // Dynamic import to avoid loading the module in development
  import('./serviceWorkerRegistration').then(({ register }) => {
    register();
  }).catch(err => {
    console.log('Service worker registration skipped:', err);
  });
}

reportWebVitals();