import { useState, ChangeEvent } from 'react';
import { useTrades } from '../.../../context/TradeContext';

export default function ProfileSettings() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const { addTrade } = useTrades();

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
              mistakesNotes: trade.mistakesNotes || ''
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
      <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
      
      <div className="space-y-6">
        {/* Import JSON File Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Import Trades from JSON</h3>
          <p className="text-sm text-gray-400 mb-3">
            Import trades from a JSON file.
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
        </div>
      </div>
    </div>
  );
} 