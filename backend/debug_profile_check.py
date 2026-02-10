import yfinance as yf
from analysis import get_company_profile

def test_profile(ticker):
    print(f"Testing profile for {ticker}...")
    try:
        profile = get_company_profile(ticker)
        if profile:
            print("Success!")
            print("Keys:", profile.keys())
            print("Price:", profile.get("currentPrice"))
        else:
            print("Returned None or empty.")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_profile("AAPL")
    test_profile("ADS.DE") # Adidas
