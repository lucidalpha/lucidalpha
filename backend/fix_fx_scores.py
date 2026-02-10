import json
import os

# Define the target mapping
TARGET_MAPPING = {
    "EUR": "Euro", "EURUSD": "Euro", "EUR/USD": "Euro",
    "JPY": "JPY", "JPYUSD": "JPY", "JPY/USD": "JPY",
    "USD": "Dollar", "DXY": "Dollar", "DOLLAR": "Dollar",
    "CAD": "CAD", "CADUSD": "CAD", "CAD/USD": "CAD",
    "NZD": "NZD", "NZDUSD": "NZD", "NZD/USD": "NZD",
    "AUD": "AUD", "AUDUSD": "AUD", "AUD/USD": "AUD",
    "CHF": "CHF", "CHFUSD": "CHF", "CHF/USD": "CHF",
    "GBP": "GBP", "GBPUSD": "GBP", "GBP/USD": "GBP"
}

# The 8 allowed keys
ALLOWED_KEYS = ["Euro", "JPY", "Dollar", "CAD", "NZD", "AUD", "CHF", "GBP"]

FILE_PATH = "daily_fx_scores.json"

def clean_data():
    if not os.path.exists(FILE_PATH):
        print(f"File {FILE_PATH} not found.")
        return

    with open(FILE_PATH, "r") as f:
        data = json.load(f)

    cleaned_data = []
    seen = set()

    # Sort data by timestamp just in case, though usually we want to process all and dedup
    # Actually, if we have duplicates for same date/currency, we likely want the latest calc?
    # Or just the first one? Let's take the latest if timestamps differ, or just the last seen in list if implied.
    
    # Let's re-process
    # 1. Normalize Names
    # 2. Filter valid only
    # 3. Deduplicate (Date + Currency)

    temp_map = {} # Key: "DATE_CURRENCY" -> item

    count_old = len(data)

    for item in data:
        raw_curr = item.get("currency", "").upper().strip()
        
        # Normalize
        norm_curr = TARGET_MAPPING.get(raw_curr)
        # Fallback partial matching if needed
        if not norm_curr:
            if "EUR" in raw_curr: norm_curr = "Euro"
            elif "JPY" in raw_curr: norm_curr = "JPY"
            elif "DXY" in raw_curr: norm_curr = "Dollar"
            elif "DX" in raw_curr: norm_curr = "Dollar"
            elif "CAD" in raw_curr: norm_curr = "CAD"
            elif "NZD" in raw_curr: norm_curr = "NZD"
            elif "AUD" in raw_curr: norm_curr = "AUD"
            elif "CHF" in raw_curr: norm_curr = "CHF"
            elif "GBP" in raw_curr: norm_curr = "GBP"
        
        if norm_curr and norm_curr in ALLOWED_KEYS:
            # Update item currency
            item["currency"] = norm_curr
            
            # Key for dedup
            key = f"{item['date']}_{norm_curr}"
            
            # Save (overwrite if exists -> keeps latest in list)
            temp_map[key] = item

    # Convert back to list
    final_list = list(temp_map.values())
    
    # Sort by date
    final_list.sort(key=lambda x: x['date'])

    with open(FILE_PATH, "w") as f:
        json.dump(final_list, f, indent=4)
        
    print(f"Cleaned {FILE_PATH}. Rows: {count_old} -> {len(final_list)}")
    print(f"Validation: Found currencies: {list(set([x['currency'] for x in final_list]))}")

if __name__ == "__main__":
    clean_data()
