import yfinance as yf

def test_no_threads():
    print("Test: period='20y', threads=False")
    try:
        df = yf.download("TSLA", period="20y", progress=False, threads=False)
        print(f"Shape: {df.shape}")
        if not df.empty:
            print(df.head(2))
        else:
            print("Empty!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_no_threads()
