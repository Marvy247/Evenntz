"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hide header on mobile for host pages
  const isHostPage = pathname.startsWith('/host');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`w-full glass-enhanced border-b border-foreground/10 sticky top-0 z-50 transition-all duration-300 ${isHostPage ? 'hidden lg:block' : ''}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 font-bold text-xl lg:text-2xl text-foreground hover:text-foreground/80 transition-all duration-300 hover:scale-105 group"
            onClick={closeMenu}
          >
            <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 group-hover:from-purple-600 group-hover:to-blue-500 transition-all duration-300 shadow-lg"></div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Evenntz
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 hover:scale-105 relative group"
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/events"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 hover:scale-105 relative group"
            >
              Explore Events
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/host/signin"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 hover:scale-105 relative group"
            >
              Host Events
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <div className="ml-2">
              <ConnectButton />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 border border-foreground/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
              <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="py-4 space-y-4">
            <Link
              href="/dashboard"
              className="block px-4 py-3 text-base font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all duration-300"
              onClick={closeMenu}
            >
              Dashboard
            </Link>
            <Link
              href="/events"
              className="block px-4 py-3 text-base font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all duration-300"
              onClick={closeMenu}
            >
              Explore Events
            </Link>
            <Link
              href="/host/signin"
              className="block px-4 py-3 text-base font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all duration-300"
              onClick={closeMenu}
            >
              Host Events
            </Link>
            <div className="px-4 py-2">
              <ThemeToggle />
            </div>
            <div className="px-4 py-2">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
