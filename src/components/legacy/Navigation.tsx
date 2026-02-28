"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/legacy/auth/LogoutButton";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <nav className="bg-gradient-premium shadow-inner-highlight fixed top-0 w-full h-16 z-50 shadow-sm">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="TBO Logo"
            className="h-20 w-20 object-contain rounded-lg shadow-sm"
          />
          <span className="text-white font-semibold text-lg">
            TBO Events Planner
          </span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {pathname !== '/dashboard' && (
            <Link
              href="/dashboard"
              className="text-white/80 hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
            >
              Events
            </Link>
          )}
          
          {pathname !== '/analytics' && (
            <Link
              href="/analytics"
              className="text-white/80 hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
            >
              Analytics
            </Link>
          )}

          {/* Notifications */}
          <button className="text-white/75 hover:text-white transition-colors p-2 cursor-pointer">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative ml-4 border-l border-white/20 pl-4" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer "
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <span className="text-white text-sm font-medium hidden md:block">
                {user?.name || 'Agent'}
              </span>
              <svg 
                className={`w-4 h-4 text-white transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 z-50 overflow-hidden transform opacity-100 scale-100">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-neutral-50 hover:text-corporate-blue transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
                
                <div className="px-3 pt-2 pb-1 border-t border-neutral-100 mt-1">
                  <div className="w-full flex justify-center [&>button]:w-full [&>button]:justify-center">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
