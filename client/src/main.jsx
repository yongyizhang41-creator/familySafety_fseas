import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Register Firebase Service Worker for FCM Background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(import.meta.env.VITE_FIREBASE_API_KEY || '')}&authDomain=${encodeURIComponent(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '')}&projectId=${encodeURIComponent(import.meta.env.VITE_FIREBASE_PROJECT_ID || '')}&messagingSenderId=${encodeURIComponent(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')}&appId=${encodeURIComponent(import.meta.env.VITE_FIREBASE_APP_ID || '')}`;
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('SW registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
