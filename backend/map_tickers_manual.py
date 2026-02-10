import sqlite3

def update_tickers():
    conn = sqlite3.connect('institutional.db')
    c = conn.cursor()
    
    # Simple mapping for major stocks to make the demo work
    mappings = {
        'AAPL': ['APPLE INC', 'APPLE COMPUTER INC'],
        'NVDA': ['NVIDIA CORP'],
        'MSFT': ['MICROSOFT CORP'],
        'AMZN': ['AMAZON COM INC'],
        'GOOGL': ['ALPHABET INC', 'GOOGLE INC'],
        'TSLA': ['TESLA INC', 'TESLA MOTORS INC'],
        'META': ['META PLATFORMS INC', 'FACEBOOK INC'],
        'AMD': ['ADVANCED MICRO DEVICES'],
        'NFLX': ['NETFLIX INC'],
        'INTC': ['INTEL CORP']
    }
    
    print("Updating tickers...")
    
    for ticker, names in mappings.items():
        for name in names:
            # Update where name contains the pattern
            query = f"UPDATE holdings SET ticker = ? WHERE name LIKE ? AND ticker IS NULL"
            pattern = f"{name}%"
            c.execute(query, (ticker, pattern))
            print(f"Updated {ticker} for pattern '{pattern}': {c.rowcount} rows")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_tickers()
