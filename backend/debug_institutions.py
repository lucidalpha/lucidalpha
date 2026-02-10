
import yfinance as yf
import pandas as pd

def check_institutional_data(ticker_symbol):
    print(f"--- Checking Data for {ticker_symbol} ---")
    ticker = yf.Ticker(ticker_symbol)
    
    try:
        # 1. Major Holders
        print("\n[Major Holders]")
        print(ticker.major_holders)
    except Exception as e:
        print(f"Error fetching major_holders: {e}")

    try:
        # 2. Institutional Holders
        print("\n[Institutional Holders]")
        inst_holders = ticker.institutional_holders
        if inst_holders is not None and not inst_holders.empty:
            print(inst_holders.head())
            print("Columns:", inst_holders.columns)
        else:
            print("No institutional holders data found.")
    except Exception as e:
        print(f"Error fetching institutional_holders: {e}")

    try:
        # 3. Insider Transactions (sometimes available)
        print("\n[Insider Transactions]")
        insider = ticker.insider_transactions
        if insider is not None and not insider.empty:
            print(insider.head())
        else:
            print("No insider transactions found.")
    except Exception as e:
        print(f"Error fetching insider_transactions: {e}")

if __name__ == "__main__":
    check_institutional_data("AAPL")
