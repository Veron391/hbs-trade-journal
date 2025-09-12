#!/usr/bin/env python3

from binance.client import Client
from datetime import datetime, timedelta
import json
import time
import os
import sys

def fetch_and_format_trades(api_key, api_secret, days=90):
    """
    Fetch trades from Binance API and format them for the trade journal app
    """
    print("Initializing Binance client...")
    client = Client(api_key, api_secret)
    
    # Time range
    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)
    
    # Get all possible symbols from exchange info
    print("Fetching exchange information...")
    exchange_info = client.get_exchange_info()
    all_symbols = [s['symbol'] for s in exchange_info['symbols'] if s['status'] == 'TRADING']
    
    # Container for raw results
    all_trades = []
    
    # Find all pairs the user has traded
    print("Determining which pairs you've traded...")
    
    # First check account balances to identify potential trading pairs
    active_pairs = set()
    try:
        account_info = client.get_account()
        print("Checking account balances...")
        
        # Get assets with non-zero balances
        active_assets = []
        for balance in account_info['balances']:
            if float(balance['free']) > 0 or float(balance['locked']) > 0:
                active_assets.append(balance['asset'])
                print(f"  Found non-zero balance for {balance['asset']}")
        
        # Check all possible pairs for these assets
        for asset in active_assets:
            for symbol in all_symbols:
                if asset in symbol:
                    active_pairs.add(symbol)
    except Exception as e:
        print(f"Warning: Could not fetch account balances: {e}")
    
    # Add common quote assets to ensure we don't miss important pairs
    for base in active_assets:
        for quote in ['USDT', 'BTC', 'ETH', 'BNB', 'BUSD']:
            symbol = f"{base}{quote}"
            if symbol in all_symbols:
                active_pairs.add(symbol)
    
    # Ensure we check at least some common pairs in case account is empty
    common_pairs = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 
        'DOGEUSDT', 'DOTUSDT', 'UNIUSDT', 'LINKUSDT', 'SOLUSDT'
    ]
    
    # Combine all potential trade pairs
    trading_pairs = list(active_pairs)
    for pair in common_pairs:
        if pair in all_symbols and pair not in trading_pairs:
            trading_pairs.append(pair)
    
    print(f"Will check {len(trading_pairs)} pairs for trade history")
    
    # Fetch trades for each pair
    print(f"Fetching trade history for discovered pairs...")
    
    # We'll track which pairs actually have trades
    pairs_with_trades = set()
    
    # Split the time range into 24-hour chunks to comply with Binance API limitations
    current_end = end_time
    current_start = end_time - timedelta(hours=24)
    
    while current_start >= start_time:
        # Convert to milliseconds timestamp for Binance API
        start_ts = int(current_start.timestamp() * 1000)
        end_ts = int(current_end.timestamp() * 1000)
        
        print(f"\nFetching trades for period: {current_start.strftime('%Y-%m-%d %H:%M')} to {current_end.strftime('%Y-%m-%d %H:%M')}")
        
        for symbol in trading_pairs:
            try:
                print(f"  Checking {symbol}...", end="")
                trades = client.get_my_trades(symbol=symbol, startTime=start_ts, endTime=end_ts)
                if trades:
                    print(f" Found {len(trades)} trades")
                    all_trades.extend(trades)
                    pairs_with_trades.add(symbol)
                else:
                    print(" No trades")
                time.sleep(0.1)  # Avoid rate limits
            except Exception as e:
                print(f" Error: {e}")
        
        # Move to the previous 24-hour period
        current_end = current_start
        current_start = current_start - timedelta(hours=24)
        
        # If the new start time is before our overall start_time, adjust it
        if current_start < start_time:
            current_start = start_time
    
    # Process all trades 
    print(f"\nFound {len(all_trades)} total trades across {len(pairs_with_trades)} pairs")
    if pairs_with_trades:
        print("Pairs with trading activity:")
        for pair in sorted(pairs_with_trades):
            print(f"  {pair}")
    
    # Match buy/sell pairs for each symbol
    processed_trades = match_trades(all_trades)
    
    return processed_trades

def match_trades(trades):
    """Match buy/sell trades into entry/exit pairs"""
    if not trades:
        return []
    
    # Group trades by symbol
    trade_map = {}
    for trade in trades:
        symbol = trade['symbol']
        if symbol not in trade_map:
            trade_map[symbol] = []
        trade_map[symbol].append(trade)
    
    # Process each symbol's trades
    processed_trades = []
    for symbol, symbol_trades in trade_map.items():
        # Sort by time
        symbol_trades.sort(key=lambda x: x['time'])
        
        # Split into buys and sells
        buy_trades = [t for t in symbol_trades if t['isBuyer']]
        sell_trades = [t for t in symbol_trades if not t['isBuyer']]
        
        print(f"Processing {symbol}: {len(buy_trades)} buys, {len(sell_trades)} sells")
        
        # Process each buy trade
        for buy in buy_trades:
            # Look for matching sells (ones that came after this buy)
            matching_sells = [s for s in sell_trades if s['time'] > buy['time']]
            
            if matching_sells:
                # Use the first sell after this buy as exit
                sell = matching_sells[0]
                
                # Format entry/exit pair
                buy_time = datetime.fromtimestamp(buy['time'] / 1000)
                sell_time = datetime.fromtimestamp(sell['time'] / 1000)
                
                # Clean up symbol
                display_symbol = symbol
                if symbol.endswith('USDT'):
                    display_symbol = symbol.replace('USDT', '')
                elif symbol.endswith('BTC'):
                    display_symbol = f"{symbol.replace('BTC', '')}/BTC"
                elif symbol.endswith('ETH'):
                    display_symbol = f"{symbol.replace('ETH', '')}/ETH"
                elif symbol.endswith('BUSD'):
                    display_symbol = symbol.replace('BUSD', '')
                
                # Create trade record
                processed_trades.append({
                    'id': f"{buy['id']}-{sell['id']}",
                    'symbol': display_symbol,
                    'type': 'crypto',
                    'direction': 'long',
                    'entryDate': buy_time.strftime('%Y-%m-%d'),
                    'exitDate': sell_time.strftime('%Y-%m-%d'),
                    'entryPrice': float(buy['price']),
                    'exitPrice': float(sell['price']),
                    'quantity': float(buy['qty']),
                    'setupNotes': f"Binance {symbol} trade",
                    'mistakesNotes': "",
                    'tags': ['BINANCE_IMPORT']
                })
                
                # Remove this sell to avoid matching it again
                sell_trades.remove(sell)
        
        # Process remaining sell trades that might be short positions
        for sell in sell_trades[:]:  # Use a copy of the list so we can modify it
            # Look for matching buys that came after (to close short positions)
            matching_buys = [b for b in buy_trades if b['time'] > sell['time']]
            
            if matching_buys:
                buy = matching_buys[0]
                
                # Format entry/exit pair for short position
                sell_time = datetime.fromtimestamp(sell['time'] / 1000)
                buy_time = datetime.fromtimestamp(buy['time'] / 1000)
                
                # Clean up symbol
                display_symbol = symbol
                if symbol.endswith('USDT'):
                    display_symbol = symbol.replace('USDT', '')
                elif symbol.endswith('BTC'):
                    display_symbol = f"{symbol.replace('BTC', '')}/BTC"
                elif symbol.endswith('ETH'):
                    display_symbol = f"{symbol.replace('ETH', '')}/ETH"
                elif symbol.endswith('BUSD'):
                    display_symbol = symbol.replace('BUSD', '')
                
                # Create trade record
                processed_trades.append({
                    'id': f"{sell['id']}-{buy['id']}",
                    'symbol': display_symbol,
                    'type': 'crypto',
                    'direction': 'short',
                    'entryDate': sell_time.strftime('%Y-%m-%d'),
                    'exitDate': buy_time.strftime('%Y-%m-%d'),
                    'entryPrice': float(sell['price']),
                    'exitPrice': float(buy['price']),
                    'quantity': float(sell['qty']),
                    'setupNotes': f"Short {symbol} position",
                    'mistakesNotes': "",
                    'tags': ['BINANCE_IMPORT', 'SHORT']
                })
                
                # Remove this buy to avoid matching it again
                buy_trades.remove(buy)
    
    # Sort by exit date (most recent first)
    processed_trades.sort(key=lambda x: x['exitDate'], reverse=True)
    
    print(f"Created {len(processed_trades)} trade records from raw trade data")
    
    return processed_trades

def main():
    if len(sys.argv) < 3:
        print("Usage: python fetch_binance_trades.py API_KEY API_SECRET [OUTPUT_FILE] [DAYS]")
        sys.exit(1)
    
    api_key = sys.argv[1]
    api_secret = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else "binance_trades.json"
    days = int(sys.argv[4]) if len(sys.argv) > 4 else 90
    
    try:
        print(f"Fetching trade data for the last {days} days...")
        trades = fetch_and_format_trades(api_key, api_secret, days=days)
        
        # Save to JSON file
        with open(output_file, 'w') as f:
            json.dump(trades, f, indent=2)
        
        print(f"\nSuccessfully saved {len(trades)} trades to {output_file}")
        print("\nTo import this data into your Trade Journal:")
        print("1. Go to the Profile section")
        print("2. Scroll down to 'Import Trades from JSON'")
        print("3. Select the generated JSON file")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 