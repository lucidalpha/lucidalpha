
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from analysis import fetch_ticker_data, analyze_seasonality, calculate_seasonal_trend
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

ticker = "GC=F"
print(f"Fetching data for {ticker}...")
try:
    df = fetch_ticker_data(ticker)
    if df is None:
        print("df is None")
    elif df.empty:
        print("df is empty")
    else:
        print(f"df shape: {df.shape}")
        print("Columns:", df.columns.tolist())
        print(df.head())
        
        print("\nAnalyzing Seasonality (10y)...")
        patterns = analyze_seasonality(df, lookback_years=10, min_win_rate=70)
        print(f"Patterns found: {len(patterns)}")
        
        print("\nCalculating Seasonal Trend (10y)...")
        trend = calculate_seasonal_trend(df, lookback_years=10)
        print(f"Trend points: {len(trend)}")
        if len(trend) > 0:
            print("Trend sample:", trend[:5])

except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()
