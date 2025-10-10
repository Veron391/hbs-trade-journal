import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock trades data for search
const MOCK_TRADES = [
  { id: 1, symbol: 'AAPL', direction: 'long', pnl: 1500, assetClass: 'stock' },
  { id: 2, symbol: 'TSLA', direction: 'short', pnl: -800, assetClass: 'stock' },
  { id: 3, symbol: 'BTC', direction: 'long', pnl: 2500, assetClass: 'crypto' },
  { id: 4, symbol: 'ETH', direction: 'long', pnl: 1200, assetClass: 'crypto' },
  { id: 5, symbol: 'GOOGL', direction: 'long', pnl: 800, assetClass: 'stock' },
  { id: 6, symbol: 'MSFT', direction: 'short', pnl: -600, assetClass: 'stock' },
  { id: 7, symbol: 'SOL', direction: 'long', pnl: 1800, assetClass: 'crypto' },
  { id: 8, symbol: 'BNB', direction: 'short', pnl: -400, assetClass: 'crypto' },
];

// Mock users data for search
const MOCK_USERS = [
  { id: 1, name: 'Alex Smith', email: 'alex.smith@gmail.com', group: 'Alpha' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@yahoo.com', group: 'Beta' },
  { id: 3, name: 'Mike Williams', email: 'mike.williams@outlook.com', group: 'Delta' },
  { id: 4, name: 'Emma Brown', email: 'emma.brown@gmail.com', group: 'Alpha' },
  { id: 5, name: 'David Jones', email: 'david.jones@yahoo.com', group: 'Beta' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    if (!query.trim()) {
      return NextResponse.json({ users: [], trades: [] });
    }

    const searchTerm = query.toLowerCase();
    let users: any[] = [];
    let trades: any[] = [];

    // Search users
    if (type === 'all' || type === 'users') {
      users = MOCK_USERS.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.group?.toLowerCase().includes(searchTerm)
      ).slice(0, 10); // Limit to 10 results
    }

    // Search trades
    if (type === 'all' || type === 'trades') {
      trades = MOCK_TRADES.filter(trade => 
        trade.symbol.toLowerCase().includes(searchTerm) ||
        trade.assetClass.toLowerCase().includes(searchTerm) ||
        trade.direction.toLowerCase().includes(searchTerm)
      ).slice(0, 10); // Limit to 10 results
    }

    return NextResponse.json({ users, trades });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ users: [], trades: [] }, { status: 500 });
  }
}
