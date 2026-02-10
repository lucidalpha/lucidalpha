
import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

from screener import screen_index
from analysis import fetch_ticker_data, analyze_seasonality

# Helper to verify filtering manually
def check_single_case():
    print("--- Single Case Check (AMZN) ---")
    ticker = "AMZN"
    df = fetch_ticker_data(ticker)
    
    # Analyze with 90% win rate
    patterns = analyze_seasonality(df, lookback_years=10, min_win_rate=90)
    print(f"AMZN Patterns >= 90%: {len(patterns)}")
    for p in patterns:
        print(f"  - Win: {p['win_rate']}%, Duration: {p['duration']}d, Start: {p['start_str']}")
        
    # Analyze with 60% win rate
    patterns_low = analyze_seasonality(df, lookback_years=10, min_win_rate=60)
    print(f"AMZN Patterns >= 60%: {len(patterns_low)}")
    
    # Check if 60% patterns are excluded in 90% run
    low_wins = [p for p in patterns_low if p['win_rate'] < 90]
    print(f"AMZN Patterns < 90% (should be hidden): {len(low_wins)}")

def check_screener_run():
    print("\n--- Screener Run (Dow Jones, 90%) ---")
    # Using small subset of Dow for speed if possible, but screen_index runs all.
    # We rely on indices/dow.json being present or fetched.
    
    result = screen_index("dow", min_win_rate=90, min_year=2014) # 10y lookback roughly
    if isinstance(result, dict):
        patterns = result.get("results", [])
    else:
        patterns = result

    print(f"Found {len(patterns)} patterns with >= 90% win rate.")
    
    # Verify no < 90% slipped through
    violations = [p for p in patterns if p['win_rate'] < 90]
    if violations:
        print(f"ERROR: Found {len(violations)} patterns with < 90% win rate!")
        print(violations[0])
    else:
        print("SUCCESS: All patterns respect the >= 90% threshold.")

if __name__ == "__main__":
    check_single_case()
    check_screener_run()
