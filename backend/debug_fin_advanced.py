import yfinance as yf
import pandas as pd

try:
    t = yf.Ticker("AAPL")
    
    print("--- INCOME STMT (cols) ---")
    print(t.income_stmt.columns)
    print("--- INCOME STMT (index) ---")
    print(t.income_stmt.index)
    
    print("\n--- CASHFLOW (index) ---")
    print(t.cashflow.index)
    
    print("\n--- DIVIDENDS ---")
    print(t.dividends.tail(5))
    
    print("\n--- INSIDER ---")
    # Note: might be insider_roster_holders or insider_transactions
    print(t.insider_transactions.head())
    
except Exception as e:
    print(f"Error: {e}")
