import yfinance as yf
import json

try:
    t = yf.Ticker("AAPL")
    news = t.news
    if news:
        item = news[0]
        # Just print the flattened structure or specific nested keys
        content = item.get("content", {})
        print("KEYS inside 'content':", content.keys())
        print("Title inside 'content':", content.get("title"))
        print("Pub Date inside 'content':", content.get("pubDate"))
        # Check clickThroughUrl inside content?
        clickThroughUrl = content.get("clickThroughUrl")
        if not clickThroughUrl:
             # Maybe inside canonicalUrl?
             clickThroughUrl = content.get("canonicalUrl")
        print("Link inside 'content':", clickThroughUrl.get("url") if clickThroughUrl else "None")
        
        # Check if provider is available
        provider = content.get("provider")
        print("Provider inside 'content':", provider.get("displayName") if provider else "None")
        
    else:
        print("No news found")
except Exception as e:
    print(f"Error: {e}")
