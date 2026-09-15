import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateAppConfiguration } from './config/env';

// Validate application configuration and Gemini API readiness on initialization
validateAppConfiguration();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
