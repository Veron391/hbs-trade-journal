"use client";

import { Trade, TradeType, Direction } from '../types';
import * as crypto from 'crypto-js';
import { proxyRequest } from './proxyService';

// Binance API response formats
interface BinanceTradeResponse {
  symbol: string;
  id: number;
  orderId: number;
  orderListId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

// Common Binance trading pairs
export const COMMON_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 
  'DOGEUSDT', 'DOTUSDT', 'UNIUSDT', 'LINKUSDT', 'SOLUSDT'
];

// Helper function to create Binance API signature
function generateBinanceSignature(queryString: string, secretKey: string): string {
  return crypto.HmacSHA256(queryString, secretKey).toString(crypto.enc.Hex);
}

// Helper function to format Binance timestamp
function getTimestamp(): number {
  return Date.now();
}

// Helper to process trades from Binance into entry/exit pairs
// This is a more sophisticated approach for matching trades
function matchTrades(trades: BinanceTradeResponse[]): Trade[] {
  const processedTrades: Trade[] = [];
  const tradeMap: {[key: string]: BinanceTradeResponse[]} = {};
  
  // Check if we're using mock data
  const isMockData = trades.length > 0 && '_isMockData' in trades[0];
  if (isMockData) {
    console.warn('USING MOCK DATA: The trades being displayed are simulated and not from your actual Binance account');
    
    // Show a warning to the user
    const mockWarningDiv = document.createElement('div');
    mockWarningDiv.className = 'fixed top-4 left-4 bg-blue-600 text-white p-4 rounded-md shadow-lg z-50 max-w-md';
    mockWarningDiv.innerHTML = `
      <p class="font-semibold">Using Simulated Data</p>
      <p class="text-sm">These trades are simulated examples, not your actual trading history.</p>
      <p class="text-sm mt-1">To see your real trades, try the Python script import option in Profile.</p>
      <button class="text-xs underline mt-2" onclick="this.parentNode.remove()">Dismiss</button>
    `;
    document.body.appendChild(mockWarningDiv);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (document.body.contains(mockWarningDiv)) {
        mockWarningDiv.remove();
      }
    }, 15000);
  }
  
  // Group trades by symbol
  trades.forEach(trade => {
    if (!tradeMap[trade.symbol]) {
      tradeMap[trade.symbol] = [];
    }
    tradeMap[trade.symbol].push(trade);
  });
  
  // For each symbol, process trades
  Object.keys(tradeMap).forEach(symbol => {
    const symbolTrades = tradeMap[symbol];
    
    // Sort by time ascending
    symbolTrades.sort((a, b) => a.time - b.time);
    
    // Create a queue for buy/sell trades
    const buyQueue: BinanceTradeResponse[] = [];
    const sellQueue: BinanceTradeResponse[] = [];
    
    // Process all trades for this symbol
    symbolTrades.forEach(trade => {
      // Add to appropriate queue
      if (trade.isBuyer) {
        buyQueue.push(trade);
      } else {
        sellQueue.push(trade);
      }
      
      // Try to match trades while both queues have elements
      while (buyQueue.length > 0 && sellQueue.length > 0) {
        const buy = buyQueue[0];
        const sell = sellQueue[0];
        
        // Determine which is entry and which is exit based on time
        const [entryTrade, exitTrade] = buy.time < sell.time ? [buy, sell] : [sell, buy];
        
        // Determine direction based on entry
        const direction: Direction = entryTrade.isBuyer ? 'long' : 'short';
        
        // Determine quantity to match
        const buyQty = parseFloat(buy.qty);
        const sellQty = parseFloat(sell.qty);
        const matchQty = Math.min(buyQty, sellQty);
        
        // Calculate prices
        const entryPrice = parseFloat(entryTrade.price);
        const exitPrice = parseFloat(exitTrade.price);
        
        // Create nice display symbol
        let displaySymbol = symbol;
        if (symbol.endsWith('USDT')) {
          displaySymbol = symbol.replace('USDT', '');
        }
        
        // Format dates
        const entryDate = new Date(entryTrade.time).toISOString().split('T')[0];
        const exitDate = new Date(exitTrade.time).toISOString().split('T')[0];
        
        // Create the processed trade
        processedTrades.push({
          id: `${entryTrade.id}-${exitTrade.id}`,
          symbol: displaySymbol,
          type: 'crypto', // All Binance trades are crypto
          direction,
          entryDate,
          exitDate,
          entryPrice,
          exitPrice,
          quantity: matchQty,
          setupNotes: isMockData ? 'SIMULATED DATA - Not a real trade' : '',
          mistakesNotes: isMockData ? 'This is example trade data only - not from your account' : '',
          tags: isMockData ? ['SIMULATED_DATA'] : []
        });
        
        // Update quantities or remove from queues
        if (buyQty === sellQty) {
          // Equal quantities - remove both
          buyQueue.shift();
          sellQueue.shift();
        } else if (buyQty > sellQty) {
          // More bought than sold - update buy quantity and remove sell
          buy.qty = (buyQty - sellQty).toString();
          sellQueue.shift();
        } else {
          // More sold than bought - update sell quantity and remove buy
          sell.qty = (sellQty - buyQty).toString();
          buyQueue.shift();
        }
      }
    });
  });
  
  // Sort by exit date (most recent first)
  processedTrades.sort((a, b) => 
    new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
  );
  
  return processedTrades;
}

export async function fetchTradesFromApi(): Promise<Trade[]> {
  // Check if we have already imported data
  const usingImportedData = localStorage.getItem('using_imported_data');
  if (usingImportedData === 'true') {
    console.log('Using previously imported trade data instead of API fetch');
    // Don't fetch from API if we already imported data
    // Return empty array as trades are already in localStorage via TradeContext
    return [];
  }

  // Get API keys from localStorage
  const apiKey = localStorage.getItem('apiKey');
  const secretKey = localStorage.getItem('secretKey');
  
  if (!apiKey || !secretKey) {
    console.error('API keys missing: Please configure your Binance API credentials in Profile section');
    // Add visible warning about missing API keys
    const warningDiv = document.createElement('div');
    warningDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-md shadow-lg z-50 max-w-md';
    warningDiv.innerHTML = `
      <p class="font-semibold">API Keys Missing</p>
      <p class="text-sm">Please configure your Binance API credentials in the Profile section.</p>
      <button class="text-xs underline mt-2" onclick="this.parentNode.remove()">Dismiss</button>
    `;
    document.body.appendChild(warningDiv);
    
    throw new Error('API keys not configured. Please set your API keys in the Profile section.');
  }
  
  try {
    // Get stored trading pairs or use common pairs as default
    const storedPairs = localStorage.getItem('tradingPairs');
    const tradingPairs = storedPairs ? JSON.parse(storedPairs) : COMMON_PAIRS;
    
    console.log('Fetching trades for pairs:', tradingPairs);
    
    // Create timestamp for Binance API request
    const timestamp = getTimestamp();
    
    // Calculate timestamp for 3 months ago (90 days)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    const startTime = threeMonthsAgo.getTime();
    
    // Log to help debug
    console.log('Using API Key:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 5));
    console.log('Start time for fetch:', new Date(startTime).toLocaleString());
    
    let useDirect = true;
    const allTrades: BinanceTradeResponse[] = [];
    
    // First try direct API access if no CORS marker exists
    if (!document.getElementById('cors-error-detected')) {
      // Try direct access first
      try {
        for (const pair of tradingPairs.slice(0, 1)) { // Only try with first pair to test
          console.log(`Trying direct API access with ${pair}`);
          
          // Binance requires a signature based on the query parameters
          const queryParams = `symbol=${pair}&timestamp=${timestamp}&limit=5&startTime=${startTime}`;
          const signature = generateBinanceSignature(queryParams, secretKey);
          
          // Build the URL with all necessary parameters
          const url = `https://api.binance.com/api/v3/myTrades?${queryParams}&signature=${signature}`;
          
          // Try request
          const testResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'X-MBX-APIKEY': apiKey,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });
          
          if (!testResponse.ok) {
            if (testResponse.status === 403) {
              console.error('API key permissions issue');
              throw new Error('Your API key does not have permission to access trade data');
            }
            
            console.log('Direct API access failed, switching to proxy');
            useDirect = false;
            break;
          }
        }
      } catch (error) {
        console.log('Direct API access error, switching to proxy', error);
        useDirect = false;
        
        // Mark CORS issues for future reference
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.error('CORS error detected. Adding hidden marker to DOM');
          const corsMarker = document.createElement('div');
          corsMarker.id = 'cors-error-detected';
          corsMarker.style.display = 'none';
          document.body.appendChild(corsMarker);
        }
      }
    } else {
      console.log('CORS issues detected previously, using proxy directly');
      useDirect = false;
    }
    
    // If direct access works, use it
    if (useDirect) {
      console.log('Using direct API access for all pairs');
      for (const pair of tradingPairs) {
        try {
          // Binance requires a signature based on the query parameters
          const queryParams = `symbol=${pair}&timestamp=${timestamp}&limit=1000&startTime=${startTime}`;
          const signature = generateBinanceSignature(queryParams, secretKey);
          
          // Build the URL with all necessary parameters
          const url = `https://api.binance.com/api/v3/myTrades?${queryParams}&signature=${signature}`;
          
          console.log(`Fetching trades for ${pair} from ${new Date(startTime).toLocaleDateString()}`);
          
          // DEBUG: Log request details but hide sensitive info
          console.log(`API Request URL: ${url.split('&signature=')[0]}&signature=***`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'X-MBX-APIKEY': apiKey,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });
          
          // Full response debugging
          console.log(`Response status for ${pair}:`, response.status, response.statusText);
          
          if (!response.ok) {
            let errorMessage = `HTTP error ${response.status}`;
            try {
              const errorData = await response.json();
              console.error(`Error fetching trades for ${pair}:`, errorData);
              errorMessage = `API Error: ${errorData.code} - ${errorData.msg || response.statusText}`;
            } catch (parseError) {
              console.error(`Failed to parse error response for ${pair}:`, parseError);
            }
            throw new Error(errorMessage);
          }
          
          const pairTrades: BinanceTradeResponse[] = await response.json();
          console.log(`Retrieved ${pairTrades.length} trades for ${pair}`);
          allTrades.push(...pairTrades);
        } catch (error) {
          console.error(`Error fetching trades for ${pair}:`, error);
          // Continue with other pairs even if one fails
        }
      }
    } else {
      // Use proxy service instead
      console.log('Using proxy service for API access');
      for (const pair of tradingPairs) {
        try {
          // Use our proxy service instead of direct API calls
          const proxyParams = {
            symbol: pair,
            timestamp: timestamp,
            limit: 1000,
            startTime: startTime
          };
          
          const pairTrades = await proxyRequest({
            endpoint: 'myTrades',
            params: proxyParams,
            apiKey,
            secretKey
          });
          
          console.log(`Retrieved ${pairTrades.length} trades for ${pair} via proxy`);
          allTrades.push(...pairTrades);
        } catch (error) {
          console.error(`Error fetching trades for ${pair} via proxy:`, error);
        }
      }
    }
    
    console.log(`Total trades fetched: ${allTrades.length}`);
    
    if (allTrades.length === 0) {
      console.log('No trades found, using mock data');
      
      // Don't show mock data warning if we're using imported data
      if (localStorage.getItem('using_imported_data') !== 'true') {
        // Add visible warning to UI when using mock data
        const warningDiv = document.createElement('div');
        warningDiv.className = 'fixed top-4 right-4 bg-yellow-600 text-white p-4 rounded-md shadow-lg z-50 max-w-md';
        warningDiv.innerHTML = `
          <p class="font-semibold">Using Demo Data</p>
          <p class="text-sm">API connection unsuccessful. Check your API keys in the Profile section or import data using the Python script.</p>
          <button class="text-xs underline mt-2" onclick="this.parentNode.remove()">Dismiss</button>
        `;
        document.body.appendChild(warningDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (document.body.contains(warningDiv)) {
            warningDiv.remove();
          }
        }, 10000);
      }
      
      return getMockTradeData();
    }
    
    // Process and match trades to create entry/exit pairs
    const formattedTrades = matchTrades(allTrades);
    console.log('Processed trades:', formattedTrades.length);
    
    return formattedTrades;
  } catch (error) {
    console.error('Error fetching trades from Binance API:', error);
    
    // Log detailed debugging information
    console.log('API Debug Info:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      hasSecretKey: !!secretKey, 
      timeRangeStart: new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000)).toISOString(),
      timeRangeEnd: new Date().toISOString(),
      navigatorOnline: navigator.onLine,
    });
    
    // Check if CORS issues (common with direct API calls from browsers)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('CORS error detected. Consider using a proxy or browser extension to bypass CORS.');
      // Add hidden element to track CORS error for future reference
      const corsMarker = document.createElement('div');
      corsMarker.id = 'cors-error-detected';
      corsMarker.style.display = 'none';
      document.body.appendChild(corsMarker);
      
      // Return mock data for demo purposes when CORS is an issue
      console.log('Using mock data due to CORS restrictions');
      return getMockTradeData();
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to fetch trades from API. Please check your connection and try again.');
  }
}

// Mock data function for testing or when API can't be reached
function getMockTradeData(): Trade[] {
  console.log('Generating mock trade data');
  
  const mockTrades: Trade[] = [
    {
      id: 'mock-1',
      symbol: 'BTC',
      type: 'crypto',
      direction: 'long', // Only long trades
      entryDate: '2023-12-01',
      exitDate: '2023-12-10',
      entryPrice: 42000,
      exitPrice: 44500,
      quantity: 0.15,
      setupNotes: 'MOCK DATA - API connection unsuccessful',
      mistakesNotes: 'This is example data only. Check your API configuration.',
      tags: ['MOCK_DATA', 'EXAMPLE']
    },
    {
      id: 'mock-2',
      symbol: 'ETH',
      type: 'crypto',
      direction: 'long', // Only long trades
      entryDate: '2023-12-05',
      exitDate: '2023-12-15',
      entryPrice: 2200,
      exitPrice: 2350,
      quantity: 1.5,
      setupNotes: 'MOCK DATA - API connection unsuccessful',
      mistakesNotes: 'This is example data only. Check your API configuration.',
      tags: ['MOCK_DATA', 'EXAMPLE']
    }
  ];
  
  return mockTrades;
} 