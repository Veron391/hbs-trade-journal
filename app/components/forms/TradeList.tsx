"use client";

import { useState, useEffect } from 'react';
import { useTrades } from '../../context/TradeContext';
import { Trade } from '../../types';
import { format } from 'date-fns';
import { Pencil, Trash2, ArrowUp, ArrowDown, Download, FileDown, AlertTriangle, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import TradeForm from './TradeForm';
import { useI18n } from '../../context/I18nContext';

export default function TradeList() {
  const { t } = useI18n();
  const { trades, deleteTrade, importTradesFromApi, isImporting, importError, clearAllTrades } = useTrades();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Trade>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradeList_sortBy');
      return (saved as keyof Trade) || 'exitDate';
    }
    return 'exitDate';
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradeList_sortDirection');
      return (saved as 'asc' | 'desc') || 'desc';
    }
    return 'desc';
  });
  const [apiMessage, setApiMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 20;

  // Update API message when import error changes
  useEffect(() => {
    if (importError) {
      setApiMessage({ type: 'error', text: importError });
      
      // Clear error message after 5 seconds
      const timer = setTimeout(() => {
        setApiMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [importError]);

  // Show script instructions instead of fetching API data
  const handleImportTrades = () => {
    setShowScriptModal(true);
  };

  const handleSort = (column: keyof Trade) => {
    let newSortDirection: 'asc' | 'desc';
    
    if (sortBy === column) {
      newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newSortDirection);
    } else {
      setSortBy(column);
      newSortDirection = 'desc';
      setSortDirection(newSortDirection);
    }
    
    // Save sorting options to localStorage
    localStorage.setItem('tradeList_sortBy', column);
    localStorage.setItem('tradeList_sortDirection', newSortDirection);
  };

  // Fetch a single trade detail from backend and map to internal structure
  const loadTradeDetail = async (id: string, fallback: Trade) => {
    try {
      setIsDetailLoading(true);
      const res = await fetch(`/api/journal/trades/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        setSelectedTradeDetails(fallback);
        return;
      }
      const b = await res.json();
      const mapped: Trade = {
        id: String(b.id),
        symbol: b.symbol,
        type: b.trade_type === 2 ? 'stock' : 'crypto',
        direction: b.direction,
        entryDate: b.entry_date,
        exitDate: b.exit_date,
        entryPrice: Number(b.buy_price),
        exitPrice: b.sell_price != null ? Number(b.sell_price) : 0,
        quantity: Number(b.quantity),
        setupNotes: b.trade_setup_notes || '',
        mistakesLearnings: b.ml_notes || '',
        tags: Array.isArray(b.tags) ? b.tags : [],
        link: b.trade_link || '',
        pnlAmount: b.pnl_amount ?? null,
        pnlPercentage: b.pnl_percentage ?? null,
      };
      setSelectedTradeDetails(mapped);
    } catch {
      setSelectedTradeDetails(fallback);
    } finally {
      setIsDetailLoading(false);
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
    const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : 0;
    const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : 0;
    const quantity = typeof trade.quantity === 'number' ? trade.quantity : 0;
    
    const entryValue = entryPrice * quantity;
    const exitValue = exitPrice * quantity;
    
    if (trade.direction === 'long') {
      return exitValue - entryValue;
    } else {
      return entryValue - exitValue;
    }
  };

  const calculatePnLPercentage = (trade: Trade) => {
    const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : 0;
    const quantity = typeof trade.quantity === 'number' ? trade.quantity : 0;
    const entryValue = entryPrice * quantity;
    const pnl = calculatePnL(trade);
    
    return entryValue === 0 ? 0 : (pnl / entryValue) * 100;
  };

  if (editingTrade) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6 text-white">{t('addNewTrade')}</h2>
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
        <h2 className="text-xl font-semibold mb-6 text-white">{t('addNewTrade')}</h2>
        <TradeForm onComplete={() => setIsAddingTrade(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">{t('yourTrades')}</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsAddingTrade(true)}
            className="px-2.5 py-1.5 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-40 text-sm"
          >
            {t('addNewTrade')}
          </button>
          {trades.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="flex items-center px-2.5 py-1.5 bg-red-700 text-white rounded-md hover:bg-red-800 text-sm"
            >
              <AlertTriangle size={13} className="mr-1.5" />
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

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1C1719] rounded-lg p-6 max-w-md w-full mx-4 border border-red-500">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">Delete All Trades</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete <strong className="text-red-400">{trades.length}</strong> trade{trades.length !== 1 ? 's' : ''}?
              </p>
              <p className="text-red-400 text-sm">
                ⚠️ This action cannot be undone!
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  try {
                    await clearAllTrades();
                    setApiMessage({ 
                      type: 'success', 
                      text: `Successfully deleted all ${trades.length} trade${trades.length !== 1 ? 's' : ''}!` 
                    });
                    
                    // Clear message after 5 seconds
                    setTimeout(() => {
                      setApiMessage(null);
                    }, 5000);
                    
                    setShowDeleteAllModal(false);
                  } catch (error) {
                    setApiMessage({ 
                      type: 'error', 
                      text: 'Failed to delete all trades. Please try again.' 
                    });
                    
                    // Clear error message after 5 seconds
                    setTimeout(() => {
                      setApiMessage(null);
                    }, 5000);
                  }
                }}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
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

      {trades.length === 0 ? (
        <div className="text-center py-12 bg-[#1C1719] rounded-lg">
          <p className="text-gray-300">{t('emptyTradesHint')}</p>
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
                      {t('direction')}
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
                      {t('entryDate')}
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
                      {t('exitDate')}
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
                      {t('entryPrice')}
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
                      {t('exitPrice')}
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
                      {t('quantity')}
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
                  const pnl = trade.pnlAmount != null ? Number(trade.pnlAmount) : calculatePnL(trade);
                  const pnlPercent = trade.pnlPercentage != null ? Number(trade.pnlPercentage) : calculatePnLPercentage(trade);
                  const isProfitable = pnl > 0;
                  
                  return (
                  <tr 
                      key={trade.id} 
                      className="hover:bg-blue-500/10 hover:border-blue-500/20 transition-none cursor-pointer border border-transparent"
                      onClick={() => loadTradeDetail(trade.id, trade)}
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
                        {typeof trade.entryPrice === 'number' ? trade.entryPrice.toFixed(2) : trade.entryPrice}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        {typeof trade.exitPrice === 'number' ? trade.exitPrice.toFixed(2) : trade.exitPrice}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center whitespace-nowrap">
                        {trade.quantity}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className={`text-sm font-medium ${isProfitable ? 'text-green-600' : pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {isProfitable ? '+' : pnl < 0 ? '-' : ''}${Math.abs(pnl).toFixed(2)}
                        </div>
                        <div className={`text-xs ${isProfitable ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                          {isProfitable ? '+' : pnl < 0 ? '-' : ''}{Math.abs(pnlPercent).toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium whitespace-nowrap">
                        <div className="flex justify-center items-center">
                          {trade.link ? (
                            <a
                              href={trade.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:bg-gray-700/30 rounded p-1 transition-colors"
                              title="Open trade link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={18} style={{ color: '#F4E9D7' }} />
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
                                setApiMessage({ 
                                  type: 'success', 
                                  text: `Trade ${trade.symbol} deleted successfully!` 
                                });
                                
                                // Clear message after 3 seconds
                                setTimeout(() => {
                                  setApiMessage(null);
                                }, 3000);
                              } catch (error) {
                                setApiMessage({ 
                                  type: 'error', 
                                  text: `Failed to delete trade ${trade.symbol}. Please try again.` 
                                });
                                
                                // Clear error message after 5 seconds
                                setTimeout(() => {
                                  setApiMessage(null);
                                }, 5000);
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
            className="bg-gradient-to-br from-[#141015] to-[#0f0b0d] border border-[#2e2a2c] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">
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
              <div className="grid grid-cols-2 gap-6 mb-6">
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
                      className="px-2.5 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full"
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
              <div className="rounded-xl p-5 mb-6 border border-[#2f2a2c] bg-gradient-to-br from-[#171317] to-[#181419]">
                <h4 className="text-white font-medium mb-4">Profit & Loss</h4>
                <div className="grid grid-cols-2 gap-6">
                  {(() => {
                    const pnl = selectedTradeDetails.pnlAmount != null ? Number(selectedTradeDetails.pnlAmount) : calculatePnL(selectedTradeDetails);
                    const pnlPercent = selectedTradeDetails.pnlPercentage != null ? Number(selectedTradeDetails.pnlPercentage) : calculatePnLPercentage(selectedTradeDetails);
                    const isProfitable = pnl > 0;
                    
                    return (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Amount</label>
                          <div className={`text-xl font-semibold ${isProfitable ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {isProfitable ? '+' : pnl < 0 ? '-' : ''}${Math.abs(pnl).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Percentage</label>
                          <div className={`text-xl font-semibold ${isProfitable ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {isProfitable ? '+' : pnl < 0 ? '-' : ''}{Math.abs(pnlPercent).toFixed(2)}%
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>


              {/* Notes */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded-lg bg-blue-500/20">
                      <FileText size={14} className="text-blue-400" />
                    </div>
                    <h4 className="text-sm font-medium text-blue-300">Trade Setup Notes</h4>
                  </div>
                  <div className="text-sm text-white bg-gradient-to-r from-blue-900/30 to-blue-800/20 rounded-lg py-3 px-2 border border-blue-500/20 transition-all duration-300 hover:from-blue-800/40 hover:to-blue-700/30 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-400/40">
                    {selectedTradeDetails.setupNotes && selectedTradeDetails.setupNotes.trim() !== ''
                      ? selectedTradeDetails.setupNotes
                      : 'No setup notes provided'}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded-lg bg-orange-500/20">
                      <AlertCircle size={14} className="text-orange-400" />
                    </div>
                    <h4 className="text-sm font-medium text-orange-300">Mistakes & Learnings</h4>
                  </div>
                  <div className="text-sm text-white bg-gradient-to-r from-orange-900/30 to-red-800/20 rounded-lg py-3 px-2 border border-orange-500/20 transition-all duration-300 hover:from-orange-800/40 hover:to-red-700/30 hover:shadow-lg hover:shadow-orange-500/20 hover:border-orange-400/40">
                    {selectedTradeDetails.mistakesLearnings && selectedTradeDetails.mistakesLearnings.trim() !== ''
                      ? selectedTradeDetails.mistakesLearnings
                      : 'No mistakes/learnings added'}
                  </div>
                </div>
              </div>

              {/* Link */}
              <div className="mt-4">
                {selectedTradeDetails.link ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1 rounded-lg" style={{ backgroundColor: '#F4E9D720' }}>
                        <ExternalLink size={14} style={{ color: '#F4E9D7' }} />
                      </div>
                      <h4 className="text-sm font-medium" style={{ color: '#F4E9D7' }}>Trade Link</h4>
                    </div>
                    <a
                      href={selectedTradeDetails.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white rounded-lg py-3 px-2 block transition-all duration-300 hover:shadow-lg hover:shadow-[#F4E9D7]/30 break-all border border-[#F4E9D7]/20 bg-gradient-to-r from-[#F4E9D7]/10 to-[#F4E9D7]/10"
                    >
                      {selectedTradeDetails.link}
                    </a>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1 rounded-lg" style={{ backgroundColor: '#F4E9D720' }}>
                        <ExternalLink size={14} style={{ color: '#F4E9D7' }} />
                      </div>
                      <h4 className="text-sm font-medium" style={{ color: '#F4E9D7' }}>Trade Link</h4>
                    </div>
                    <span className="text-sm text-gray-500">No link provided</span>
                  </div>
                )}
              </div>

              {isDetailLoading && (
                <div className="mt-4 text-sm text-gray-400">Loading details…</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 