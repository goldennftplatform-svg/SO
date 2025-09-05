import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// import { PrivyProvider } from '@privy-io/react-auth';

import App from './App.tsx';
import './styles/base.css';
import './globals.css';                // user-editable

import { init } from '@tarobase/js-sdk';
import ErrorBoundary from './ErrorBoundary';
import { setupGlobalErrorHandlers } from './lib/errorReporting';
import { TAROBASE_CONFIG, UI_CONFIG } from './lib/config';

const { appId, chain, rpcUrl, authMethod, wsApiUrl, apiUrl, authApiUrl } = TAROBASE_CONFIG;
const { errorReportUrl } = UI_CONFIG;

setupGlobalErrorHandlers(errorReportUrl);

// Skip Tarobase initialization for now to prevent crashes
console.log("Skipping Tarobase initialization to prevent crashes");







const AppWithChrome = () => {
  console.log('🚀 App starting without Privy - using direct wallet connections');
  
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary errorReportUrl={errorReportUrl}>
        <BrowserRouter>
          <AppWithChrome />
        </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
