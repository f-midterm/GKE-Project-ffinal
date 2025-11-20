import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavItem from './nav_items';
import { logout, getUsername } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiLogOut, FiGrid, FiMenu, FiX } from 'react-icons/fi';

function HomeNavbar({ isAuthenticated, onAuthChange }) {
  const navLinks = useMemo(
    () => [
      { to: '/application', label: 'Application' },
      { to: '/partner', label: 'Partner' },
      { to: '/service', label: 'Service' },
      { to: '/contact', label: 'Contact' },
    ],
    []
  );

  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);
  const ticking = useRef(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { isAdmin, user } = useAuth();
  const username = getUsername();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY || window.pageYOffset;
      setScrolled(current > 10);
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          if (current > lastScroll.current && current > 80) {
            setHidden(true);
          } else {
            setHidden(false);
          }
          lastScroll.current = current;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setDropdownOpen(false);
    onAuthChange();
    navigate('/');
  }, [navigate, onAuthChange]);

  const handleDropdownToggle = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleClickOutside = useCallback(
    (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    },
    [dropdownRef]
  );

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, handleClickOutside]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div
        className={`w-full transition-colors duration-300 shadow-md ${
          scrolled ? 'bg-white' : 'bg-white/75'
        }`}
      >
        <div className="flex items-center lg:justify-center lg:gap-24 justify-between px-4 sm:px-6 lg:px-24 py-4">
          <Link to="/" className="text-4xl font-semibold logo">
            BeLiv
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <ul className="flex gap-6 items-center">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavItem to={link.to}>{link.label}</NavItem>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:flex items-center gap-4 relative" ref={dropdownRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleDropdownToggle}
                  className="btn rounded-full p-3 border-2 border-[#0076D4] hover:shadow-md hover:translate-y-[-0.5px]"
                >
                  <FiUser size={24} className="text-[#0076D4]" />
                </button>
                <span className="font-medium text-gray-700">{user?.username}</span>

                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <ul className="py-1">
                      <li>
                        <Link
                          to={`/user/${user?.id}`}
                          className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiUser className="mr-2" />
                          Profile
                        </Link>
                      </li>
                      {isAdmin && (
                        <li>
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <FiGrid className="mr-2" />
                            Dashboard
                          </Link>
                        </li>
                      )}
                      <li>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 text-red-600"
                        >
                          <FiLogOut className="mr-2" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="btn-primary rounded-full text-white text-lg font-medium px-8 py-3 bg-gradient-to-r from-[#0076D4] to-[#303841] shadow-md hover:translate-y-[-2px] transition-transform"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary rounded-full text-lg font-medium px-8 py-3 text-transparent bg-clip-text border-2 hover:translate-y-[-2px] transition-transform border-[#0076D4] bg-gradient-to-r from-[#0076D4] to-[#303841]"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={handleMobileMenuToggle} className="text-gray-800">
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <ul className="flex flex-col items-center gap-4 py-4">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavItem to={link.to} onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </NavItem>
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center py-4 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link
                    to={`/user/${user?.id}`}
                    className="flex justify-center items-center w-full px-4 py-4 text-left text-gray-800 hover:bg-gray-100"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setDropdownOpen(false);
                    }}
                  >
                    <FiUser className="mr-2" />
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex justify-center items-center w-full px-4 py-4 text-left text-gray-800 hover:bg-gray-100"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setDropdownOpen(false);
                      }}
                    >
                      <FiGrid className="mr-2" />
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex justify-center items-center w-full px-4 py-4 text-left text-gray-800 hover:bg-gray-100 text-red-600"
                  >
                    <FiLogOut className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <div className='flex flex-col items-center gap-4'>
                  <Link
                    to="/signup"
                    className="btn-primary rounded-full text-white text-lg font-medium px-8 py-3 bg-gradient-to-r from-[#0076D4] to-[#303841] shadow-md hover:translate-y-[-2px] transition-transform"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="btn-secondary rounded-full text-lg font-medium px-8 py-3 text-transparent bg-clip-text border-2 hover:translate-y-[-2px] transition-transform border-[#0076D4] bg-gradient-to-r from-[#0076D4] to-[#303841]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeNavbar;