import { useState, useEffect, ChangeEvent } from 'react';
import { useTrades } from '../.../../context/TradeContext';

export default function ProfileSettings() {
  const [apiKey, setApiKey] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [tradingPairs, setTradingPairs] = useState<string[]>([]);
  const [customPair, setCustomPair] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const { addTrade } = useTrades();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey') || '';
    const storedSecretKey = localStorage.getItem('secretKey') || '';
    const storedPairs = localStorage.getItem('tradingPairs');
    
    setApiKey(storedApiKey);
    setSecretKey(storedSecretKey);
    
    if (storedPairs) {
      try {
        setTradingPairs(JSON.parse(storedPairs));
      } catch (e) {
        console.error('Error parsing stored trading pairs:', e);
        setTradingPairs([]);
      }
    }
  }, []);

  // Handle saving settings to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('secretKey', secretKey);
    localStorage.setItem('tradingPairs', JSON.stringify(tradingPairs));
    
    setSavedStatus('Settings saved successfully!');
    setTimeout(() => setSavedStatus(null), 3000);
  };

  // Handle adding custom trading pair
  const handleAddPair = () => {
    if (customPair && !tradingPairs.includes(customPair)) {
      setTradingPairs([...tradingPairs, customPair.toUpperCase()]);
      setCustomPair('');
    }
  };

  // Handle removing a trading pair
  const handleRemovePair = (pairToRemove: string) => {
    setTradingPairs(tradingPairs.filter(pair => pair !== pairToRemove));
  };

  // Handle importing trades from JSON file
  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const trades = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(trades)) {
          throw new Error('Invalid file format. Expected an array of trades.');
        }
        
        let importCount = 0;
        // Import each trade
        trades.forEach(trade => {
          if (trade.symbol && trade.entryPrice && trade.exitPrice) {
            // Add each trade to the app
            addTrade({
              symbol: trade.symbol,
              type: trade.type || 'crypto',
              direction: trade.direction || 'long',
              entryDate: trade.entryDate,
              exitDate: trade.exitDate,
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice,
              quantity: trade.quantity,
              setupNotes: trade.setupNotes || '',
              mistakesNotes: trade.mistakesNotes || '',
              tags: trade.tags || ['IMPORTED']
            });
            importCount++;
          }
        });
        
        setImportStatus(`Successfully imported ${importCount} trades!`);
        setTimeout(() => setImportStatus(null), 5000);
      } catch (error) {
        console.error('Error importing trades from file:', error);
        setImportStatus(`Error: ${error instanceof Error ? error.message : 'Failed to parse file'}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">API Settings</h2>
      
      <div className="space-y-6">
        {/* API Key Input */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
            Binance API Key
          </label>
          <input
            type="text"
            id="apiKey"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-100"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Binance API key"
          />
          <p className="text-xs text-gray-400 mt-1">
            Your API key will be stored locally only and never sent to our servers.
          </p>
        </div>
        
        {/* Secret Key Input */}
        <div>
          <label htmlFor="secretKey" className="block text-sm font-medium text-gray-300 mb-1">
            Binance Secret Key
          </label>
          <input
            type="password"
            id="secretKey"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-100"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter your Binance Secret key"
          />
          <p className="text-xs text-gray-400 mt-1">
            For security, your secret key never leaves your browser.
          </p>
        </div>
        
        {/* Trading Pairs Section */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Trading Pairs
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {tradingPairs.map(pair => (
              <div key={pair} className="bg-gray-700 rounded-md flex items-center px-2 py-1">
                <span className="text-gray-100 mr-2">{pair}</span>
                <button 
                  onClick={() => handleRemovePair(pair)}
                  className="text-gray-400 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-100"
              value={customPair}
              onChange={(e) => setCustomPair(e.target.value.toUpperCase())}
              placeholder="Add trading pair (e.g., BTCUSDT)"
            />
            <button
              onClick={handleAddPair}
              className="px-4 py-2 bg-blue-700 rounded-md text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
        </div>

        {/* Import JSON File Section */}
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-lg font-medium text-white mb-3">Import Trades from JSON</h3>
          <p className="text-sm text-gray-400 mb-3">
            Import trades from the JSON file generated by the Python script.
          </p>
          
          <label className="block">
            <span className="sr-only">Choose JSON file</span>
            <input 
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-blue-700 file:text-white
                hover:file:bg-blue-600"
            />
          </label>
          
          {importStatus && (
            <div className={`mt-4 p-3 rounded-md ${importStatus.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
              {importStatus}
            </div>
          )}
          
          <div className="mt-4">
            <p className="text-sm text-gray-300 font-medium">How to use the Python script:</p>
            <ol className="text-sm text-gray-400 list-decimal pl-5 mt-2 space-y-1">
              <li>Download the <code className="bg-gray-900 px-1 rounded">fetch_binance_trades.py</code> script</li>
              <li>Install the Binance Python package: <code className="bg-gray-900 px-1 rounded">pip install python-binance</code></li>
              <li>Run: <code className="bg-gray-900 px-1 rounded">python fetch_binance_trades.py YOUR_API_KEY YOUR_SECRET_KEY</code></li>
              <li>Import the generated JSON file using the button above</li>
            </ol>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSaveSettings}
            className="w-full px-4 py-2 bg-primary rounded-md text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Settings
          </button>
          
          {savedStatus && (
            <div className="mt-4 p-3 bg-green-900 text-green-200 rounded-md">
              {savedStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 