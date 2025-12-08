
from cot_service import get_cot_data, fetch_tff_data

print("--- Debugging TFF Fetch ---")
try:
    df = fetch_tff_data()
    print(f"Fetched DF Shape: {df.shape}")
    if not df.empty:
        print("Columns:", df.columns.tolist())
        print("First row:", df.iloc[0].to_dict())
        
        # Check for DX code
        code = "098662"
        subset = df[df['cftc_code'] == code]
        print(f"DX (098662) count: {len(subset)}")
        
        if subset.empty:
            print("DX not found. checking cftc_code unique values (sample):", df['cftc_code'].unique()[:10])
except Exception as e:
    print(f"Error fetching TFF: {e}")
    import traceback
    traceback.print_exc()

print("\n--- Debugging get_cot_data call ---")
try:
    data = get_cot_data("DX=F", "tff")
    print(f"Result count: {len(data)}")
    if data:
        print("Sample:", data[0])
except Exception as e:
    print(f"Error in get_cot_data: {e}")
