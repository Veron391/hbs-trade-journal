"use client";

import { useState, useEffect } from 'react';
import { useTrades, useTradeMutations } from '../../../lib/hooks/useTrades';
import { Trade } from '../../types';
import { format } from 'date-fns';
import { Pencil, Trash2, ArrowUp, ArrowDown, Download, FileDown, AlertTriangle, Terminal, ExternalLink } from 'lucide-react';
import TradeForm from './TradeForm';
import { Trade as DbTrade } from '@prisma/client';

// Convert database trade to frontend trade format
function convertDbTradeToFrontend(dbTrade: DbTrade): Trade {
  // Handle both Date objects and string dates
  const occurredAt = typeof dbTrade.occurredAt === 'string' 
    ? new Date(dbTrade.occurredAt) 
    : dbTrade.occurredAt;
  
  const entryDate = dbTrade.entryDate 
    ? (typeof dbTrade.entryDate === 'string' 
        ? new Date(dbTrade.entryDate) 
        : dbTrade.entryDate)
    : occurredAt; // Fallback to occurredAt if entryDate is not available
    
  const exitDate = dbTrade.exitDate 
    ? (typeof dbTrade.exitDate === 'string' 
        ? new Date(dbTrade.exitDate) 
        : dbTrade.exitDate)
    : occurredAt; // Fallback to occurredAt if exitDate is not available
  
  // Format dates as YYYY-MM-DD using local timezone to avoid timezone issues
  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    id: dbTrade.id,
    type: dbTrade.assetType as 'stock' | 'crypto',
    symbol: dbTrade.symbol,
    direction: dbTrade.side === 'buy' ? 'long' : 'short',
    entryDate: formatDate(entryDate),
    exitDate: formatDate(exitDate),
    entryPrice: dbTrade.entryPrice ? parseFloat(String(dbTrade.entryPrice)) : 0,
    exitPrice: dbTrade.exitPrice ? parseFloat(String(dbTrade.exitPrice)) : parseFloat(String(dbTrade.price)),
    quantity: dbTrade.qty,
    setupNotes: dbTrade.setupNotes || '',
    mistakesNotes: dbTrade.mistakesNotes || '',
    tags: dbTrade.tags ? dbTrade.tags.split(', ').filter(tag => tag.trim()) : [],
    link: dbTrade.link || undefined,
  };
}

export default function TradeList() {
  const { trades: dbTrades, isLoading, error } = useTrades();
  const { deleteTrade, clearAllTrades } = useTradeMutations();
  
  // Convert database trades to frontend format
  const trades = dbTrades.map(convertDbTradeToFrontend);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Trade>('exitDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [apiMessage, setApiMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 20;

  // Update API message when error changes
  useEffect(() => {
    if (error) {
      setApiMessage({ type: 'error', text: error.message || 'An error occurred' });
      
      // Clear error message after 5 seconds
      const timer = setTimeout(() => {
        setApiMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (apiMessage && apiMessage.type === 'success') {
      const timer = setTimeout(() => {
        setApiMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [apiMessage]);

  // Show script instructions instead of fetching API data
  const handleImportTrades = () => {
    setShowScriptModal(true);
  };

  const handleSort = (column: keyof Trade) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    if (sortBy === 'entryDate' || sortBy === 'exitDate') {
      const dateA = new Date(a[sortBy]);
      const dateB = new Date(b[sortBy]);
      return sortDirection === 'asc' 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    }

    if (sortBy === 'entryPrice' || sortBy === 'exitPrice' || sortBy === 'quantity') {
      return sortDirection === 'asc' 
        ? a[sortBy] - b[sortBy] 
        : b[sortBy] - a[sortBy];
    }

    const valA = String(a[sortBy]).toLowerCase();
    const valB = String(b[sortBy]).toLowerCase();
    
    return sortDirection === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const paginatedTrades = sortedTrades.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const calculatePnL = (trade: Trade) => {
    // Parse prices as numbers with proper validation
    const entryPrice = typeof trade.entryPrice === 'number' 
      ? trade.entryPrice 
      : parseFloat(String(trade.entryPrice || '0'));
    const exitPrice = typeof trade.exitPrice === 'number' 
      ? trade.exitPrice 
      : parseFloat(String(trade.exitPrice || '0'));
    const quantity = typeof trade.quantity === 'number' 
      ? trade.quantity 
      : parseFloat(String(trade.quantity || '1')); // Default quantity = 1
    
    // Validate parsed values
    if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(quantity)) {
      return 0;
    }
    
    if (trade.direction === 'long') {
      // Long: profit = (exit - entry) * quantity
      return (exitPrice - entryPrice) * quantity;
    } else {
      // Short: profit = (entry - exit) * quantity
      return (entryPrice - exitPrice) * quantity;
    }
  };

  const calculatePnLPercentage = (trade: Trade) => {
    // Parse prices as numbers with proper validation
    const entryPrice = typeof trade.entryPrice === 'number' 
      ? trade.entryPrice 
      : parseFloat(String(trade.entryPrice || '0'));
    const quantity = typeof trade.quantity === 'number' 
      ? trade.quantity 
      : parseFloat(String(trade.quantity || '1')); // Default quantity = 1
    
    // Validate parsed values
    if (isNaN(entryPrice) || isNaN(quantity) || entryPrice === 0) {
      return 0;
    }
    
    const pnl = calculatePnL(trade);
    return (pnl / (entryPrice * quantity)) * 100;
  };

  if (editingTrade) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6 text-white">Edit Trade</h2>
        <TradeForm 
          existingTrade={editingTrade} 
          onComplete={() => setEditingTrade(null)} 
        />
      </div>
    );
  }

  if (isAddingTrade) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6 text-white">Add New Trade</h2>
        <TradeForm onComplete={() => setIsAddingTrade(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Your Trades</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleImportTrades}
            className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <Terminal size={14} className="mr-1.5" />
            GET DATA
          </button>
          <button
            onClick={() => setIsAddingTrade(true)}
            className="px-3 py-1.5 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-40 text-sm"
          >
            Add New Trade
          </button>
          {trades.length > 0 && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete ALL trades? This action cannot be undone.')) {
                  try {
                    await clearAllTrades();
                    setApiMessage({ type: 'success', text: 'All trades have been deleted successfully' });
                  } catch (error) {
                    setApiMessage({ type: 'error', text: 'Failed to delete trades. Please try again.' });
                  }
                }
              }}
              className="flex items-center px-3 py-1.5 bg-red-700 text-white rounded-md hover:bg-red-800 text-sm"
            >
              <AlertTriangle size={14} className="mr-1.5" />
              DELETE ALL
            </button>
          )}
        </div>
      </div>

      {/* Python Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-20 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Getting Your Real Trade Data</h3>
            
            <p className="text-gray-300 mb-4">
              To fetch your real Binance trade data, you'll need to run a Python script on your computer. 
              This bypasses the CORS restrictions that prevent browser access to the Binance API.
            </p>
            
            <div className="space-y-6">
              <div className="bg-gray-700 p-4 rounded-20">
                <h4 className="text-lg font-medium text-white mb-2">Step 1: Setup</h4>
                <ol className="list-decimal pl-5 text-gray-300 space-y-2">
                  <li>Install Python from <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">python.org</a> if you don't have it</li>
                  <li>Install the Binance package: <code className="bg-gray-900 px-1 rounded">pip install python-binance</code></li>
                  <li>Download these two scripts from the <strong>scripts</strong> folder in the app directory:</li>
                  <ul className="list-disc pl-5 mt-1">
                    <li><code className="bg-gray-900 px-1 rounded">fetch_binance_trades.py</code></li>
                    <li><code className="bg-gray-900 px-1 rounded">import_data.py</code></li>
                  </ul>
                </ol>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-20">
                <h4 className="text-lg font-medium text-white mb-2">Step 2: Get Binance API Keys</h4>
                <ol className="list-decimal pl-5 text-gray-300 space-y-2">
                  <li>Log in to your <a href="https://www.binance.com/en/my/settings/api-management" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Binance account</a></li>
                  <li>Go to API Management</li>
                  <li>Create a new API key (with "Read Info" permissions only)</li>
                  <li>Save your API Key and Secret Key</li>
                </ol>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-20">
                <h4 className="text-lg font-medium text-white mb-2">Step 3: Run the Script</h4>
                <p className="text-gray-300 mb-2">Open a terminal or command prompt and run:</p>
                <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-x-auto">
                  python fetch_binance_trades.py YOUR_API_KEY YOUR_SECRET_KEY
                </pre>
                <p className="text-gray-300 mt-2">This will create a file called <code className="bg-gray-900 px-1 rounded">binance_trades.json</code></p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-20">
                <h4 className="text-lg font-medium text-white mb-2">Step 4: Import the Data</h4>
                <ol className="list-decimal pl-5 text-gray-300 space-y-2">
                  <li>Go to the Profile section in this app</li>
                  <li>Scroll down to "Import Trades from JSON"</li>
                  <li>Upload the binance_trades.json file</li>
                </ol>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-20 hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {apiMessage && (
        <div className={`${
          apiMessage.type === 'success' ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500'
        } border text-white px-4 py-3 rounded-20 mb-4`}>
          {apiMessage.text}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 bg-[#1C1719] rounded-lg">
          <p className="text-gray-300">Loading trades...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-12 bg-[#1C1719] rounded-lg">
          <p className="text-gray-300">No trades recorded yet. Add your first trade or import from your trading platform.</p>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="rounded-20 glass-70 border-2 border-[#2b2b2b] overflow-hidden">
            <table className="w-full table-auto divide-y divide-[#2b2b2b]">
              <thead className="text-white ring-2 ring-[#2d282a] shadow-lg backdrop-blur-2xl sticky top-0 z-30" style={{ backgroundColor: 'rgba(25, 7, 15, 0.63)' }}>
                <tr>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider cursor-pointer w-[12%]"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Symbol
                      {sortBy === 'symbol' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider cursor-pointer w-[8%]"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Type
                      {sortBy === 'type' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider cursor-pointer w-[10%]"
                    onClick={() => handleSort('direction')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Direction
                      {sortBy === 'direction' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider cursor-pointer w-[12%]"
                    onClick={() => handleSort('entryDate')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Entry Date
                      {sortBy === 'entryDate' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider cursor-pointer w-[12%]"
                    onClick={() => handleSort('exitDate')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Exit Date
                      {sortBy === 'exitDate' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer w-[10%]"
                    onClick={() => handleSort('entryPrice')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Entry Price
                      {sortBy === 'entryPrice' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer w-[10%]"
                    onClick={() => handleSort('exitPrice')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Exit Price
                      {sortBy === 'exitPrice' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-center text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer w-[8%]"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-center whitespace-nowrap">
                      Quantity
                      {sortBy === 'quantity' && (
                        sortDirection === 'asc' ? <ArrowUp size={12} className="ml-0.5 text-green-400" /> : <ArrowDown size={12} className="ml-0.5 text-red-400" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider w-[10%]">
                    P/L
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider w-[6%]">
                    Link
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-sm font-medium text-white uppercase tracking-wider w-[8%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b2b2b]">
                {paginatedTrades.map((trade) => {
                  const pnl = calculatePnL(trade);
                  const pnlPercent = calculatePnLPercentage(trade);
                  const isProfitable = pnl > 0;
                  
                  return (
                    <tr 
                      key={trade.id} 
                      className="hover:bg-blue-500/10 hover:border-blue-500/20 transition-none cursor-pointer border border-transparent"
                      onClick={() => setSelectedTradeDetails(trade)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-100 text-center whitespace-nowrap">
                        {trade.symbol.replace(/USDT$/, '')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        <span 
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md"
                          style={{
                            backgroundColor: trade.type === 'stock' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 165, 0, 0.2)', // Blue for stock, orange for crypto
                            color: trade.type === 'stock' ? '#3B82F6' : '#FFA500' // Blue text for stock, orange for crypto
                          }}
                        >
                          {trade.type === 'stock' ? 'Stock' : 'Crypto'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            trade.direction === 'long' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.direction === 'long' ? 'Long' : 'Short'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        {format(new Date(trade.exitDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        {(() => {
                          const price = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice) || '0');
                          return price % 1 === 0 ? price.toString() : price.toFixed(2).replace(/\.?0+$/, '');
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        {(() => {
                          const price = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice) || '0');
                          return price % 1 === 0 ? price.toString() : price.toFixed(2).replace(/\.?0+$/, '');
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        {trade.quantity}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className={`text-sm font-medium ${pnl > 0 ? 'text-green-600' : pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {pnl > 0 ? '+' : pnl < 0 ? '–' : ''}${Math.abs(pnl).toFixed(2)}
                        </div>
                        <div className={`text-xs ${pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                          {pnl > 0 ? '+' : pnl < 0 ? '–' : ''}{Math.abs(pnlPercent).toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium whitespace-nowrap">
                        <div className="flex justify-center items-center">
                          {trade.link ? (
                            <a
                              href={trade.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Open trade link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={18} />
                            </a>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrade(trade);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this trade?')) {
                              try {
                                await deleteTrade(trade.id);
                              } catch (err) {
                                console.error('Error deleting trade:', err);
                                setApiMessage({ type: 'error', text: 'Failed to delete trade' });
                              }
                            }
                          }}
                          className="text-danger hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedTrades.length)} of {sortedTrades.length} trades
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentPage === 1
                      ? 'bg-[#1C1719]/50 border border-white/10 text-gray-400 cursor-not-allowed'
                      : 'bg-[#1C1719] border border-white/20 text-white hover:bg-blue-600/20'
                  }`}
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    const showPages = 5; // Show 5 page numbers at most
                    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                    let endPage = Math.min(totalPages, startPage + showPages - 1);
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < showPages) {
                      startPage = Math.max(1, endPage - showPages + 1);
                    }

                    // First page and ellipsis
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => setCurrentPage(1)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            currentPage === 1
                              ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                              : 'bg-[#1C1719] border border-white/20 text-white hover:bg-blue-600/20'
                          }`}
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="start-ellipsis" className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                    }

                    // Page numbers
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            i === currentPage
                              ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                              : 'bg-[#1C1719] border border-white/20 text-white hover:bg-blue-600/20'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Last page and ellipsis
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="end-ellipsis" className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            currentPage === totalPages
                              ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                              : 'bg-[#1C1719] border border-white/20 text-white hover:bg-blue-600/20'
                          }`}
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentPage === totalPages
                      ? 'bg-[#1C1719]/50 border border-white/10 text-gray-400 cursor-not-allowed'
                      : 'bg-[#1C1719] border border-white/20 text-white hover:bg-blue-600/20'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trade Details Modal */}
      {selectedTradeDetails && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTradeDetails(null)}
        >
          <div 
            className="bg-[#1C1719] border border-white/20 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {selectedTradeDetails.symbol.replace(/USDT$/, '')} Trade Details
                </h3>
                <button
                  onClick={() => setSelectedTradeDetails(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Trade Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Symbol</label>
                    <div className="text-white font-medium">
                      {selectedTradeDetails.symbol.replace(/USDT$/, '')}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                    <span
                      className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md"
                      style={{
                        backgroundColor: selectedTradeDetails.type === 'stock' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                        color: selectedTradeDetails.type === 'stock' ? '#3B82F6' : '#FFA500'
                      }}
                    >
                      {selectedTradeDetails.type === 'stock' ? 'Stock' : 'Crypto'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Direction</label>
                    <div className="text-white font-medium capitalize">
                      {selectedTradeDetails.direction}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                    <div className="text-white font-medium">
                      {selectedTradeDetails.quantity}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Entry Price</label>
                    <div className="text-white font-medium">
                      ${(() => {
                        const price = typeof selectedTradeDetails.entryPrice === 'number' 
                          ? selectedTradeDetails.entryPrice 
                          : parseFloat(String(selectedTradeDetails.entryPrice) || '0');
                        return price % 1 === 0 ? price.toString() : price.toFixed(4).replace(/\.?0+$/, '');
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Exit Price</label>
                    <div className="text-white font-medium">
                      ${(() => {
                        const price = typeof selectedTradeDetails.exitPrice === 'number' 
                          ? selectedTradeDetails.exitPrice 
                          : parseFloat(String(selectedTradeDetails.exitPrice) || '0');
                        return price % 1 === 0 ? price.toString() : price.toFixed(4).replace(/\.?0+$/, '');
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Entry Date</label>
                    <div className="text-white font-medium">
                      {format(new Date(selectedTradeDetails.entryDate), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Exit Date</label>
                    <div className="text-white font-medium">
                      {format(new Date(selectedTradeDetails.exitDate), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>

              {/* P/L Section */}
              <div className="bg-[#231F21] rounded-lg p-4 mb-6">
                <h4 className="text-white font-medium mb-3">Profit & Loss</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const pnl = calculatePnL(selectedTradeDetails);
                    const pnlPercent = calculatePnLPercentage(selectedTradeDetails);
                    const isProfitable = pnl > 0;
                    
                    return (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Amount</label>
                          <div className={`text-lg font-bold ${pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {pnl > 0 ? '+' : pnl < 0 ? '–' : ''}${Math.abs(pnl).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Percentage</label>
                          <div className={`text-lg font-bold ${pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {pnl > 0 ? '+' : pnl < 0 ? '–' : ''}{Math.abs(pnlPercent).toFixed(2)}%
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Tags */}
              {selectedTradeDetails.tags && selectedTradeDetails.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-white font-medium mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTradeDetails.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(selectedTradeDetails.setupNotes || selectedTradeDetails.mistakesNotes) && (
                <div className="space-y-4">
                  {selectedTradeDetails.setupNotes && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Trade Setup Notes</h4>
                      <div className="bg-[#231F21] rounded-lg p-3 text-gray-300 text-sm">
                        {selectedTradeDetails.setupNotes}
                      </div>
                    </div>
                  )}

                  {selectedTradeDetails.mistakesNotes && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Mistakes & Learnings</h4>
                      <div className="bg-[#231F21] rounded-lg p-3 text-gray-300 text-sm">
                        {selectedTradeDetails.mistakesNotes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Link */}
              {selectedTradeDetails.link && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href={selectedTradeDetails.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Open Trade Link
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 