
from cot_service import get_cot_data
import json

def test_backend_tff():
    ticker = "6E=F"
    print(f"Testing TFF fetch for {ticker}...")
    
    data = get_cot_data(ticker, report_type="tff", lookback_weeks=26)
    
    print(f"Result Count: {len(data)}")
    
    dates = [x['date'] for x in data]
    unique_dates = len(set(dates))
    print(f"Unique Dates: {unique_dates}")
    print(f"Duplicates: {len(dates) - unique_dates}")
    
    dealer_idx_vals = [x.get('dealer_index') for x in data]
    valid_dealer = len([v for v in dealer_idx_vals if v is not None])
    print(f"Valid Dealer Index entries: {valid_dealer}/{len(data)}")
    
    if len(data) > 0:
        print("--- Last 10 entries ---")
        for item in data[-10:]:
            print(f"Date: {item['date']} | Dealer Idx: {item.get('dealer_index')}")

if __name__ == "__main__":
    test_backend_tff()
