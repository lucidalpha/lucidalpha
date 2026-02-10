
import yfinance as yf
import pandas as pd

def check_inst_holders_changes(ticker_symbol):
    print(f"\n--- Checking Institutional Holders for {ticker_symbol} ---")
    stock = yf.Ticker(ticker_symbol)
    
    try:
        # 1. institutional_holders
        ih = stock.institutional_holders
        if ih is not None and not ih.empty:
            print("Institutional Holders Columns:", ih.columns)
            print(ih.head().to_string())
            
            # Check for 'Date Reported' or change columns
            # Yahoo often has: Holder, Shares, Date Reported, % Out, Value
            # Does it have "Change"?
            
        else:
            print("No institutional_holders found.")

        # 2. net_share_purchase_activity (Newer Yahoo features often hidden)
        # Sometimes available via private endpoints or specific properties
        
        # summary_info might have it
        info = stock.info
        print("\n--- Selected Info Keys ---")
        keys_of_interest = ['heldPercentInstitutions', 'heldPercentInsiders', 'sharesShort', 'shortRatio', 'shortPercentOfFloat']
        for k in keys_of_interest:
            print(f"{k}: {info.get(k)}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_inst_holders_changes("AAPL")
