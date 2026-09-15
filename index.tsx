
console.log("[Index] Script started");
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initMonitoring } from './src/services/monitoringService';

// Initialize Sentry Global Error Tracking and Performance Monitoring
initMonitoring();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);

