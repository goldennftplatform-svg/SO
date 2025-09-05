import React, { JSX } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import HomePage from '@/components/HomePage';
import AdminPage from '@/components/AdminPage';
import { Toaster } from '@/components/ui/sonner';

function App(): JSX.Element {
  const location = useLocation();

  return (
    <div id="app-container" className="min-h-screen flex flex-col bg-background bg-grid-pattern">
      {/* Floating Bubbles Background */}
      <div className="floating-bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
      <Header />

      <main id="app-main" className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage adminAddresses={["6V9ng1g3UgafjCrCgXNBF4SwXbARB89YP9i8rAhY7Xem"]} />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Toaster />
    </div>
  );
}

export default App;
