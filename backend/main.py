from fastapi import FastAPI, UploadFile, File, HTTPException, Form
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

# Basic Config
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


class TickerRequest(BaseModel):
    ticker: str
    valuation_period: Optional[int] = None
    valuation_rescale: Optional[int] = None

def get_valuation_config(ticker):
    if ticker in ["NQ=F", "^GDAXI", "ES=F", "YM=F", "RTY=F"]:
        return {"period": 13, "comparisons": [("ZB=F", "Interest Rates (ZB1!)"), ("DX=F", "Dollar Index")]}
    
    if ticker in ["6C=F", "6A=F", "6E=F", "6B=F", "6S=F", "6N=F", "6J=F"]:
        return {"period": 10, "comparisons": [("DX=F", "Dollar Index")]}
    
    if ticker == "DX=F":
         return {"period": 10, "comparisons": [("6E=F", "Euro Future")]}

    if ticker in ["CL=F", "NG=F"]:
        return {"period": 10, "comparisons": [("DX=F", "Dollar Index"), ("GC=F", "Gold")]}
    
    if ticker in ["GC=F", "SI=F", "PA=F", "PL=F", "HG=F"]:
        comps = []
        if ticker == "GC=F":
            comps.append(("SI=F", "Silver"))
        else:
            comps.append(("GC=F", "Gold"))
        comps.append(("DX=F", "Dollar Index"))
        return {"period": 10, "comparisons": comps}

    return {"period": 10, "comparisons": [("DX=F", "Dollar Index")]}

@app.post("/analyze_ticker")
def analyze_ticker_endpoint(request: TickerRequest):
    try:
        from analysis import analyze_seasonality, fetch_ticker_data, calculate_valuation
        from datetime import datetime
        import pandas as pd
        
        df = fetch_ticker_data(request.ticker)
        
        chart_data = []
        try:
             # Ensure valid datetime column
             if 'Date' not in df.columns and not df.empty:
                 # Should have been handled in fetch_ticker_data but extra safety
                 pass
             
             if not pd.api.types.is_datetime64_any_dtype(df['Date']):
                 df['Date'] = pd.to_datetime(df['Date'])
             
             # Filter data - ALLOW FULL HISTORY
             # df_chart = df[df['Date'] >= '2020-01-01'].copy()
             df_chart = df.copy()
             df_chart = df_chart.sort_values('Date')
             
             for _, row in df_chart.iterrows():
                 val = row['Close']
                 # scalar check
                 if isinstance(val, pd.Series):
                     val = val.iloc[0]
                 
                 chart_data.append({
                     "date": row['Date'].strftime('%Y-%m-%d'),
                     "close": round(float(val), 5)
                 })
                 
        except Exception as e:
            print(f"Chart Data Error: {e}")

        results = analyze_seasonality(df)

        config = get_valuation_config(request.ticker)
        valuation_data = {} 
        valuation_columns = []
        
        # Override period if provided
        period_to_use = request.valuation_period if request.valuation_period is not None else config["period"]
        rescale_to_use = request.valuation_rescale if request.valuation_rescale is not None else 100
        
        for idx, (comp_ticker, label) in enumerate(config["comparisons"]):
            key = f"val_{idx}"
            valuation_columns.append({"key": key, "label": label})
            
            data = calculate_valuation(request.ticker, comp_ticker, period=period_to_use, rescale_period=rescale_to_use)
            
            for entry in data:
                d = entry['date']
                val = entry['value']
                
                if d not in valuation_data:
                    valuation_data[d] = {"date": d}
                
                valuation_data[d][key] = val
        
        valuation_list = list(valuation_data.values())
        valuation_list.sort(key=lambda x: datetime.strptime(x['date'], '%d.%m.%Y'), reverse=True)

        return {
            "ticker": request.ticker,
            "status": "success",
            "results": results,
            "valuation": valuation_list,
            "valuation_columns": valuation_columns,
            "chart_data": chart_data
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

@app.get("/analyze_all_assets")
def analyze_all_assets_endpoint():
    import time
    import yfinance as yf
    from analysis import analyze_seasonality, fetch_ticker_data
    import pandas as pd
    import json
    import os
    
    current_time = time.time()
    
    # 1. Check File Cache
    if os.path.exists(ANALYSIS_CACHE_FILE):
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
    
    print(f"Starting parallel analysis for {len(tickers)} assets...")

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
                
            patterns = analyze_seasonality(df)
            
            for p in patterns:
                p['asset_name'] = name
                p['ticker'] = ticker
            
            return patterns
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

# Force reload triggers


# ... (existing code)

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
            search_end_date=request.search_end_date
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
