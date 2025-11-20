import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiBell, FiUser, FiLogOut } from "react-icons/fi";
import { GoHome } from "react-icons/go";
import { useAuth } from "../../hooks/useAuth";

function AdminNavbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-10">
      <div className="w-full transition-colors duration-300 shadow-md">
        <div className="flex justify-between py-4 lg:px-32 px-6 bg-white">
          {/* Left Side */}
          <div className="flex lg:gap-12 gap-6 items-center">
            <button
              className="btn rounded-full p-3 hover:text-[#0076D4]"
              onClick={toggleSidebar}
            >
              <FiMenu size={24} />
            </button>
            <Link to="/admin" className="logo text-4xl font-semibold">
              BeLiv
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex lg:gap-12 gap-6 items-center">
            <Link
              to="/admin/notifications"
              className="btn rounded-full p-3 hover:text-[#0076D4]"
            >
              <FiBell size={24} />
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                className="btn rounded-full p-3 border-2 border-[#0076D4] hover:shadow-md hover:translate-y-[-0.5px]"
              >
                <FiUser size={24} className="text-[#0076D4]" />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <ul className="py-1">
                    <li>
                      <Link
                        to={`/user/${user.id}`}
                        className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiUser className="mr-2" />
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/"
                        className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <GoHome className="mr-2" />
                        Back to Home
                      </Link>
                    </li>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminNavbar;
