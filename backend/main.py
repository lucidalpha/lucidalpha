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

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    benchmarks: str = Form(None)
):
    try:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        # Run analysis (Skipped per user request for Valuation upload)
        # from analysis import analyze_seasonality, calculate_valuation_from_df, prepare_data
        # results = analyze_seasonality(file_location)
        from analysis import calculate_valuation_from_df, prepare_data, load_valuation_df
        results = []
        
        # Valuation
        valuation_list = []
        valuation_columns = []
        
        # Valuation Logic
        import pandas as pd
        from datetime import datetime
        
        # Always try to read the file for potential "Symbol" columns or for benchmarks prep
        try:
            df_val = load_valuation_df(file_location)
        except Exception as e:
            print(f"Valuation Data Prep Warning: {e}")
            df_val = pd.DataFrame()

        valuation_data = {}
        
        # 1. Check for Pre-calculated "Symbol X" columns in the uploaded file
        # The user says they will upload a file formatted with "Symbol" columns for valuation
        symbol_cols = [c for c in df_val.columns if str(c).startswith("Symbol")]
        
        if symbol_cols:
            # Use these columns directly
            for idx, col in enumerate(symbol_cols):
                 key = f"val_{idx}"
                 # Use the column name as is, or "Symbol X"
                 valuation_columns.append({"key": key, "label": col})
                 
                # Fill data
                 for _, row in df_val.iterrows():
                     if pd.notna(row[col]):
                         # Use 'Date' column, not index
                         date_val = row.get('Date')
                         if pd.notna(date_val) and hasattr(date_val, 'strftime'):
                             try:
                                 d_str = date_val.strftime('%d.%m.%Y')
                             except ValueError:
                                 continue
                             
                             if d_str not in valuation_data:
                                 valuation_data[d_str] = {"date": d_str}
                             
                             # Convert to float/round
                             try:
                                 val = float(row[col])
                                 valuation_data[d_str][key] = round(val, 2)
                             except:
                                 pass
        
        # 2. If no Symbol columns found, fall back to "Benchmarks" logic (if selected)
        elif benchmarks and not df_val.empty:
            ticker_map = {
                "dollar": ("DX=F", "Dollar Index"),
                "euro": ("6E=F", "Euro Future"),
                "zb": ("ZB=F", "Interest Rates (ZB1!)"),
                "gold": ("GC=F", "Gold")
            }
            
            selected = benchmarks.split(',')
            for idx, sel in enumerate(selected):
                sel = sel.strip().lower()
                if sel in ticker_map:
                    comp_ticker, label = ticker_map[sel]
                    key = f"val_{idx}"
                    valuation_columns.append({"key": key, "label": label})
                    
                    period = 13 if comp_ticker == "ZB=F" else 10
                    data = calculate_valuation_from_df(df_val, comp_ticker, period=period)
                    
                    for entry in data:
                        d = entry['date']
                        val = entry['value']
                        if d not in valuation_data:
                            valuation_data[d] = {"date": d}
                        valuation_data[d][key] = val
                        
        valuation_list = list(valuation_data.values())
        if valuation_list:
            valuation_list.sort(key=lambda x: datetime.strptime(x['date'], '%d.%m.%Y'), reverse=False)

        # Generate Report ID and Timestamp
        timestamp = int(time.time())
        report_id = f"{file.filename}_{timestamp}"
        report_path = f"{REPORTS_DIR}/{report_id}.json"

        report_data = {
            "id": report_id,
            "filename": file.filename,
            "timestamp": timestamp,
            "results": results,
            "valuation": valuation_list,
            "valuation_columns": valuation_columns
        }
        
        with open(report_path, "w") as f:
            json.dump(report_data, f)
        
        # Stats Logic
        from statistics_calc import calculate_statistics
        from datetime import datetime
        
        # We need date objects for proper sorting in stats calc
        # valuation_list currently has 'date' as string "dd.mm.yyyy"
        # Let's augment it temp
        for item in valuation_list:
            item['date_obj'] = datetime.strptime(item['date'], '%d.%m.%Y')
        
        stats = calculate_statistics(valuation_list, valuation_columns)
        
        # Cleanup temp objects before sending to JSON
        for item in valuation_list:
            del item['date_obj']

        return {
            "filename": file.filename,
            "status": "success",
            "message": "Analyse erfolgreich abgeschlossen.",
            "results": results,
            "valuation": valuation_list,
            "valuation_columns": valuation_columns,
            "statistics": stats,
            "report_id": report_id
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports")
def list_reports():
    reports = []
    files = glob.glob(f"{REPORTS_DIR}/*.json")
    for f in files:
        try:
            with open(f, "r") as file_obj:
                data = json.load(file_obj)
                reports.append({
                    "id": data.get("id"),
                    "filename": data.get("filename"),
                    "timestamp": data.get("timestamp"),
                    "result_count": len(data.get("results", []))
                })
        except:
            continue
    reports.sort(key=lambda x: x["timestamp"], reverse=True)
    return reports

@app.get("/reports/{report_id}")
def get_report(report_id: str):
    file_path = f"{REPORTS_DIR}/{report_id}.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found")
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Cache Global
ANALYSIS_CACHE_FILE = "seasonality_cache.json"
CACHE_DURATION = 2592000  # 30 days


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

        return {
            "results": patterns,
            "seasonal_trend": seasonal_trend,
            "chart_data": chart_data
        }
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

@app.get("/analyze_all_assets")
def analyze_all_assets_endpoint(
    lookback_years: Optional[int] = 15,
    min_win_rate: Optional[int] = 70,
    search_start_date: Optional[str] = None,
    search_end_date: Optional[str] = None,
    filter_odd_years: Optional[bool] = False,
    exclude_2020: Optional[bool] = False,
    filter_election: Optional[bool] = False,
    filter_midterm: Optional[bool] = False,
    filter_pre_election: Optional[bool] = False,
    filter_post_election: Optional[bool] = False
):
    import time
    import yfinance as yf
    from analysis import analyze_seasonality, fetch_ticker_data
    import pandas as pd
    import json
    import os
    
    current_time = time.time()
    
    # Check if we are using default params (for cache usage)
    # Cache assumes lookback=15, win=70, no filters, no custom dates
    # If ANY param deviates, bypass cache
    is_default_params = (
        lookback_years == 15 and 
        min_win_rate == 70 and 
        not search_start_date and 
        not search_end_date and
        not any([filter_odd_years, exclude_2020, filter_election, filter_midterm, filter_pre_election, filter_post_election])
    )

    # 1. Check File Cache (Only if ALL params are default)
    if is_default_params and os.path.exists(ANALYSIS_CACHE_FILE):
        try:
            with open(ANALYSIS_CACHE_FILE, "r") as f:
                cached = json.load(f)
                if current_time - cached.get("timestamp", 0) < CACHE_DURATION:
                    print("Returning cached analysis data (from disk).")
                    return cached.get("data", [])
        except Exception as e:
            print(f"Cache read error: {e}")
    
    all_patterns = []
    tickers = [a["ticker"] for a in ALL_ASSETS]
    
    print(f"Starting analysis for {len(tickers)} assets... Params: Lookback={lookback_years}, Win={min_win_rate}, Dates={search_start_date}-{search_end_date}")

    def process_asset(asset_info):
        ticker = asset_info['ticker']
        name = asset_info['name']
        try:
            # Use our robust fetch_ticker_data
            df = fetch_ticker_data(ticker)
            
            if df is None or df.empty:
                return []
                
            if 'Date' not in df.columns:
                df = df.reset_index()
                
            pats = analyze_seasonality(
                df, 
                lookback_years=lookback_years, 
                min_win_rate=min_win_rate,
                search_start_date=search_start_date,
                search_end_date=search_end_date,
                filter_odd_years=filter_odd_years,
                exclude_2020=exclude_2020,
                filter_election=filter_election,
                filter_midterm=filter_midterm,
                filter_pre_election=filter_pre_election,
                filter_post_election=filter_post_election
            )
            
            for p in pats:
                p['asset_name'] = name
                p['ticker'] = ticker
            
            return pats
        except Exception as e:
            print(f"Error analyzing {ticker}: {e}")
            return []

    # Parallel Execution
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_asset = {executor.submit(process_asset, asset): asset for asset in ALL_ASSETS}
        for future in concurrent.futures.as_completed(future_to_asset):
            try:
                patterns = future.result()
                all_patterns.extend(patterns)
            except Exception as e:
                print(f"Thread error: {e}")

    all_patterns.sort(key=lambda x: x['win_rate'], reverse=True)
    
    # Update Cache
    if all_patterns:
        try:
            with open(ANALYSIS_CACHE_FILE, "w") as f:
                json.dump({
                    "data": all_patterns,
                    "timestamp": current_time
                }, f)
            print(f"Analysis success. {len(all_patterns)} patterns found and cached.")
        except Exception as e:
             print(f"Cache write error: {e}")
    
    return all_patterns

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

# --- AUTOMATION / QNEWS ---
@app.on_event("startup")
def startup_event():
    from automation import start_scheduler
    start_scheduler()
    
    # Auto-Run Fallback: Check if daily analysis ran today
    import subprocess
    import threading
    from datetime import datetime
    
    def run_analysis_if_needed():
        json_path = "daily_fx_scores.json"
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        should_run = False
        if not os.path.exists(json_path):
            should_run = True
        else:
            try:
                with open(json_path, "r") as f:
                    data = json.load(f)
                    # Check if ANY entry has today's date
                    if not any(item.get('date') == today_str for item in data):
                        should_run = True
            except:
                should_run = True
                
        if should_run:
            print("🚀 Auto-Startup: Daily Analysis missing for today. Running in background...")
            # Run the script as a separate process to avoid blocking
            try:
                subprocess.Popen(["python", "daily_news_index.py"], cwd=os.path.dirname(__file__))
            except Exception as e:
                print(f"Failed to auto-start analysis: {e}")
        else:
            print("✅ Daily Analysis for today already exists.")

    # Run check in thread to not delay startup
    threading.Thread(target=run_analysis_if_needed).start()


@app.get("/automation/tasks")
def get_tasks_endpoint():
    from automation import load_tasks
    return load_tasks()

@app.post("/automation/run/{task_id}")
def run_task_endpoint(task_id: str, background_tasks: BackgroundTasks):
    from automation import execute_task_now
    # Run in background to not block
    background_tasks.add_task(execute_task_now, task_id)
    return {"status": "started", "message": f"Task {task_id} queued"}

@app.get("/automation/briefings")
def get_briefings_endpoint():
    from automation import get_briefings
    return get_briefings()

class AIRequest(BaseModel):
    query: str
    context: Optional[str] = None


@app.post("/ask_ai")
def ask_ai_endpoint(req: AIRequest):
    from ai_service import ask_perplexity
    return ask_perplexity(req.query, req.context)

@app.get("/automation/fx_scores")
def get_fx_scores():
    file_path = "daily_fx_scores.json"
    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except:
            return []
    return []




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


class CycleAnalysisRequest(BaseModel):
    ticker: str
    period: Optional[str] = "5y"

@app.post("/cycles/analyze")
def analyze_cycles_endpoint(request: CycleAnalysisRequest):
    try:
        from analysis import fetch_ticker_data
        from cycle_analysis import perform_cycle_analysis
        
        df = fetch_ticker_data(request.ticker, period=request.period)
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Ticker data not found")
            
        results = perform_cycle_analysis(df)
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

