
from screener import get_index_constituents
import time

def warmup_cache():
    indices = ['dow', 'dax', 'nasdaq']
    for idx in indices:
        print(f"Warming up cache for {idx}...")
        try:
            tickers = get_index_constituents(idx)
            print(f"  Success: {len(tickers)} items.")
            if tickers:
                print(f"  Sample: {tickers[0]}")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    warmup_cache()
