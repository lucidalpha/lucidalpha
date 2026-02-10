from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import glob
import json
import time
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import concurrent.futures
from dotenv import load_dotenv
import os

# Load environment variables from specific path to be safe
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

# Verify loading
if os.environ.get("PERPLEXITY_API_KEY"):
    print("✅ Loaded PERPLEXITY_API_KEY from .env")
else:
    print(f"⚠️ Warning: PERPLEXITY_API_KEY not found. Checked path: {env_path}")

# Basic Config
# Force Reload

UPLOAD_DIR = "uploads"
REPORTS_DIR = "reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Seasonality Analysis API is running"}


# --- REMOVED VALUATION/REPORTS ---


# Cache Global
ANALYSIS_CACHE_FILE = "seasonality_cache.json"
CACHE_DURATION = 2592000  # 30 days
RESULT_CACHE = {}


ALL_ASSETS = [
    {"name": "US Dollar Index Futures", "ticker": "DX=F"},
    {"name": "Canadian Dollar Futures", "ticker": "6C=F"},
    {"name": "Australian Dollar Futures", "ticker": "6A=F"},
    {"name": "Euro FX Futures", "ticker": "6E=F"},
    {"name": "British Pound Futures", "ticker": "6B=F"},
    {"name": "Swiss Franc Futures", "ticker": "6S=F"},
    {"name": "New Zealand Dollar Futures", "ticker": "6N=F"},
    {"name": "Japanese Yen Futures", "ticker": "6J=F"},
    {"name": "Cocoa Futures", "ticker": "CC=F"},
    {"name": "Sojabohnen Futures", "ticker": "ZS=F"},
    {"name": "Sugar No. 11 Futures", "ticker": "SB=F"},
    {"name": "Coffee C Futures", "ticker": "KC=F"},
    {"name": "Weizen Futures", "ticker": "ZW=F"},
    {"name": "Mais Futures", "ticker": "ZC=F"},
    {"name": "Light Crude Oil Futures", "ticker": "CL=F"},
    {"name": "Natural Gas Futures", "ticker": "NG=F"},
    {"name": "Palladium Futures", "ticker": "PA=F"},
    {"name": "Gold Futures", "ticker": "GC=F"},
    {"name": "Silber Futures", "ticker": "SI=F"},
    {"name": "Platin Futures", "ticker": "PL=F"},
    {"name": "Kupfer Futures", "ticker": "HG=F"},
    {"name": "NASDAQ 100 E-Mini Futures", "ticker": "NQ=F"},
    {"name": "DAX Futures", "ticker": "^GDAXI"},
    {"name": "S&P 500 E-Mini Futures", "ticker": "ES=F"},
    {"name": "E-Mini Dow Jones ($5) Futures", "ticker": "YM=F"},
    {"name": "E-Mini Russell 2000 Index Futures", "ticker": "RTY=F"}
]


class TickerRequest(BaseModel):
    ticker: str
    lookback_years: Optional[int] = 15
    min_win_rate: Optional[int] = 70
    filter_mode: Optional[str] = None
    filter_odd_years: Optional[bool] = False
    exclude_2020: Optional[bool] = False
    filter_election: Optional[bool] = False
    filter_midterm: Optional[bool] = False
    filter_pre_election: Optional[bool] = False
    filter_post_election: Optional[bool] = False

class CustomPatternRequest(BaseModel):
    ticker: str
    start_md: str
    end_md: str
    lookback_years: Optional[int] = 15
    filter_mode: Optional[str] = None
    filter_odd_years: Optional[bool] = False
    exclude_2020: Optional[bool] = False
    filter_election: Optional[bool] = False
    filter_midterm: Optional[bool] = False
    filter_pre_election: Optional[bool] = False
    filter_post_election: Optional[bool] = False

@app.post("/analyze_ticker")
def analyze_ticker_endpoint(request: TickerRequest):
    try:
        from analysis import analyze_seasonality, fetch_ticker_data, calculate_seasonal_trend
        import pandas as pd
        

        # Cache Key Generation
        req_key = f"{request.ticker}_{request.lookback_years}_{request.min_win_rate}_{request.filter_mode}_{request.filter_odd_years}_{request.exclude_2020}_{request.filter_election}_{request.filter_midterm}_{request.filter_pre_election}_{request.filter_post_election}"
        
        # Check Cache
        global RESULT_CACHE
        if req_key in RESULT_CACHE:
             print(f"DEBUG: Cache Hit for {req_key}")
             return RESULT_CACHE[req_key]

        df = fetch_ticker_data(request.ticker)
        if df is None or df.empty:
             # Try yfinance fallback inside fetch_ticker_data usually handles it, but if None:
             raise HTTPException(status_code=404, detail="Ticker data not found")

        # 2. Analyze Patterns
        patterns = analyze_seasonality(
            df, 
            lookback_years=request.lookback_years if request.lookback_years else 15,
            min_win_rate=request.min_win_rate if request.min_win_rate else 70,
            filter_mode=request.filter_mode,
            filter_odd_years=request.filter_odd_years,
            exclude_2020=request.exclude_2020,
            filter_election=request.filter_election,
            filter_midterm=request.filter_midterm,
            filter_pre_election=request.filter_pre_election,
            filter_post_election=request.filter_post_election
        )
        
        # 3. Calculate Seasonal Trend
        seasonal_trend = calculate_seasonal_trend(
             df,
             lookback_years=request.lookback_years if request.lookback_years else 15,
             filter_mode=request.filter_mode,
             filter_odd_years=request.filter_odd_years,
             exclude_2020=request.exclude_2020,
             filter_election=request.filter_election,
             filter_midterm=request.filter_midterm,
             filter_pre_election=request.filter_pre_election,
             filter_post_election=request.filter_post_election
        )
        
        # 4. Chart Data (Legacy support for AssetOverview)
        rec = df[['Date', 'Close']].to_dict('records')
        chart_data = []
        for r in rec:
             if pd.notna(r['Close']):
                 chart_data.append({
                     "date": r['Date'].strftime('%Y-%m-%d'),
                     "close": r['Close']
                 })

        result_payload = {
            "results": patterns,
            "seasonal_trend": seasonal_trend,
            "chart_data": chart_data
        }
        
        # Save to Cache
        RESULT_CACHE[req_key] = result_payload
        
        return result_payload
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ticker_seasonality_trend")
def ticker_seasonality_trend_endpoint(request: TickerRequest):
    try:
        from analysis import fetch_ticker_data, calculate_seasonal_trend, get_current_year_data
        
        df = fetch_ticker_data(request.ticker)
        if df is None or df.empty:
             raise HTTPException(status_code=404, detail="Ticker data not found")
             
        seasonal_trend = calculate_seasonal_trend(
             df,
             lookback_years=request.lookback_years if request.lookback_years else 15,
             filter_mode=request.filter_mode,
             filter_odd_years=request.filter_odd_years,
             exclude_2020=request.exclude_2020,
             filter_election=request.filter_election,
             filter_midterm=request.filter_midterm,
             filter_pre_election=request.filter_pre_election,
             filter_post_election=request.filter_post_election
        )
        
        # Current Year Data (for comparison line)
        current_data = get_current_year_data(df)
        
        # Merge current data into seasonal trend structure if simplified?
        # Actually frontend expects `seasonal_trend` as array of {date: "MM-DD", val: 100, current: 95?}
        # `calculate_seasonal_trend` returns [{date, value}, ...].
        # We need to merge `current_data` (list of {date: "MM-DD", value: ...}) into this.
        
        # Convert to dicts for easy merge
        trend_map = {item['date']: item for item in seasonal_trend}
        
        for item in current_data:
            d = item['date'] # "Jan 01"
            if d in trend_map:
                # Merge 'current_value' from item into the trend map item
                if 'current_value' in item:
                     trend_map[d]['current_value'] = item['current_value']
        
        # Re-list
        # Note: seasonal_trend is sorted by MM-DD implicitly by creation logic? 
        # Usually yes. But let's just return key list.
        # But wait, `calculate_seasonal_trend` logic in analysis.py:
        # returns simple list. 
        # Let's trust the frontend handles `seasonal_trend` separate?
        # Frontend SeasonalChart uses `dataKey="value"` (trend) and `dataKey="current"` (current).
        # So we MUST merge them into one list.
        
        final_data = list(trend_map.values())
        # Sort by sort_date (YYYY-MM-DD) to ensure correct calendar order
        final_data.sort(key=lambda x: x['sort_date'])

        return {
            "seasonal_trend": final_data
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate_pattern")
def evaluate_pattern_endpoint(request: CustomPatternRequest):
    try:
        from analysis import fetch_ticker_data, evaluate_custom_pattern
        
        df = fetch_ticker_data(request.ticker)
        if df is None:
             raise HTTPException(status_code=404, detail="Ticker not found")
             
        stats = evaluate_custom_pattern(
            df,
            start_md=request.start_md,
            end_md=request.end_md,
            lookback_years=request.lookback_years,

            filter_mode=request.filter_mode,
            filter_odd_years=request.filter_odd_years,
            exclude_2020=request.exclude_2020,
            filter_election=request.filter_election,
            filter_midterm=request.filter_midterm,
            filter_pre_election=request.filter_pre_election,
            filter_post_election=request.filter_post_election
        )
        
        return {
            "status": "success",
            "stats": stats
        }
    except Exception as e:
        print(f"Eval Pattern Error: {e}")
        return {"status": "error", "message": str(e)}


# --- REMOVED ANALYZE ALL ASSETS ---


@app.get("/cot/{ticker}")
def get_cot_report(ticker: str, report_type: str = "legacy", lookback: int = 26):
    try:
        from cot_service import get_cot_data
        data = get_cot_data(ticker, report_type, lookback_weeks=lookback)
        return {"ticker": ticker, "data": data, "report_type": report_type, "lookback": lookback}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/institutional/funds")
def get_all_funds_endpoint():
    try:
        from institutional_service import get_all_funds_summary
        return get_all_funds_summary()
    except Exception as e:
        return {"error": str(e)}

@app.get("/institutional/fund_holdings/{cik}")
def get_fund_holdings_endpoint(cik: str):
    try:
        from institutional_service import get_fund_holdings
        return get_fund_holdings(cik)
    except Exception as e:
        return {"error": str(e)}

@app.get("/institutional/{ticker}")
def get_institutional_data_endpoint(ticker: str):
    try:
        from analysis import get_institutional_data
        data = get_institutional_data(ticker)
        if not data:
             return {"holders": [], "breakdown": {"insiders":0, "institutions":0, "public":100}}
        return data
    except Exception as e:
        print(f"Inst Data Error: {e}")
        return {"holders": [], "breakdown": {"insiders":0, "institutions":0, "public":100}}

# --- NEW SMART MONEY ENDPOINTS ---
@app.get("/institutional/smart_money_flow/{ticker}")
def get_smart_money_flow_endpoint(ticker: str):
    try:
        from institutional_service import get_smart_money_flow
        return get_smart_money_flow(ticker)
    except Exception as e:
        return {"error": str(e)}

@app.get("/institutional/avg_price/{ticker}")
def get_avg_price_endpoint(ticker: str):
    try:
        from institutional_service import get_avg_entry_price_estimation
        return get_avg_entry_price_estimation(ticker)
    except Exception as e:
        return {"error": str(e)}

@app.get("/institutional/whale_watch/{ticker}")
def get_whale_watch_endpoint(ticker: str):
    try:
        from institutional_service import get_whale_watch_data
        return get_whale_watch_data(ticker)
    except Exception as e:
        return {"error": str(e)}

@app.get("/institutional/global_stats")
def get_global_stats_endpoint():
    try:
        from institutional_service import get_global_whale_stats
        return get_global_whale_stats()
    except Exception as e:
        return {"error": str(e)}

@app.get("/institutional/largest_moves/{ticker}")
def get_largest_moves_endpoint(ticker: str):
    try:
        from institutional_service import get_largest_moves
        return get_largest_moves(ticker)
    except Exception as e:
        return {"error": str(e)}




@app.get("/insider/{ticker}")
def get_insider_trades_endpoint(ticker: str):
    try:
        from analysis import get_insider_trades_sec
        data = get_insider_trades_sec(ticker)
        return {"trades": data}
    except Exception as e:
        print(f"Insider Data Error: {e}")
        return {"trades": []}

@app.get("/company_profile/{ticker}")
def get_company_profile_endpoint(ticker: str):
    try:
        from analysis import get_company_profile
        data = get_company_profile(ticker)
        return data if data else {"error": "No data"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/ticker_news/{ticker}")
def get_ticker_news_endpoint(ticker: str):
    try:
        from analysis import get_ticker_news
        news = get_ticker_news(ticker)
        return news
    except Exception as e:
        return []

@app.get("/company_financials/{ticker}")
def get_company_financials_endpoint(ticker: str):
    try:
        from analysis import get_company_financials
        data = get_company_financials(ticker)
        return data if data else {"error": "No data"}
    except Exception as e:
        return {"error": str(e)}

# Load Stock DB
STOCK_DB = []
try:
    import os
    db_path = os.path.join(os.path.dirname(__file__), "stock_db.json")
    with open(db_path, "r") as f:
        STOCK_DB = json.load(f)
    print(f"SUCCESS: Loaded {len(STOCK_DB)} items from stock_db.json")
except Exception as e:
    print(f"Warning: Could not load stock_db.json from {os.getcwd()}: {e}")

@app.get("/search_ticker")
def search_ticker(q: str):

    import requests
    
    q_lower = q.lower().strip()
    if not q_lower:
        return {"results": []}

    local_results = []
    
    # 1. Search Local DB
    for item in STOCK_DB:
        # Check Ticker
        if q_lower in item['ticker'].lower():
            local_results.append(item)
            continue
            
        # Check Name
        if q_lower in item['name'].lower():
            local_results.append(item)
            continue
            
        # Check Aliases
        if any(q_lower in alias.lower() for alias in item.get('aliases', [])):
             local_results.append(item)
             continue
    
    # If we found local matches, return them immediately for speed
    if local_results:
        # Format to match frontend expectation if needed
        formatted = []
        for item in local_results:
            formatted.append({
                "symbol": item['ticker'],
                "shortname": item['name'],
                "longname": item['name'],
                "exchange": item['exchange'],
                "type": item['type']
            })
        return {"results": formatted, "debug_source": "local", "db_count": len(STOCK_DB)}

    # 2. Fallback to Yahoo if no local match
    try:
        url = "https://query2.finance.yahoo.com/v1/finance/search"
        params = {
            "q": q,
            "lang": "en-US",
            "region": "US",
            "quotesCount": 10,
            "newsCount": 0,
            "enableFuzzyQuery": "false",
            "quotesQueryId": "tss_match_phrase_query"
        }
        headers = {
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        r = requests.get(url, params=params, headers=headers, timeout=5)
        data = r.json()
        
        suggestions = []
        if 'quotes' in data:
            for quote in data['quotes']:
                suggestions.append({
                    "symbol": quote.get("symbol"),
                    "shortname": quote.get("shortname"),
                    "longname": quote.get("longname"),
                    "exchange": quote.get("exchange"),
                    "type": quote.get("quoteType")
                })
        return {"results": suggestions, "debug_source": "yahoo"}
    except Exception as e:
        print(f"Search error: {e}")
        return {"results": []}


# --- REMOVED AUTOMATION / QNEWS / HMM ---


class TickerHistoryRequest(BaseModel):
    ticker: str

@app.post("/ticker_history")
def get_ticker_history(request: TickerHistoryRequest):
    try:
        from analysis import fetch_ticker_data
        df = fetch_ticker_data(request.ticker)
        
        if df is None or df.empty:
             return {"chart_data": []}
             
        # Reset index to get Date column if it's the index
        if 'Date' not in df.columns:
            df = df.reset_index()
        
        # Format for Recharts (date as string, close price)
        chart_data = []
        
        # Use to_dict('records') for speed then process
        # Ensure we only pick what we need to minimize errors
        # check available columns
        cols_to_fetch = ['Date', 'Close']
        extra_cols = ['Open', 'High', 'Low', 'Volume']
        for c in extra_cols:
            if c in df.columns:
                cols_to_fetch.append(c)
             
        records = df[cols_to_fetch].to_dict('records')
        
        for row in records:
            # Handle Timestamp to string
            d_val = row['Date']
            date_str = d_val.isoformat() if hasattr(d_val, 'isoformat') else str(d_val)
            
            # Helper for JSON compliance (NaNs etc)
            import math
            def safe_float(v):
                if isinstance(v, float) and math.isnan(v):
                    return None
                return v

            entry = {
                "date": date_str,
                "close": safe_float(row.get('Close'))
            }
            if 'Open' in row: entry['open'] = safe_float(row['Open'])
            if 'High' in row: entry['high'] = safe_float(row['High'])
            if 'Low' in row: entry['low'] = safe_float(row['Low'])
            if 'Volume' in row: entry['volume'] = safe_float(row['Volume'])
                
            chart_data.append(entry)
            
        return {"chart_data": chart_data}
    except Exception as e:
         print(f"Error fetching history for {request.ticker}: {e}")
         raise HTTPException(status_code=500, detail=str(e))

# Screener Endpoints
from screener import screen_index, INDEX_FETCHERS

@app.get("/screener/indices")
def get_screener_indices():
    return list(INDEX_FETCHERS.keys())


class ScreenerRequest(BaseModel):
    index: str
    min_win_rate: Optional[int] = 70
    lookback_years: Optional[int] = 20
    search_start_date: Optional[str] = None
    search_end_date: Optional[str] = None
    filter_mode: Optional[str] = None
    filter_odd_years: Optional[bool] = False
    exclude_2020: Optional[bool] = False
    filter_election: Optional[bool] = False
    filter_midterm: Optional[bool] = False
    filter_pre_election: Optional[bool] = False
    filter_post_election: Optional[bool] = False

@app.post("/screener/run")
def run_screener(request: ScreenerRequest):
    index_name = request.index.lower()
    if index_name not in INDEX_FETCHERS:
        raise HTTPException(status_code=400, detail="Invalid index provided.")
        

        
    try:
        # Calculate min_year
        import datetime
        current_year = datetime.datetime.now().year
        # If lookback is provided
        lookback = request.lookback_years if request.lookback_years else 20
        min_year = current_year - lookback
        

        result_data = screen_index(
            index_name, 
            min_win_rate=request.min_win_rate,
            min_year=min_year,
            search_start_date=request.search_start_date,
            search_end_date=request.search_end_date,
            filter_mode=request.filter_mode,
            filter_odd_years=request.filter_odd_years,
            exclude_2020=request.exclude_2020,
            filter_election=request.filter_election,
            filter_midterm=request.filter_midterm,
            filter_pre_election=request.filter_pre_election,
            filter_post_election=request.filter_post_election
        )
        
        # Check if result_data is a dict (new format) or list (old format fallback)
        if isinstance(result_data, dict):
            # Pass through the rich metadata
            return {
                "status": "success" if not result_data.get("error") else "error",
                "index": index_name,
                "data": result_data # Nested: results, tickers_found, scanned_count, etc.
            }
        else:
            # Fallback legacy
            return {"status": "success", "index": index_name, "results": result_data, "count": len(result_data)}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ... (existing code)


class CycleRequest(BaseModel):
    ticker: str
    anchor_date: Optional[str] = None
    max_cycles: Optional[int] = 20

@app.post("/cycle_scan")
def cycle_scan_endpoint(request: CycleRequest):
    try:
        from cycle_analysis import perform_cycle_analysis
        from analysis import fetch_ticker_data
        import pandas as pd
        
        # 1. Fetch Data
        df = fetch_ticker_data(request.ticker)
        
        if df is None or df.empty:
             raise HTTPException(status_code=404, detail="Ticker data not found")
             
        # Ensure Date column
        if 'Date' not in df.columns:
            df = df.reset_index()
            
        # 2. Anchor Logic (Slice Data if needed)
        if request.anchor_date:
            try:
                anchor_dt = pd.to_datetime(request.anchor_date)
                # We filter strictly <= anchor
                df_slice = df[pd.to_datetime(df['Date']) <= anchor_dt].copy()
                if len(df_slice) < 50:
                    raise HTTPException(status_code=400, detail="Anchor date results in too little data (<50 bars)")
            except Exception as e:
                print(f"Anchor Date Error: {e}")
                # Fallback to full data if parsing fails? Or error? Error is safer.
                raise HTTPException(status_code=400, detail=f"Invalid anchor date: {str(e)}")
        else:
            df_slice = df
            
        # 3. Perform Analysis
        results = perform_cycle_analysis(df_slice, max_period=None, top_n=request.max_cycles)
        
        if "error" in results:
             raise HTTPException(status_code=400, detail=results["error"])
             
        # Add basic info
        results["ticker"] = request.ticker
        if request.anchor_date:
             results["anchor_date"] = request.anchor_date
             
        # If anchored, we might want to return "Future" (Out-of-Sample) data separately for comparison?
        # The frontend can fetch full history separately via /ticker_history if it wants to overlay "Real Price" vs "Projection".
        # But for convenience, let's attach the "Real Price" for the out-of-sample period if available.
        if request.anchor_date:
             # Get out of sample data
             df_oos = df[pd.to_datetime(df['Date']) > anchor_dt]
             oos_data = []
             for _, row in df_oos.iterrows():
                 oos_data.append({
                     "date": row['Date'].strftime('%Y-%m-%d'),
                     "price": row['Close']
                 })
             results["oos_data"] = oos_data
        
        return results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Calculator Endpoints
class RiskAnalysisRequest(BaseModel):
    start_capital: float
    win_rate: float
    risk_reward: float
    risk_per_trade: float
    num_trades: int
    drawdown_target: float

class MonteCarloRequest(BaseModel):
    start_capital: float
    win_rate: float
    risk_reward: float
    risk_per_trade: float
    num_trades: int
    num_simulations: int

@app.post("/calculators/risk_analysis")
def risk_analysis_endpoint(request: RiskAnalysisRequest):
    try:
        from calculators import run_risk_analysis
        result = run_risk_analysis(
            request.start_capital,
            request.win_rate,
            request.risk_reward,
            request.risk_per_trade,
            request.num_trades,
            request.drawdown_target
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculators/monte_carlo")
def monte_carlo_endpoint(request: MonteCarloRequest):
    try:
        from calculators import run_monte_carlo
        result = run_monte_carlo(
            request.start_capital,
            request.win_rate,
            request.risk_reward,
            request.risk_per_trade,
            request.num_trades,
            request.num_simulations
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# Valid endpoints related to Stocks (Aktien), Calculators, and Term Structure remain below.

# --- REMOVED ENDPOINTS (Valuation, Trading, Cycles, Regimes, QNews) ---


# Term Structure Endpoints
@app.get("/term_structure/assets")
def get_term_structure_assets():
    from futures_config import FUTURES_METADATA
    
    # Get set of valid tickers from Trading List
    # Note: ALL_ASSETS defined globally above
    trading_tickers = set(a['ticker'] for a in ALL_ASSETS)
    
    assets = []
    for k, v in FUTURES_METADATA.items():
        # Only include if in trading list
        if k in trading_tickers:
            assets.append({
                "ticker": k,
                "name": v['name'],
                "root": v['root'],
                "structure": v.get('structure', 'Unbekannt')
            })
    
    # Sort by root to group nicely
    assets.sort(key=lambda x: x['root'])
        
    return assets

class TermStructureRequest(BaseModel):
    ticker: str

@app.post("/term_structure/analyze")
def analyze_term_structure_endpoint(request: TermStructureRequest):
    try:
        from term_structure import get_term_structure
        data = get_term_structure(request.ticker)
        if "error" in data:
             raise HTTPException(status_code=400, detail=data['error'])
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

