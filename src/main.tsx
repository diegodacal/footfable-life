import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from '@ui/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// PWA: installable + offline. Saves are IndexedDB; the network is optional.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}
