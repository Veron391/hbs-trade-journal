#!/usr/bin/env python3

import json
import sys
import os
import webbrowser

def main():
    """Load JSON trade data and prepare it for import to the Trade Journal."""
    
    print("Trade Journal Data Importer")
    print("==========================\n")
    
    # Step 1: Get the JSON file path
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
    else:
        print("Please select the JSON file with your trade data:")
        json_file = input("JSON file path: ")
    
    if not os.path.exists(json_file):
        print(f"Error: File '{json_file}' not found")
        return
    
    # Step 2: Load and validate the JSON data
    try:
        with open(json_file, 'r') as f:
            trade_data = json.load(f)
            
        if not isinstance(trade_data, list):
            print("Error: JSON data must be an array of trades")
            return
            
        print(f"Successfully loaded {len(trade_data)} trades from {json_file}")
        
        # Step 3: Prompt to open the Trade Journal
        print("\nTo import this data into your Trade Journal:")
        print("1. Go to the Profile section")
        print("2. Scroll down to 'Import Trades from JSON'")
        print("3. Select this JSON file in the file picker")
        
        open_browser = input("\nWould you like to open the Trade Journal now? (y/n): ")
        if open_browser.lower() in ('y', 'yes'):
            # Open the Trade Journal app - adjust URL as needed
            webbrowser.open("http://localhost:3000/profile")
            print("Browser opened. Go to the Profile section to import your data.")
        
    except json.JSONDecodeError:
        print(f"Error: '{json_file}' is not a valid JSON file")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 