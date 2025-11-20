import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import HomeNavbar from '../components/navbar/home_navbar';
import Footer from '../components/footer/Footer';
import { isAuthenticated as checkIsAuthenticated } from '../api';

function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkIsAuthenticated());

  const handleAuthChange = () => {
    setIsAuthenticated(checkIsAuthenticated());
  };

  useEffect(() => {
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <HomeNavbar isAuthenticated={isAuthenticated} onAuthChange={handleAuthChange} />
      </header>

      <main className="flex-1 w-full mx-auto">
        <Outlet context={{ isAuthenticated, onAuthChange: handleAuthChange }} />
      </main>

      <Footer />
    </div>
  );
}

export default Layout;