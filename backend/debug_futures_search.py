
import requests

def search_yahoo(query):
    url = "https://query2.finance.yahoo.com/v1/finance/search"
    params = {
        "q": query,
        "quotesCount": 10,
        "newsCount": 0,
        "enableFuzzyQuery": "false",
        "quotesQueryId": "tss_match_phrase_query"
    }
    headers = {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        r = requests.get(url, params=params, headers=headers, timeout=5) # SSL verify defaults to True
        data = r.json()
        print(f"--- Results for '{query}' ---")
        if 'quotes' in data:
            for q in data['quotes']:
                print(f"Symbol: {q.get('symbol')} | Name: {q.get('shortname')} | Type: {q.get('quoteType')}")
        else:
            print("No quotes found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_yahoo("Corn Dec 25")
    search_yahoo("Euro FX Mar 26")
    search_yahoo("Soybeans Nov 25")
