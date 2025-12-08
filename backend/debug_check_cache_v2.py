
import pandas as pd

try:
    df = pd.read_csv("cftc_tff_v1.csv", dtype={'cftc_code': str}, low_memory=False)
    
    code = "096742"
    subset = df[df['cftc_code'] == code]
    if not subset.empty:
        latest = subset.sort_values('date').iloc[-1]
        print(f"Date: {latest['date']}")
        print(f"Dealer Long (CSV): {latest.get('dealer_long')}")
        print(f"Dealer Short (CSV): {latest.get('dealer_short')}")
        print(f"Asset Long (CSV): {latest.get('asset_long')}")
        print(f"Asset Short (CSV): {latest.get('asset_short')}")
        print(f"Lev Long (CSV): {latest.get('lev_long')}")
        print(f"Lev Short (CSV): {latest.get('lev_short')}")
        
        # User screenshot values (Target)
        print("\nTarget Values (Screenshot):")
        print("D_Long: 100,955 | D_Short: 53,656")
        print("A_Long: 32,398  | A_Short: 113,511")
        print("L_Long: 80,902  | L_Short: 40,509")
        
    else:
        print("BP Code not found.")

except Exception as e:
    print(f"Error: {e}")
