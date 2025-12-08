
from cot_service import get_cot_data
import json

ticker = "6E=F"
print(f"Fetching Legacy CoT for {ticker}...")
data = get_cot_data(ticker, report_type="legacy", lookback_weeks=26)

print(f"Data length: {len(data)}")
if data:
    print("First 2 entries:")
    print(json.dumps(data[:2], indent=2))
    print("Last 2 entries:")
    print(json.dumps(data[-2:], indent=2))
    
    # Check for non-null index values
    valid_comm = [d['commercial_index'] for d in data if d['commercial_index'] is not None]
    print(f"Entries with valid commercial_index: {len(valid_comm)}")
    
    if len(valid_comm) > 0:
        print(f"First valid commercial_index: {valid_comm[0]}")
        print(f"Last valid commercial_index: {valid_comm[-1]}")
else:
    print("No data returned.")
