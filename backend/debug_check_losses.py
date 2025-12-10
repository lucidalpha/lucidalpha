
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def debug_seasonality():
    # Fetch TSLA data
    print("Fetching TSLA data...")
    df = yf.download("SHOP", period="10y", interval="1d", progress=False, multi_level_index=False)
    df = df.reset_index()
    
    # Ensure Date column
    if 'Date' not in df.columns:
        df = df.reset_index()
        
    df['Date'] = pd.to_datetime(df['Date']).dt.normalize()
    df = df.sort_values('Date').set_index('Date', drop=False)
    trading_dates = df.index
    
    # Define the pattern window roughly based on user context (Sept-Oct)
    # Let's try a specific start date, say Sept 15
    start_month = 9
    start_day = 15
    duration = 20 # days
    
    print(f"\n--- Debugging Patter: Start {start_month}/{start_day} + {duration} days ---")

    years = [2020, 2021, 2022]
    
    for year in years:
        print(f"\nYear {year}:")
        target_start = pd.Timestamp(datetime(year, start_month, start_day))
        target_end = target_start + timedelta(days=duration)
        
        # Entry Logic
        start_idx = trading_dates.searchsorted(target_start, side='left')
        if start_idx >= len(trading_dates):
            print("  Entry: Out of bounds")
            continue
            
        actual_entry = trading_dates[start_idx]
        entry_price = df.loc[actual_entry]['Close']
        
        # Exit Logic (Current Implementation: side='right' -> day AFTER target)
        end_idx = trading_dates.searchsorted(target_end, side='right')
        if end_idx >= len(trading_dates):
             print("  Exit: Out of bounds")
             continue
             
        actual_exit = trading_dates[end_idx]
        exit_price = df.loc[actual_exit]['Close']
        
        # Alternative Logic (side='left' -> ON or AFTER target)
        end_idx_alt = trading_dates.searchsorted(target_end, side='left')
        actual_exit_alt = trading_dates[end_idx_alt]
        exit_price_alt = df.loc[actual_exit_alt]['Close']
        
        diff = (exit_price - entry_price) / entry_price * 100
        diff_alt = (exit_price_alt - entry_price) / entry_price * 100
        
        print(f"  Target Start: {target_start.strftime('%Y-%m-%d')}")
        print(f"  Actual Entry: {actual_entry.strftime('%Y-%m-%d')} @ {entry_price:.2f}")
        print(f"  Target End  : {target_end.strftime('%Y-%m-%d')}")
        print(f"  Actual Exit (Current/Right): {actual_exit.strftime('%Y-%m-%d')} @ {exit_price:.2f} | PnL: {diff:.2f}%")
        print(f"  Actual Exit (Alt/Left)     : {actual_exit_alt.strftime('%Y-%m-%d')} @ {exit_price_alt:.2f} | PnL: {diff_alt:.2f}%")
        
        win_status = "WIN" if diff > 0 else "LOSS"
        print(f"  Result: {win_status}")

if __name__ == "__main__":
    debug_seasonality()
