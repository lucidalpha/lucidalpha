import yfinance as yf
import json

try:
    t = yf.Ticker("AAPL")
    info = t.info
    # Print distinct keys that look relevant
    keys = sorted(info.keys())
    relevant_keys = [k for k in keys if any(x in k.lower() for x in ['price', 'day', 'week', 'volume', 'enterprise', 'shares', 'return', 'margin', 'book', 'ebitda', 'cash', 'revenue', 'income', 'debt', 'equity'])]
    
    print("Relevant Keys found:")
    for k in relevant_keys:
        print(f"{k}: {info[k]}")
        
    # Check specifically for R&D
    print("\nSpecific Check:")
    print("R&D:", info.get("researchAndDevelopment")) # Might be none
    print("Fulltime Employees:", info.get("fullTimeEmployees"))
    
except Exception as e:
    print(f"Error: {e}")
