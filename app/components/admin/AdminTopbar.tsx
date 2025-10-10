"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  Search,
  LogOut,
  X
} from 'lucide-react';

interface AdminTopbarProps {}

export default function AdminTopbar({}: AdminTopbarProps) {
  const { adminUser, adminLogout } = useAdmin();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleLogout = () => {
    adminLogout();
    router.push('/admin/login');
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Search in users
      const usersResponse = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}&type=users`);
      const usersData = await usersResponse.json();
      
      // Search in trades
      const tradesResponse = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}&type=trades`);
      const tradesData = await tradesResponse.json();
      
      const results = [
        ...(usersData.users || []).map((user: any) => ({ ...user, type: 'user' })),
        ...(tradesData.trades || []).map((trade: any) => ({ ...trade, type: 'trade' }))
      ];
      
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSearchResults(false);
        setSearchQuery('');
        break;
    }
  };

  // Debounce search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleResultClick = (result: any) => {
    if (result.type === 'user') {
      router.push(`/admin/users/${result.id}`);
    } else if (result.type === 'trade') {
      router.push(`/admin/trades`);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#1A1A1F] backdrop-blur border-b border-neutral-700/50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3">
              <img
                src="https://online.hbsakademiya.uz/images/svg/logo.svg"
                alt="HBS Academy"
                className="h-8 w-auto logo-partial-white"
              />
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="flex flex-1 max-w-md mx-8 search-container">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search users, trades, analytics..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1f] border-2 border-blue-500/40 rounded-lg text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 hover:bg-blue-900/30 hover:border-blue-500/60 transition-colors"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1F] border border-neutral-700/50 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="p-2">
                      <div className="text-xs text-neutral-500 px-3 py-2 border-b border-neutral-700/50">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                      </div>
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          onClick={() => handleResultClick(result)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${
                            selectedIndex === index 
                              ? 'bg-blue-600/20 border border-blue-500/30' 
                              : 'hover:bg-neutral-800/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            result.type === 'user' 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                              : 'bg-gradient-to-br from-green-500 to-teal-600'
                          }`}>
                            {result.type === 'user' ? 'U' : 'T'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate group-hover:text-blue-300 transition-colors">
                              {result.type === 'user' ? result.name : `${result.symbol} - ${result.direction}`}
                            </div>
                            <div className="text-sm text-neutral-400 truncate">
                              {result.type === 'user' ? result.email : `P&L: $${(result.pnl || 0).toLocaleString()}`}
                            </div>
                          </div>
                          <div className="text-xs text-neutral-500 uppercase font-medium">
                            {result.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.trim() ? (
                    <div className="p-4 text-center text-neutral-400">
                      <div className="text-sm">No results found for</div>
                      <div className="font-medium text-neutral-300">"{searchQuery}"</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Welcome Text and Logout */}
          <div className="flex items-center gap-4">
            {/* Welcome Text */}
            <span className="text-neutral-300 text-sm">
              Welcome, {adminUser?.username || 'admin'}
            </span>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
