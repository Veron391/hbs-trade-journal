"use client";

/**
 * This proxy service is a workaround for CORS issues when calling the Binance API directly
 * from the browser. In a production environment, you would create a real backend proxy
 * or use a serverless function to handle these requests.
 * 
 * For demonstration purposes, this mock proxy simulates the API request process.
 */

// Mock proxy service for Binance API requests
// In a real application, this would be a server-side API endpoint

// Define interface for proxy request options
export interface ProxyRequestOptions {
  endpoint: string;
  method?: string;
  params: Record<string, any>;
  apiKey: string;
  secretKey: string;
}

/**
 * Simulates a proxy request to the Binance API
 * In a production environment, this would be replaced with a real proxy server
 */
export async function proxyRequest(options: ProxyRequestOptions): Promise<any> {
  // Log that we're using the proxy
  console.log(`Proxy request to ${options.endpoint} with params:`, {
    ...options.params,
    apiKey: options.apiKey.substring(0, 4) + '...',
    secretKey: '********'
  });
  
  // Mock different endpoints
  switch (options.endpoint) {
    case 'myTrades':
      return getMockTradesResponse(options.params.symbol);
    case 'account':
      return {
        makerCommission: 10,
        takerCommission: 10,
        buyerCommission: 0,
        sellerCommission: 0,
        canTrade: true,
        canWithdraw: true,
        canDeposit: true,
        updateTime: Date.now(),
        accountType: "SPOT",
        balances: [
          { asset: "BTC", free: "0.00250000", locked: "0.00000000" },
          { asset: "ETH", free: "0.05000000", locked: "0.00000000" },
          { asset: "USDT", free: "500.00000000", locked: "0.00000000" }
        ]
      };
    default:
      return { error: "Endpoint not supported by mock proxy" };
  }
}

/**
 * Generates mock trade data for a given symbol
 */
export function getMockTradesResponse(symbol: string): any[] {
  console.log(`Generating mock trades for ${symbol}`);
  
  // Historical price ranges for common cryptos to make mock data more realistic
  const priceRanges: Record<string, { min: number, max: number, decimals: number }> = {
    'BTCUSDT': { min: 35000, max: 47000, decimals: 2 },
    'ETHUSDT': { min: 1800, max: 2500, decimals: 2 },
    'BNBUSDT': { min: 280, max: 350, decimals: 2 },
    'ADAUSDT': { min: 0.25, max: 0.45, decimals: 4 },
    'XRPUSDT': { min: 0.45, max: 0.65, decimals: 4 },
    'DOGEUSDT': { min: 0.07, max: 0.12, decimals: 5 },
    'DOTUSDT': { min: 5, max: 8, decimals: 3 },
    'SOLUSDT': { min: 80, max: 120, decimals: 2 },
    'UNIUSDT': { min: 4, max: 7, decimals: 3 },
    'LINKUSDT': { min: 10, max: 15, decimals: 3 },
    'MATICUSDT': { min: 0.5, max: 0.8, decimals: 4 },
    'AVAXUSDT': { min: 25, max: 40, decimals: 2 },
    'SHIBUSDT': { min: 0.00001, max: 0.00002, decimals: 8 },
    'ATOMUSDT': { min: 8, max: 14, decimals: 3 },
    'LTCUSDT': { min: 60, max: 90, decimals: 2 }
  };
  
  // Default price range if symbol not found
  const defaultPriceRange = { min: 10, max: 1000, decimals: 2 };
  const priceRange = priceRanges[symbol] || defaultPriceRange;
  
  // Generate between 8-20 trades for each symbol
  const numTrades = Math.floor(Math.random() * 12) + 8;
  
  // Generate trades over the last 90 days
  const now = Date.now();
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
  
  // Generate alternating buy/sell trades to create pairs
  const trades = [];
  let lastPrice = randomPrice(priceRange.min, priceRange.max, priceRange.decimals);
  
  for (let i = 0; i < numTrades; i++) {
    // Create timestamp between 90 days ago and now
    const tradeTime = Math.floor(Math.random() * (now - ninetyDaysAgo)) + ninetyDaysAgo;
    
    // Alternate between buy and sell
    const isBuyer = i % 2 === 0;
    
    // For sells, price tends to be different from previous buy
    if (!isBuyer) {
      // 70% chance of profit, 30% chance of loss
      const isProfitable = Math.random() < 0.7;
      const change = lastPrice * (isProfitable ? 
        (Math.random() * 0.15 + 0.02) :  // 2-17% gain
        -(Math.random() * 0.1 + 0.01));  // 1-11% loss
      lastPrice = roundToDecimals(lastPrice + change, priceRange.decimals);
    } else {
      // For buys, generate a new random price within range
      lastPrice = randomPrice(priceRange.min, priceRange.max, priceRange.decimals);
    }
    
    // Generate random quantity (smaller for higher priced assets)
    const baseQty = 1000 / lastPrice; // Roughly $1000 worth
    const qtyVariation = baseQty * (Math.random() * 0.8 + 0.6); // 60-140% of base
    const qty = roundToDecimals(qtyVariation, 8);
    
    // Calculate quote quantity (price * qty)
    const quoteQty = roundToDecimals(lastPrice * qty, 8);
    
    // Generate a trade object that matches Binance API response format
    trades.push({
      symbol: symbol,
      id: 100000000 + i + Math.floor(Math.random() * 10000),
      orderId: 200000000 + i + Math.floor(Math.random() * 10000),
      orderListId: -1,
      price: lastPrice.toString(),
      qty: qty.toString(),
      quoteQty: quoteQty.toString(),
      commission: roundToDecimals(quoteQty * 0.001, 8).toString(), // 0.1% commission
      commissionAsset: symbol.endsWith('USDT') ? 'USDT' : symbol.substring(symbol.length - 4),
      time: tradeTime,
      isBuyer: isBuyer,
      isMaker: Math.random() > 0.5, // 50% chance of being maker
      isBestMatch: true
    });
  }
  
  // Sort by time
  trades.sort((a, b) => a.time - b.time);
  
  return trades;
}

// Helper functions for mock data generation
function randomPrice(min: number, max: number, decimals: number): number {
  return roundToDecimals(Math.random() * (max - min) + min, decimals);
}

function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
} 