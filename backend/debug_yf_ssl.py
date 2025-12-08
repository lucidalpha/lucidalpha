import yfinance as yf
import requests
import warnings
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# Suppress only the single warning from urllib3 needed.
warnings.simplefilter('ignore', InsecureRequestWarning)

def test_yf_noverify():
    print("Test: period='20y' with verify=False")
    
    session = requests.Session()
    session.verify = False
    
    try:
        # yf.download might accept session?
        # If not, we might need to use Ticker object
        df = yf.download("TSLA", period="20y", progress=False, session=session)
        print(f"Shape: {df.shape}")
        if not df.empty:
            print(df.head(2))
        else:
            print("Still empty!")
    except TypeError:
        print("yf.download does not accept session arg.")
        # Try Ticker
        try:
             tk = yf.Ticker("TSLA", session=session)
             df = tk.history(period="20y")
             print(f"Ticker History Shape: {df.shape}")
        except Exception as e:
             print(f"Ticker Error: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_yf_noverify()
