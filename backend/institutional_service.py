
import sqlite3
import pandas as pd
from institutional_db import get_db_connection
import json
import os

import functools

STOCK_DB_FILE = "stock_db.json"

def get_cusip_map():
    return {} 

@functools.lru_cache(maxsize=32)
def get_smart_money_flow(ticker_symbol):
    """
    Calculates the 'Smart Money Flow' for a ticker.
    This aggregates the buying/selling of the Top 20 Funds over the last 4 quarters.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    # Needs CUSIP or Name map.
    # Try fuzzy match on name if ticker provided?
    # Or simplified: The user searches by Ticker. We need to find the CUSIP/Name in our DB.
    # Strategy: User searches 'AAPL'. We look for 'APPLE INC' in holdings.
    
    # Use direct ticker match from DB
    sql = """
        SELECT f.report_date, f.cik, func.name as fund_name, h.shares, h.value
        FROM holdings h
        JOIN filings f ON h.accession_number = f.accession_number
        JOIN funds func ON f.cik = func.cik
        WHERE h.ticker = ?
        ORDER BY f.report_date ASC
    """
    
    df = pd.read_sql_query(sql, conn, params=(ticker_symbol,))
    conn.close()
    
    if df.empty:
        return {"error": "No data found for this asset in Top 100 Funds DB", "name_used": full_name}
        
    # Process Flow
    # 1. Pivot to get Shares by Fund over Quarter
    # df columns: report_date, cik, fund_name, shares
    
    # We want Aggregated Change per Quarter
    dates = sorted(df['report_date'].unique())
    
    flow_data = []
    
    # For each quarter, calculate TOTAL shares held by these funds
    # And Net Change
    
    for d in dates:
        subset = df[df['report_date'] == d]
        total_shares = subset['shares'].sum()
        total_value = subset['value'].sum()
        count_funds = subset['cik'].nunique()
        
        flow_data.append({
            "date": d,
            "total_shares": total_shares,
            "total_value": total_value,
            "fund_count": count_funds
        })
        
    # Calculate Changes
    for i in range(1, len(flow_data)):
        curr = flow_data[i]
        prev = flow_data[i-1]
        
        change_shares = curr['total_shares'] - prev['total_shares']
        pct_change = (change_shares / prev['total_shares']) * 100 if prev['total_shares'] > 0 else 100
        
        curr['change_shares'] = change_shares
        curr['pct_change'] = pct_change
        
        # Determine "Sentiment" (Green/Red)
        curr['sentiment'] = 'buy' if change_shares > 0 else 'sell'
        
    return flow_data

def get_avg_entry_price_estimation(ticker_symbol):
    """
    Estimates 'Avg Entry Price' (Weighted Average Price) for the Top Funds.
    Logic: Track quarterly changes. If shares increase, assume buy at avg price of that quarter.
    """
    # 1. Get Holdings History (same logic as above)
    flow_data = get_smart_money_flow(ticker_symbol)
    if isinstance(flow_data, dict) and "error" in flow_data:
         return None # No data
         
    # We need historical PRICE of the STOCK to estimate entry cost.
    # Import analysis fetcher
    from analysis import fetch_ticker_data
    price_df = fetch_ticker_data(ticker_symbol, period="2y") # 2 years enough for 4 quarters usually
    if price_df is None or price_df.empty:
        return None
        
    price_df.set_index('Date', inplace=True)
    
    estimated_cost_basis = 0
    total_shares_accumulated = 0
    
    # Algorithm:
    # Iterate through quarters.
    # For each quarter Q_i:
    #   Get Net Change in Shares (aggregated or per fund? Aggregated is simpler for "Category Avg").
    #   If Net Change > 0 (Buying):
    #       AvgPrice_Q = Mean Close Price of that Quarter (Use report_date - 90 days to report_date)
    #       Cost += NetChange * AvgPrice_Q
    #       TotalShares += NetChange
    #   If Net Change < 0 (Selling):
    #       Reduce TotalShares (FIFO or LIFO? usually reduces weight but doesn't change 'Entry Price' unless we realize gains. 
    #       Standard Avg Cost logic: Selling doesn't change Avg Cost per share.)
    
    import warnings
    warnings.simplefilter(action='ignore', category=FutureWarning) # pandas warnings

    current_avg_cost = 0
    
    for i in range(len(flow_data)):
        q_data = flow_data[i]
        report_date_str = q_data['date']
        
        try:
            report_date = pd.to_datetime(report_date_str)
            # Quarter Start approx 90 days prior
            start_date = report_date - pd.Timedelta(days=90)
            
            # Get Price Avg for this quarter
            mask = (price_df.index >= start_date) & (price_df.index <= report_date)
            q_prices = price_df.loc[mask]
            
            if q_prices.empty:
                avg_price_q = 0 # fallback
            else:
                avg_price_q = (q_prices['Close'].max() + q_prices['Close'].min()) / 2 # Mid range as per article hint? Or Mean? Article says "Avg Purchase Price". Mean is safer.
                # Article implies simple "Avg Price".
            
            change = q_data.get('change_shares', 0)
            
            # Initial position (first data point)? Assume it was bought "Before".
            # If i=0, we have 'total_shares' but 'change_shares' might be undefined or 0.
            # We treat initial bulk as "Bought at Q1 Avg" for simplicity if we lack history, 
            # OR we just track *changes* for the "Flow" metric. 
            # HiddenMetrix says "Average Entry Price of Hedgefunds".
            # Simplification: Treat the current holding as if built over the observed period.
            
            if i == 0:
                shares = q_data['total_shares']
                current_avg_cost = avg_price_q # Initial seed
                total_shares_accumulated = shares
            else:
                if change > 0:
                    # Bought 'change' shares at 'avg_price_q'
                    current_total_value = (current_avg_cost * total_shares_accumulated)
                    new_value = (change * avg_price_q)
                    
                    total_shares_accumulated += change
                    current_avg_cost = (current_total_value + new_value) / total_shares_accumulated
                elif change < 0:
                    # Sold 'change' shares. Avg Cost doesn't change.
                    total_shares_accumulated += change # reduced
                    if total_shares_accumulated < 0: total_shares_accumulated = 0
                    
        except Exception as e:
            print(f"Avg Price Calc Error at {report_date_str}: {e}")
            continue
            
    return {
        "avg_entry_price": round(current_avg_cost, 2),
        "total_shares_tracked": total_shares_accumulated
    }

def get_whale_watch_data(ticker_symbol):
    """
    Returns data for the 'Whale Watch' table/heatmap.
    Rows: Fund Name
    Cols: Quarters
    Cells: Action (Buy/Sell/Hold), Change %
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    sql = """
        SELECT f.report_date, func.name as fund_name, h.shares
        FROM holdings h
        JOIN filings f ON h.accession_number = f.accession_number
        JOIN funds func ON f.cik = func.cik
        WHERE h.ticker = ?
        ORDER BY func.name, f.report_date ASC
    """
    
    df = pd.read_sql_query(sql, conn, params=(ticker_symbol,))
    conn.close()
    
    if df.empty: return []
    
    # Handle duplicates (e.g. multiple filings)
    df.drop_duplicates(subset=['fund_name', 'report_date'], keep='last', inplace=True)
    
    # Pivot
    pivot = df.pivot(index='fund_name', columns='report_date', values='shares')
    
    # Calculate Changes
    # Result structure: List of Funds with history
    results = []
    
    for fund in pivot.index:
        row = pivot.loc[fund]
        history = []
        
        # Iterate cols
        sorted_dates = sorted(pivot.columns)
        prev_shares = 0
        
        for d in sorted_dates:
            shares = row[d]
            if pd.isna(shares): shares = 0
            
            change = shares - prev_shares
            pct = (change / prev_shares * 100) if prev_shares > 0 else (100 if shares > 0 else 0)
            
            action = 'Hold'
            if change > 0: action = 'Buy'
            if change < 0: action = 'Sell'
            if shares == 0 and prev_shares > 0: action = 'Exit'
            if shares > 0 and prev_shares == 0: action = 'New'
            
            history.append({
                "date": d,
                "shares": int(shares),
                "change": int(change),
                "pct_change": round(pct, 1),
                "action": action
            })
            
            prev_shares = shares
            
        results.append({
            "fund": fund,
            "history": history
        })
        
    return results

def get_global_whale_stats():
    """
    Returns global statistics for the landing page.
    1. Top 10 Most Held Stocks by Value (across all tracked Gurus).
    2. Most Recent Filings.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Top 10 Stocks by Value (Sum of Value across all funds)
    # We need to filter for the LATEST report_date for each fund to avoid double counting history.
    
    # Subquery: Get latest accession for each CIK
    sql = """
        WITH LatestFilings AS (
            SELECT cik, MAX(report_date) as max_date
            FROM filings
            GROUP BY cik
        ),
        TargetFilings AS (
            SELECT f.accession_number
            FROM filings f
            JOIN LatestFilings lf ON f.cik = lf.cik AND f.report_date = lf.max_date
        )
        SELECT h.name, h.cusip, SUM(h.value) as total_value, COUNT(DISTINCT f.cik) as fund_count
        FROM holdings h
        JOIN filings f ON h.accession_number = f.accession_number
        WHERE f.accession_number IN (SELECT accession_number FROM TargetFilings)
        GROUP BY h.name, h.cusip
        ORDER BY total_value DESC
        LIMIT 10
    """
    
    try:
        rows = c.execute(sql).fetchall()
        top_holdings = []
        for r in rows:
            top_holdings.append({
                "name": r['name'], # This is uppercase usually
                "cusip": r['cusip'],
                "total_value": r['total_value'], # in 1000s or actual? SEC is usually $1000s. We stored raw.
                "fund_count": r['fund_count']
            })
            
        return {"top_holdings": top_holdings}
        
    except Exception as e:
        print(f"Global Stats Error: {e}")
        return {"top_holdings": []}
    finally:
        conn.close()

def get_largest_moves(ticker_symbol):
    """
    Returns the largest purchases and sales for the ticker based on the most recent filings.
    Sorted by estimated transaction value.
    """
    # 1. Reuse Whale Watch logic to get histories
    funds_data = get_whale_watch_data(ticker_symbol)
    
    if not funds_data:
        return {"purchases": [], "sales": []}
        
    moves = []
    
    # We need price data to calculate values
    # Optimize: Fetch once for the last year
    from analysis import fetch_ticker_data
    # Change period to 2y to ensure we cover older filings if necessary
    price_df = fetch_ticker_data(ticker_symbol, period="2y")
    
    if price_df is not None and not price_df.empty:
        # Ensure proper Date parsing if it hasn't happened yet (though fetch_ticker_data usually does it)
        price_df['Date'] = pd.to_datetime(price_df['Date'])
        if price_df['Date'].dt.tz is not None:
             price_df['Date'] = price_df['Date'].dt.tz_localize(None)

    # Helper to get Avg Price for a quarter
    def get_avg_price(r_date_str):
        if price_df is None or price_df.empty: 
            print(f"DEBUG: Price DF is empty for {ticker_symbol}")
            return 0
        try:
            r_date = pd.to_datetime(r_date_str)
            if r_date.tz is not None: r_date = r_date.tz_localize(None)

            # Quarter is approx r_date - 90 to r_date
            s_date = r_date - pd.Timedelta(days=90)
            
            mask = (price_df['Date'] >= s_date) & (price_df['Date'] <= r_date)
            sub = price_df.loc[mask]
            
            if sub.empty: 
                return 0
                
            return sub['Close'].mean()
        except Exception as e:
            print(f"DEBUG: Error in get_avg_price: {e}")
            return 0
            
    # Cache prices for dates to avoid repeated lookups
    price_cache = {}

    for fund_obj in funds_data:
        if not fund_obj['history']: continue
        
        # Look at the LATEST action
        latest = fund_obj['history'][-1]
        
        # Only care about active moves (Buy/Sell)
        if latest['change'] == 0: continue
        
        r_date = latest['date']
        
        # Get Price
        if r_date not in price_cache:
            price_cache[r_date] = get_avg_price(r_date)
        
        avg_price = price_cache[r_date]
        if avg_price == 0:
            # Fallback if no price data (e.g. very recent or very old?)
            # Use current price? Or skip value. Used 0.
            pass
            
        shares_moved = abs(latest['change'])
        est_value = shares_moved * avg_price
        
        # Return metric: (Current Price - Avg Price) / Avg Price
        # We need Current Price (latest in Df)
        current_price = 0
        if price_df is not None and not price_df.empty:
            current_price = price_df.iloc[-1]['Close']
            
        ret_pct = 0
        if avg_price > 0:
            ret_pct = (current_price - avg_price) / avg_price * 100
            
        move = {
            "investor": fund_obj['fund'],
            "shares_moved": shares_moved, # Bought or Sold amount
            "value_usd": est_value,
            "change_pct": latest['pct_change'], # Position change %
            "avg_price": round(avg_price, 2),
            "total_shares": latest['shares'],
            "return_pct": round(ret_pct, 2),
            "reported": r_date,
            "action": latest['action'] # Buy, Sell, New, Exit
        }
        
        moves.append(move)
        
    # Sort by Value
    moves.sort(key=lambda x: x['value_usd'], reverse=True)
    
    purchases = [m for m in moves if m['action'] in ['Buy', 'New']]
    sales = [m for m in moves if m['action'] in ['Sell', 'Exit']]
    
    return {
        "purchases": purchases[:10], # Top 10
        "sales": sales[:10]
    }

@functools.lru_cache(maxsize=128)
def get_fund_top_buys(cik):
    """
    Identifies the top 3 purchases (new or increased positions) for a fund 
    by comparing the latest filing with the previous one.
    Returns: List of names/tickers.
    """
    conn = get_db_connection()
    
    # Get last 2 dates
    dates_sql = "SELECT DISTINCT report_date FROM filings WHERE cik = ? ORDER BY report_date DESC LIMIT 2"
    dates = pd.read_sql_query(dates_sql, conn, params=(cik,))
    
    if len(dates) < 2:
        conn.close()
        return [] # No history to compare
        
    latest_date = dates.iloc[0]['report_date']
    prev_date = dates.iloc[1]['report_date']
    
    # Get Holdings for both
    # We select name + shares. Linking via name as ticker might be null or simplified.
    # Ideally link via cusip but name is often safer if cusip changes or is missing in simplified ingest.
    sql = """
        SELECT h.name, h.shares, h.value, f.report_date
        FROM holdings h
        JOIN filings f ON h.accession_number = f.accession_number
        WHERE f.cik = ? AND f.report_date IN (?, ?)
    """
    
    df = pd.read_sql_query(sql, conn, params=(cik, latest_date, prev_date))
    conn.close()
    
    if df.empty: return []
    
    # Pivot
    # name | shares_latest | shares_prev
    pivot = df.pivot_table(index='name', columns='report_date', values='shares', fill_value=0)
    
    if latest_date not in pivot.columns or prev_date not in pivot.columns:
        return []
        
    # Calculate Diff
    pivot['diff'] = pivot[latest_date] - pivot[prev_date]
    pivot['pct_change'] = (pivot['diff'] / pivot[prev_date]).replace([float('inf'), -float('inf')], 0)
    
    # Filter Buys (> 0)
    buys = pivot[pivot['diff'] > 0].copy()
    
    # To rank "Top Buys", we need Value.
    # Current value of the *Position* is known? Or calculating value of the *Buy*?
    # We have value in df. Let's map latest value back.
    # Actually, simpler: Sort by Estimated Buy Value?
    # We don't have price easily here without fetching for every stock.
    # Proxy: Sort by % increase? No, small buys on small stocks have huge %.
    # Proxy: Sort by 'diff' (shares added) * (TotalValue / TotalShares) approx?
    # Let's use the 'value' column from the latest report to estimate price/share.
    
    latest_vals = df[df['report_date'] == latest_date].set_index('name')['value']
    latest_shares = df[df['report_date'] == latest_date].set_index('name')['shares']
    
    # Map to buys
    buys['current_value'] = buys.index.map(latest_vals)
    buys['total_shares'] = buys.index.map(latest_shares)
    
    # Approx Price per Share (in thousands usually, value is x1000)
    # 13F Value is x1000 USD. Shares is count.
    # Price ~= (Value * 1000) / Shares
    # Buy Value ~= Diff * Price
    
    def calc_buy_val(row):
        if row['total_shares'] > 0:
            price = (row['current_value'] * 1000) / row['total_shares']
            return row['diff'] * price
        return 0
        
    buys['buy_val'] = buys.apply(calc_buy_val, axis=1)
    
    # Sort descending
    buys = buys.sort_values('buy_val', ascending=False)
    
    top_3 = buys.head(3).index.tolist()
    return top_3


def get_all_funds_summary():
    """
    Returns a list of all funds with their total assets (value) from the latest filing,
    sorted by size (value) descending.
    INCLUDES Top Buys.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    # We want details of the latest filing for each fund
    sql = """
        WITH LatestFilings AS (
            SELECT cik, MAX(report_date) as last_date
            FROM filings
            GROUP BY cik
        )
        SELECT 
            f.cik, 
            f.name, 
            SUM(h.value) as total_value,
            lf.last_date,
            COUNT(h.name) as positions_count
        FROM funds f
        JOIN LatestFilings lf ON f.cik = lf.cik
        JOIN filings fil ON fil.cik = lf.cik AND fil.report_date = lf.last_date
        JOIN holdings h ON h.accession_number = fil.accession_number
        GROUP BY f.cik, f.name, lf.last_date
        ORDER BY total_value DESC
    """
    
    try:
        df = pd.read_sql_query(sql, conn)
        conn.close()
        
        if df.empty:
            return []
            
        # Enrich with Top Buys
        records = df.to_dict(orient='records')
        for r in records:
            try:
                # We can optimize this later if slow
                top_buys = get_fund_top_buys(r['cik'])
                # Format: "NVDA, MSFT"
                # If we have tickers map, use tickers. Currently just Names.
                # Try to map to ticker for display using our simple map?
                # This is "name" from holdings.
                # Simplified map for commonly known
                mapped = []
                for n in top_buys:
                     # Heuristic: First 2 words or map
                     # We can utilize the TICKER column in holdings if we filled it?
                     # Ingest fills it partially.
                     # Let's Just use Name for now.
                     mapped.append(n)
                     
                r['top_buys'] = mapped
            except Exception as e:
                print(f"Top Buys Error {r['cik']}: {e}")
                r['top_buys'] = []

        return records
        
    except Exception as e:
        print(f"Error fetching funds summary: {e}")
        conn.close()
        return []

def get_fund_holdings(cik):
    """
    Returns the holdings of a specific fund for its latest filing.
    """
    conn = get_db_connection()
    
    sql = """
        SELECT 
            h.name, 
            h.ticker, 
            h.value, 
            h.shares, 
            f.report_date
        FROM holdings h
        JOIN filings f ON h.accession_number = f.accession_number
        WHERE f.cik = ? 
        AND f.report_date = (SELECT MAX(report_date) FROM filings WHERE cik = ?)
        ORDER BY h.value DESC
    """
    
    try:
        df = pd.read_sql_query(sql, conn, params=(cik, cik))
        conn.close()
        return df.to_dict(orient='records')
    except Exception as e:
        print(f"Error fetching fund holdings for {cik}: {e}")
        conn.close()
        return []
