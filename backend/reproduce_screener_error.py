
import sys
import os
import datetime

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from screener import screen_index

def reproduce():
    print("Reproducing screener error...")
    
    # Simulate params from user screenshot
    # Index: Dow Jones
    # Start: 01.09 (Sept 1)
    # End: 31.10 (Oct 31)
    # Lookback: 10 years
    # Min Win Rate: 70
    
    index_name = "dow"
    min_win_rate = 70
    
    # Calculate min_year
    current_year = datetime.datetime.now().year
    lookback = 10
    min_year = current_year - lookback
    
    search_start = "01.09"
    search_end = "31.10"
    
    print(f"Running screen_index for {index_name}, min_year={min_year}, range={search_start}-{search_end}")
    
    try:
        result = screen_index(
            index_name, 
            min_win_rate=min_win_rate,
            min_year=min_year,
            search_start_date=search_start,
            search_end_date=search_end
        )
        
        print("\n--- Result Summary ---")
        if isinstance(result, dict):
            print(f"Tickers Found: {result.get('tickers_found')}")
            print(f"Scanned Count: {result.get('scanned_count')}")
            print(f"Error Count: {result.get('error_count')}")
            print(f"Sample Errors: {result.get('sample_errors')}")
            print(f"Results Count: {len(result.get('results', []))}")
        else:
            print("Result format unexpected.")
            
    except Exception as e:
        print("\n!!! EXCEPTION CAUGHT !!!")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reproduce()
