
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def debug_dis():
    print("Fetching DIS data...")
    df = yf.download("DIS", period="20y", interval="1d", progress=False, multi_level_index=False)
    df = df.reset_index()
    
    # Ensure Date column
    if 'Date' not in df.columns:
        df = df.reset_index()
        
    df['Date'] = pd.to_datetime(df['Date']).dt.normalize()
    df = df.sort_values('Date').set_index('Date', drop=False)
    trading_dates = df.index
    
    # Target Pattern from User Image
    # Start: 14.12 (Dec 14)
    # End: 30.12 (Dec 30)
    start_month = 12
    start_day = 14
    # duration is roughly 16 days
    
    print(f"\n--- Debugging DIS Pattern: Start {start_month}/{start_day} ---")

    years_to_check = [2015, 2024]
    
    for year in years_to_check:
        print(f"\nYear {year}:")
        target_start = pd.Timestamp(datetime(year, start_month, start_day))
        # End date calculation logic from backend:
        # target_end_dummy = start_date_dummy + timedelta(days=duration)
        # Here duration is 16 days
        target_end = target_start + timedelta(days=16) 
        
        # Entry Logic
        start_idx = trading_dates.searchsorted(target_start, side='left')
        if start_idx >= len(trading_dates):
            print("  Entry: Out of bounds")
            continue
            
        actual_entry = trading_dates[start_idx]
        entry_price = df.loc[actual_entry]['Close']
        
        # Backend uses side='right' usually
        end_idx = trading_dates.searchsorted(target_end, side='right')
        if end_idx >= len(trading_dates):
             print("  Exit: Out of bounds")
             continue
             
        actual_exit = trading_dates[end_idx]
        exit_price = df.loc[actual_exit]['Close']
        
        diff = (exit_price - entry_price) / entry_price * 100
        
        print(f"  Target Start: {target_start.strftime('%Y-%m-%d')}")
        print(f"  Actual Entry: {actual_entry.strftime('%Y-%m-%d')} @ {entry_price:.2f}")
        print(f"  Target End  : {target_end.strftime('%Y-%m-%d')}")
        print(f"  Actual Exit : {actual_exit.strftime('%Y-%m-%d')} @ {exit_price:.2f} | PnL: {diff:.2f}%")
        
        # Check gap
        gap = (actual_entry - target_start).days
        print(f"  Entry Gap: {gap} days")

if __name__ == "__main__":
    debug_dis()
