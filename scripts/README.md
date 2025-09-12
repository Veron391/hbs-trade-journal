# Trade Journal Data Import Scripts

These scripts help you fetch your real trading data from Binance and import it into the Trade Journal app.

## Why Use These Scripts

The Trade Journal app running in your web browser can't directly access the Binance API due to CORS security restrictions. These Python scripts run on your local machine and can:

1. Connect directly to Binance API
2. Fetch your real trading history
3. Format the data for the Trade Journal
4. Create a file that can be imported into the app

## Prerequisites

- Python 3.6+
- `python-binance` package
- A Binance account with API keys

## Installation

1. Install the required Python package:

```bash
pip install python-binance
```

## Script 1: Fetch Binance Trades

This script fetches your trade history from Binance and converts it into the Trade Journal format.

### Usage

```bash
python fetch_binance_trades.py YOUR_API_KEY YOUR_SECRET_KEY [OUTPUT_FILE]
```

Where:
- `YOUR_API_KEY` is your Binance API key
- `YOUR_SECRET_KEY` is your Binance Secret key
- `OUTPUT_FILE` (optional) is the name of the output JSON file (default: binance_trades.json)

### How It Works

1. Connects to Binance API using your credentials
2. Fetches trades from the last 90 days
3. Checks your common trading pairs and balances
4. Converts individual trades into entry/exit pairs
5. Saves the formatted trades as JSON

## Script 2: Import Data

This script helps you load a JSON file of trades and provides instructions for importing it into the Trade Journal.

### Usage

```bash
python import_data.py [JSON_FILE]
```

Where `JSON_FILE` is the path to the JSON file containing your trade data (optional - you'll be prompted if not provided)

## Complete Workflow

Here's how to use these scripts to get your real trade data into the app:

1. **Create API Keys**
   - Log in to your Binance account
   - Go to API Management
   - Create a new API key with "Read Info" permissions only
   - Save your API Key and Secret Key securely

2. **Fetch Your Trades**
   ```bash
   python fetch_binance_trades.py YOUR_API_KEY YOUR_SECRET_KEY
   ```

3. **Import the Data**
   - Go to the Trade Journal app
   - Navigate to the Profile section
   - Scroll down to "Import Trades from JSON"
   - Select the generated binance_trades.json file

## Security Notes

- These scripts run locally on your machine - your API keys never leave your computer
- Use API keys with "Read Info" permissions only (no trade or withdrawal permissions)
- Never share your Secret Key with anyone

## Troubleshooting

If you encounter issues:

- Verify your API keys are correct and have the necessary permissions
- Check your internet connection
- Make sure the Binance API is accessible from your location
- Confirm Python and the python-binance package are properly installed

For additional help, please contact support or create an issue on our GitHub repository.
