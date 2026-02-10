
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def check_futures():
    # Attempt to guess tickers for Gold (GC) Dec 2025, Feb 2026
    # Yahoo often uses: Symbol + MonthCode + TwoDigitYear + .Exchange
    # e.g., GCZ25.CMX (COMEX)
    
    tickers_to_test = [
        "GCZ25.CMX", "GCG26.CMX", # Gold
        "CLZ25.NYM", "CLF26.NYM", # Crude
        "ESZ25.CME", # S&P 500
    ]
    
    print("Testing Yahoo Finance Futures Tickers...")
    
    for t in tickers_to_test:
        try:
            ticker = yf.Ticker(t)
            hist = ticker.history(period="5d")
            if not hist.empty:
                print(f"✅ {t}: Found data. Last Close: {hist['Close'].iloc[-1]}")
            else:
                print(f"❌ {t}: No data found.")
        except Exception as e:
            print(f"❌ {t}: Error {e}")

if __name__ == "__main__":
    check_futures()
