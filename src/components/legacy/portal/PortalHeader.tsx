"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import LogoutButton from "@/components/legacy/auth/LogoutButton";

interface PortalHeaderProps {
  eventName: string;
  headGuestName: string;
}

export default function PortalHeader({
  eventName,
  headGuestName,
}: PortalHeaderProps) {
  const params = useParams();
  const pathname = usePathname();
  const eventId = params.eventId as string;
  const guestId = params.guestId as string;

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

  const basePath = `/events/${eventId}/portal/${guestId}`;

  const mainLinks = [
    { name: "Dashboard", href: basePath },
    { name: "Venues", href: `${basePath}/venue` },
    { name: "Guests", href: `${basePath}/guests` },
  ];

  const otherLinks = [
    { name: "Flights & Travel", href: `${basePath}/flights` },
    { name: "Catering & Meals", href: `${basePath}/catering` },
    { name: "Local Transfers", href: `${basePath}/transfer` },
    { name: "Room Assignments", href: `${basePath}/rooms`, highlight: true },
  ];

  // Helper to check if a link is active
  const isActive = (href: string) => {
    if (href === basePath) {
        return pathname === href; // Exact match for dashboard
    }
    return pathname.startsWith(href); // Starts with for sub-pages
  };

  const isOtherActive = otherLinks.some(link => isActive(link.href));

  return (
    <header className="bg-gradient-premium shadow-inner-highlight sticky top-0 w-full h-16 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-6">
            {/* Logo and Branding */}
            <Link
              href={basePath}
              className="flex items-center gap-3"
            >
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src="/images/logo.jpg"
                  alt="TBO Logo"
                  fill
                  className="object-contain rounded-lg shadow-sm"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-white">
                TBO Event Planner
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            {mainLinks.map((link) => (
              !isActive(link.href) && (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/80 hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  {link.name}
                </Link>
              )
            ))}

            {/* Other Facilities Dropdown */}
            <div className="relative group ml-2">
              <button className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                isOtherActive ? "text-white bg-white/20" : "text-white/80 hover:text-white hover:bg-white/10"
              }`}>
                Other
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="absolute right-0 top-full hidden group-hover:block w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">
                {otherLinks.map((link) => (
                  !isActive(link.href) && (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`block px-4 py-2 text-sm transition-colors font-medium text-gray-700 hover:bg-gray-50`}
                    >
                      {link.name}
                    </Link>
                  )
                ))}
              </div>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative ml-4 border-l border-white/20 pl-4" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer "
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {headGuestName ? headGuestName.charAt(0).toUpperCase() : 'H'}
                  </span>
                </div>
                <span className="text-white text-sm font-medium hidden md:block">
                  {headGuestName}
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
                  <div className="px-4 py-2 text-xs font-semibold text-corporate-blue-100 border-b border-neutral-100 mb-1 leading-snug">
                    {eventName}
                  </div>
                  <div className="px-3 pt-2 pb-1">
                    <div className="w-full flex justify-center [&>button]:w-full [&>button]:justify-center">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
