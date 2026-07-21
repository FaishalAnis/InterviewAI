import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/authStore";
import { Menu, X, LogOut, User as UserIcon, Settings, BarChart2, ShieldAlert } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f19]/70 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold tracking-tight gradient-text">InterviewAI</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-6">
              <Link to="/features" className="text-sm font-medium text-slate-300 hover:text-white transition">Features</Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-300 hover:text-white transition">Pricing</Link>
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition">Dashboard</Link>
                  <Link to="/history" className="text-sm font-medium text-slate-300 hover:text-white transition">History</Link>
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md border border-white/10">
                    {user?.full_name?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{user?.full_name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-darkCard border border-white/5 shadow-2xl py-1 z-50 backdrop-blur-lg">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <UserIcon size={16} className="mr-2" /> My Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Settings size={16} className="mr-2" /> Settings
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-rose-400 hover:bg-slate-800 hover:text-rose-300"
                      >
                        <ShieldAlert size={16} className="mr-2" /> Admin Panel
                      </Link>
                    )}
                    <hr className="border-white/5 my-1" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white text-left"
                    >
                      <LogOut size={16} className="mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">Sign In</Link>
                <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition shadow-lg shadow-primary-500/20">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-darkBg border-b border-white/5 px-2 pt-2 pb-4 space-y-1">
          <Link
            to="/features"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Pricing
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                History
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-4 border-t border-white/5 flex flex-col space-y-2 px-3">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="text-center py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
