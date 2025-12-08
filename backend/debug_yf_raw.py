import yfinance as yf
import pandas as pd

def test_yf():
    print("Test 1: period='20y'")
    try:
        df = yf.download("TSLA", period="20y", progress=False)
        print(f"20y Shape: {df.shape}")
        if df.empty:
            print("20y is empty!")
        else:
            print(df.head(2))
    except Exception as e:
        print(f"20y Error: {e}")

    print("\nTest 2: period='max'")
    try:
        df = yf.download("TSLA", period="max", progress=False)
        print(f"Max Shape: {df.shape}")
        if df.empty:
            print("Max is empty!")
    except Exception as e:
        print(f"Max Error: {e}")

if __name__ == "__main__":
    test_yf()
