import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Ticket, LayoutDashboard, User, Scan, LogOut, LogIn } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { WalletButton } from './WalletButton';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // New state for mounted status
  useEffect(() => setMounted(true), []); // Set mounted to true after initial render

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const navLinks = [
    { name: 'Events', href: '/', icon: Ticket },
    { name: 'My Tickets', href: '/my-tickets', icon: Ticket },
    { name: 'Organizer', href: '/organizer', icon: LayoutDashboard },
    { name: 'Scanner', href: '/scanner', icon: Scan },
  ];

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center space-x-2">
              <Ticket className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">EventFi</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <link.icon className="h-4 w-4" />
                <span>{link.name}</span>
              </Link>
            ))}
            <WalletButton />
            {mounted && isConnected && address && (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  <User className="h-4 w-4" />
                  <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <button
                    onClick={disconnect}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.name}</span>
            </Link>
          ))}
          <div className="pt-4 pb-3 border-t border-gray-700">
            {mounted && isConnected && address ? (
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 rounded-full text-gray-400" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-white">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-400">
                    Connected
                  </div>
                </div>
                <button
                  onClick={() => { disconnect(); setIsOpen(false); }}
                  className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <span className="sr-only">Disconnect wallet</span>
                  <LogOut className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="px-5">
                <button
                  onClick={() => { setIsOpen(false); /* connectWallet(); */ }}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-base font-medium flex items-center justify-center space-x-2 hover:bg-blue-700"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Connect Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
