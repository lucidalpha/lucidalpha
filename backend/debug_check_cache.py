
import pandas as pd

try:
    df = pd.read_csv("cftc_tff_v1.csv", dtype={'cftc_code': str}, low_memory=False)
    print("Columns:", df.columns.tolist())
    
    # Filter for BP
    code = "096742"
    subset = df[df['cftc_code'] == code]
    if not subset.empty:
        # Get latest date
        latest = subset.sort_values('date').iloc[-1]
        print("\n=== LATEST BP DATA ===")
        print(latest)
        
        # Check against user values
        # Dealer Long: 100,955
        vals = latest.values.tolist()
        if 100955 in vals or '100955' in str(vals):
            print("MATCH FOUND for 100955!")
        else:
            print("100955 NOT FOUND in latest row.")
            
            # Print recent rows just in case
            print("\nLast 3 rows:")
            print(subset.tail(3)[['date', 'dealer_long', 'dealer_short', 'asset_long']])
            
    else:
        print("BP Code not found in CSV.")

except Exception as e:
    print(f"Error: {e}")
