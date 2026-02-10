import yfinance as yf
import pandas as pd

def get_company_financials(ticker):
    print(f"Fetching for {ticker}...")
    try:
        t = yf.Ticker(ticker)
        
        # 1. Financial Trends (Annual)
        trends = []
        try:
            # Income Statement
            inc = t.income_stmt
            print("Income Stmt Shape:", inc.shape)
            # Cash Flow
            cf = t.cashflow
            print("Cash Flow Shape:", cf.shape)
            
            years = inc.columns
            print("Years:", years)
            
            for date in years:
                year_str = date.strftime('%Y')
                
                # Revenue
                rev = 0
                if "Total Revenue" in inc.index:
                    rev = inc.loc["Total Revenue", date]
                elif "Revenue" in inc.index: 
                     rev = inc.loc["Revenue", date]
                     
                # Net Income
                net = 0
                if "Net Income" in inc.index:
                    net = inc.loc["Net Income", date]
                elif "Net Income Common Stockholders" in inc.index:
                    net = inc.loc["Net Income Common Stockholders", date]
                    
                # Free Cash Flow
                fcf = 0
                if "Free Cash Flow" in cf.index:
                    if date in cf.columns:
                        fcf = cf.loc["Free Cash Flow", date]
                
                trends.append({
                    "year": year_str,
                    "revenue": rev,
                    "netIncome": net,
                    "fcf": fcf
                })
        except Exception as e:
            print(f"Trends Error: {e}")

        # 2. Dividends
        dividends = []
        try:
            divs = t.dividends
            if not divs.empty:
                recent = divs.tail(5).iloc[::-1]
                for date, val in recent.items():
                    dividends.append({
                        "date": date.strftime('%Y-%m-%d'),
                        "amount": val
                    })
        except Exception as e:
             print(f"Dividends Error: {e}")

        # 3. Insider
        insiders = []
        try:
            ins = t.insider_transactions
            if ins is not None and not ins.empty:
                recent = ins.head(5)
                for idx, row in recent.iterrows():
                    insiders.append({
                        "insider": row.get("Insider", "N/A"), 
                        "val": row.get("Value", 0)
                    })
        except Exception as e:
             print(f"Insider Error: {e}")

        return {
            "trends": trends,
            "dividends": dividends,
            "insiders": insiders
        }

    except Exception as e:
        print(f"Financials Error for {ticker}: {e}")
        return None

res = get_company_financials("AAPL")
print("Result Keys:", res.keys() if res else "None")
print("Trends Count:", len(res['trends']) if res and 'trends' in res else 0)
