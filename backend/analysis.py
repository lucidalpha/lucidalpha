import pandas as pd
from datetime import datetime, timedelta
import yfinance as yf
import functools

import requests


# @functools.lru_cache(maxsize=32)
def fetch_ticker_data(ticker, period="max"):
    print(f"DEBUG: Fetching ticker data for {ticker} (Cache disabled)...")
    """
    Fetches historical data using yfinance library for better reliability.
    """
    try:
        # Use yfinance download
        # period="max" or specific period like "5y"
        # Use auto_adjust=False to get raw Close (matching standard charts)
        df = yf.download(ticker, period=period, interval="1d", auto_adjust=False, progress=False, multi_level_index=False)

        
        if df.empty:
            return None
            
        # Reset index to make Date a column
        df = df.reset_index()
        
        # Ensure columns are correct (yfinance sometimes capitalized or not)
        # We need: Date, Open, High, Low, Close, Volume
        required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        
        # Simple column mapping if needed, but yfinance usually standardizes on Title Case
        if 'Adj Close' in df.columns:
             # Some logic prefers Adj Close? The previous code used Close or guessed. 
             # Let's verify existing logic used 'Close'.
             pass
             
        # Filter for required columns
        available_cols = [c for c in required_cols if c in df.columns]
        if 'Date' not in available_cols:
            return None
            
        final_df = df[available_cols].copy()
        
        # Ensure Date is datetime
        final_df['Date'] = pd.to_datetime(final_df['Date'])
        
        return final_df

    except Exception as e:
        print(f"Error fetching {ticker} with yfinance: {e}")
        return None

        

def calculate_valuation_from_df(df1, comp_ticker, period=10, rescale_period=100):
        # Fetch comparison data
        df2 = fetch_ticker_data(comp_ticker)
        
        # Main DF usually has 'Date' and 'Close'. Ensure proper types.
        if not pd.api.types.is_datetime64_any_dtype(df1['Date']):
             # Try parsing
             df1['Date'] = pd.to_datetime(df1['Date'])
        
        if not pd.api.types.is_numeric_dtype(df1['Close']):
             df1['Close'] = pd.to_numeric(df1['Close'], errors='coerce')
        
        # Merge on Date (Left join to keep all Main Ticker days)
        df = pd.merge(df1[['Date', 'Close']], df2[['Date', 'Close']], on='Date', how='left', suffixes=('_main', '_comp'))
        df = df.set_index('Date').sort_index()
        
        # Forward fill missing comparison data
        df['Close_comp'] = df['Close_comp'].ffill()
        df = df.dropna()
        
        # Calculate Percentage Change
        df['pct_main'] = df['Close_main'].pct_change(periods=period)
        df['pct_comp'] = df['Close_comp'].pct_change(periods=period)
        
        # Calculate Diff
        df['diff'] = (df['pct_main'] * 100) - (df['pct_comp'] * 100)
        
        # Calculate Rolling 
        df['min_val'] = df['diff'].rolling(window=rescale_period).min()
        df['max_val'] = df['diff'].rolling(window=rescale_period).max()
        
        denom = df['max_val'] - df['min_val']
        denom = denom.replace(0, 1)
        
        df['rescaled'] = (df['diff'] - df['min_val']) / denom * 200 - 100
        
        # Show last year (approx 252 trading days)
        last_year = df.iloc[-252:].copy()
        
        results = []
        for date, row in last_year.iterrows():
            if pd.notna(row['rescaled']):
                results.append({
                    'date': date.strftime('%d.%m.%Y'),
                    'value': round(row['rescaled'], 2)
                })
        return results[::-1]

def calculate_valuation(main_ticker, comp_ticker, period=10, rescale_period=100):
    try:
        # Fetch data
        df1 = fetch_ticker_data(main_ticker)
        return calculate_valuation_from_df(df1, comp_ticker, period, rescale_period)
    except Exception as e:
        print(f"Valuation Error: {e}")
        return []

def prepare_data(data_source, min_year=None):
    # 1. Load Data
    if isinstance(data_source, str):
        try:
            df = pd.read_excel(data_source)
        except Exception:
            try:
                df = pd.read_csv(data_source)
            except:
                raise ValueError("Could not read file. Please ensure it is a valid Excel or CSV file.")

        # Check for "CSV inside Excel" (single column with commas or semicolons)
        if len(df.columns) == 1 and df[df.columns[0]].dtype == 'object':
            try:
                first_col = df.columns[0]
                # Check for comma
                if ',' in first_col:
                    header_list = first_col.split(',')
                    df_split = df[first_col].astype(str).str.split(',', expand=True)
                    if len(df_split.columns) == len(header_list):
                        df_split.columns = header_list
                        df = df_split
                # Check for semicolon
                elif ';' in first_col:
                    header_list = first_col.split(';')
                    df_split = df[first_col].astype(str).str.split(';', expand=True)
                    if len(df_split.columns) == len(header_list):
                        df_split.columns = header_list
                        df = df_split
                else:
                    first_val = str(df.iloc[0,0])
                    if ',' in first_val:
                        df_split = df[df.columns[0]].astype(str).str.split(',', expand=True)
                        df = df_split
                    elif ';' in first_val:
                        df_split = df[df.columns[0]].astype(str).str.split(';', expand=True)
                        df = df_split
            except Exception:
                pass
    else:
        # Assume it's a DataFrame
        df = data_source.copy()

    # 2. Preprocessing
    date_col = None
    close_col = None
    
    df.columns = [str(c).strip() for c in df.columns]
    
    for col in df.columns:
        c_lower = col.lower()
        if 'date' in c_lower or 'datum' in c_lower or 'zeit' in c_lower or 'time' in c_lower:
            date_col = col
        # Prioritize 'Close' or 'Adj Close'
        if 'close' == c_lower:
             close_col = col
        if not close_col and ('close' in c_lower or 'schuss' in c_lower or 'kurs' in c_lower or 'price' in c_lower or 'wert' in c_lower):
            close_col = col
            
    if not date_col:
        date_col = df.columns[0]
    if not close_col:
        close_col = df.columns[-1] if len(df.columns) > 1 else df.columns[0]
    
    df = df.rename(columns={date_col: 'Date', close_col: 'Close'})
    
    # Fix: Handle case where 'Close' might be a DataFrame due to duplicates
    if isinstance(df['Close'], pd.DataFrame):
        df['Close'] = df['Close'].iloc[:, 0]
        
    df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
    
    # Handle Date Parsing
    if not pd.api.types.is_datetime64_any_dtype(df['Date']):
        try:
            first_date_val = df['Date'].iloc[0]
            try:
                check_val = float(first_date_val)
            except (ValueError, TypeError):
                check_val = 0
                
            if 946684800 < check_val < 4102444800: 
                df['Date'] = pd.to_datetime(df['Date'], unit='s')
            elif check_val > 4102444800:
                if 946684800000 < check_val < 4102444800000:
                    df['Date'] = pd.to_datetime(df['Date'], unit='ms')
                else:
                     df['Date'] = pd.to_datetime(df['Date'], format='%Y%m%d', errors='coerce')
                     if df['Date'].isna().all():
                         df['Date'] = pd.to_datetime(df['Date'], dayfirst=True, errors='coerce')
            else:
                df['Date'] = pd.to_datetime(df['Date'], dayfirst=True, errors='coerce')
        except Exception:
            df['Date'] = pd.to_datetime(df['Date'], dayfirst=True, errors='coerce')
             
    # Normalize (remove time)
    df['Date'] = df['Date'].dt.normalize()
    df = df.sort_values('Date')
    
    if df.empty:
         raise ValueError("Die Datei enthält keine gültigen Daten.")

    # Filter Date
    if min_year:
        df = df[df['Date'] >= f'{min_year}-01-01']

    if df.empty:
        raise ValueError(f"Keine Daten für den Analysezeitraum gefunden.")
        
    return df


def analyze_seasonality(data_source, lookback_years=10, min_win_rate=70, search_start_date=None, search_end_date=None, 
                        filter_mode=None, filter_odd_years=False, exclude_2020=False, 
                        filter_election=False, filter_midterm=False, filter_pre_election=False, filter_post_election=False):
    # Backward compatibility: user's main.py passes lookback_years, but existing code used min_year internally.
    current_year = datetime.now().year
    min_year = current_year - lookback_years
    
    df = prepare_data(data_source, min_year=min_year)
    
    # 3. Analysis
    patterns = []
    
    df = df.sort_values('Date')
    df = df.set_index('Date', drop=False)
    trading_dates = df.index
    
    years = trading_dates.year.unique()
    
    if len(years) < 2:
         return []

    # Determine start/end range for the loop
    s_md = (1, 1)
    e_md = (12, 31)
    

    if search_start_date:
        try:
            d_str, m_str = search_start_date.split('.') # Expect DD.MM
            s_md = (int(m_str), int(d_str))
        except Exception as e:
            print(f"DEBUG: Error parsing start date {search_start_date}: {e}")
            pass
            
    if search_end_date:
         try:
            d_str, m_str = search_end_date.split('.')
            e_md = (int(m_str), int(d_str))
         except:
            pass

    # Optimization: Step by 3 days instead of 1 to approximate faster
    dummy_dates = pd.date_range('2023-01-01', '2023-12-31', freq='3D')
    
    for start_date_dummy in dummy_dates:
        start_month = start_date_dummy.month
        start_day = start_date_dummy.day
        
        # ... (keep date filter logic) ...
        
        if search_start_date and search_end_date:
             # Check if current date is within range
             # Construct simple compare
             curr_val = start_month * 100 + start_day
             start_val = s_md[0] * 100 + s_md[1]
             end_val = e_md[0] * 100 + e_md[1]
             
             if start_val <= end_val:
                 if not (start_val <= curr_val <= end_val):
                     continue
             else:
                 # Wrap around (e.g. Dec to Feb)
                 if not (curr_val >= start_val or curr_val <= end_val):
                     continue
        
        # Max duration 100 days (as requested)
        # Optimization: Step duration by 3 days
        for duration in range(10, 101, 3): # 10 to 100 days, step 3
            target_end_dummy = start_date_dummy + timedelta(days=duration)
            
            wins_long = 0
            wins_short = 0
            total_years = 0
            missed_years_long = []
            missed_years_short = []
            yearly_trades = []
            yearly_trades = []

            
            for year in years:
                # --- FILTER LOGIC ---
                # Backward Compatibility
                if filter_mode == 'post_election':
                    filter_post_election = True

                # Exclude 2020
                if exclude_2020 and int(year) == 2020:
                    continue
                
                # Odd Years Only
                if filter_odd_years and (int(year) % 2 == 0):
                    continue

                # Election Cycle Filters
                # Election Year (e.g. 2020, 2024) -> Remainder 0
                if filter_election and (int(year) % 4 != 0):
                    continue
                # Post-Election (e.g. 2021, 2025) -> Remainder 1
                if filter_post_election and (int(year) % 4 != 1):
                    continue
                # Midterm (e.g. 2022, 2026) -> Remainder 2
                if filter_midterm and (int(year) % 4 != 2):
                    continue
                # Pre-Election (e.g. 2023, 2027) -> Remainder 3
                if filter_pre_election and (int(year) % 4 != 3):
                    continue
                # --------------------

                try:
                    target_start = datetime(year=int(year), month=int(start_month), day=int(start_day))
                    # Ensure pandas compatibility if needed, but searchsorted handles datetime
                    target_start = pd.Timestamp(target_start) 
                    target_end = target_start + timedelta(days=duration)
                except ValueError:
                    continue
                
                # Entry
                try:
                    start_idx_loc = trading_dates.searchsorted(target_start, side='left')
                    if start_idx_loc >= len(trading_dates):
                        continue
                    actual_entry_date = trading_dates[start_idx_loc]
                    
                    if (actual_entry_date - target_start).days > 10:
                        # Only skip if data is REALLY missing (more than 10 days gap)
                        continue
                except Exception as e:
                    # print(f"DEBUG: Crash at Entry Logic: {e}")
                    raise e
                    
                try:
                    # Exit
                    # Use 'left' to find the first trading date ON or AFTER the target end date.
                    # 'right' would skip the target date itself if it exists.
                    end_idx_loc = trading_dates.searchsorted(target_end, side='left')
                    if end_idx_loc >= len(trading_dates):
                        continue
                    actual_exit_date = trading_dates[end_idx_loc]
                    
                    if actual_exit_date <= actual_entry_date:
                        continue
    
                    start_price = df.loc[actual_entry_date]['Close']
                    end_price = df.loc[actual_exit_date]['Close']
                    
                    if pd.isna(start_price) or pd.isna(end_price):
                        continue
                        
                except Exception as e:
                    # print(f"DEBUG: Crash at Exit/Price Logic: {e} | Type: {type(e)}")
                    # print details
                    raise e
                
                total_years += 1
                
                if end_price > start_price:
                    wins_long += 1
                    missed_years_short.append(int(year))
                elif end_price < start_price:
                    wins_short += 1
                    missed_years_long.append(int(year))
                else:
                    missed_years_long.append(int(year))
                    missed_years_short.append(int(year))
                
                # DEBUG for DIS 2015 Case - Removed to clean output
                
                yearly_trades.append({
                    "year": int(year),
                    "entry_date": actual_entry_date.strftime("%Y-%m-%d"),
                    "exit_date": actual_exit_date.strftime("%Y-%m-%d"),
                    "entry_price": float(start_price),
                    "exit_price": float(end_price),
                    "gain_percent": float((end_price - start_price) / start_price * 100) if start_price != 0 else 0
                })

            if total_years < 2: # Reduced to 2 to allow for sparse filters (e.g. 10y lookback + post-election = 2 years)
                continue

            # Calculate Stats (Direction Agnostic first, then adjust for Short)
            # yearly_trades has "gain_percent" which is (Exit - Entry)/Entry * 100
            # For LONG: gain_percent is correct
            # For SHORT: gain_percent needs to be inverted (-1 * gain_percent)
            
            trades_df = pd.DataFrame(yearly_trades)
            if trades_df.empty: continue
            
            # Check Long
            win_rate_long = (wins_long / total_years) * 100
            if win_rate_long >= min_win_rate:
                long_gains = trades_df['gain_percent']
                avg_ret = long_gains.mean()
                max_ret = long_gains.max()
                min_ret = long_gains.min() # Max Loss
                
                patterns.append({
                    'start_md': (start_month, start_day),
                    'end_md': (target_end_dummy.month, target_end_dummy.day),
                    'duration': duration,
                    'type': 'Long',
                    'win_rate': float(win_rate_long),
                    'missed_years': missed_years_long,
                    'years_analyzed': total_years,
                    'avg_return': float(avg_ret),
                    'max_return': float(max_ret),
                    'min_return': float(min_ret),
                    'analysis_period_start': int(years.min()),
                    'analysis_period_end': int(years.max()),
                    'yearly_trades': yearly_trades,
                    'start_str': f"2023-{start_month:02d}-{start_day:02d}",
                    'end_str': f"2023-{target_end_dummy.month:02d}-{target_end_dummy.day:02d}"
                })
                
            # Check Short
            win_rate_short = (wins_short / total_years) * 100
            if win_rate_short >= min_win_rate:
                # Invert gains for Short
                short_gains = -1 * trades_df['gain_percent']
                avg_ret = short_gains.mean()
                max_ret = short_gains.max()
                min_ret = short_gains.min()
                
                patterns.append({
                    'start_md': (start_month, start_day),
                    'end_md': (target_end_dummy.month, target_end_dummy.day),
                    'duration': duration,
                    'type': 'Short',
                    'win_rate': float(win_rate_short),
                    'missed_years': missed_years_short,
                    'years_analyzed': total_years,
                    'avg_return': float(avg_ret),
                    'max_return': float(max_ret),
                    'min_return': float(min_ret),
                    'analysis_period_start': int(years.min()),
                    'analysis_period_end': int(years.max()),
                    'yearly_trades': yearly_trades,
                    'start_str': f"2023-{start_month:02d}-{start_day:02d}",
                    'end_str': f"2023-{target_end_dummy.month:02d}-{target_end_dummy.day:02d}"
                })

    # Sort by Win Rate (desc), then by Years (desc)
    patterns.sort(key=lambda x: (x['win_rate'], x['years_analyzed']), reverse=True)
    
    # Filter for distinct patterns (avoid variations of the same window)
    final_patterns = []
    
    def get_doy_range(p):
        # Convert MD to DOY (approx)
        start = (datetime(2023, p['start_md'][0], p['start_md'][1]) - datetime(2023, 1, 1)).days
        end = start + p['duration']
        return start, end

    for p in patterns:
        if len(final_patterns) >= 10:
            break
            
        is_distinct = True
        p_start, p_end = get_doy_range(p)
        
        for existing in final_patterns:
            e_start, e_end = get_doy_range(existing)
            
            # Check overlap
            overlap_start = max(p_start, e_start)
            overlap_end = min(p_end, e_end)
            overlap_len = max(0, overlap_end - overlap_start)
            
            # If overlap covers > 50% of the shorter pattern, consider it duplicate
            min_len = min(p['duration'], existing['duration'])
            if overlap_len > (min_len * 0.5):
                is_distinct = False
                break
        
        if is_distinct:
            final_patterns.append(p)
            
    return final_patterns

def load_valuation_df(file_path):
    """
    Specialized loader for Valuation files that may contain multiple Symbol columns.
    Avoids aggressive renaming of non-Date columns.
    """
    # 1. Load Data
    try:
        df = pd.read_excel(file_path)
    except Exception:
        try:
            df = pd.read_csv(file_path)
        except:
            raise ValueError("Could not read file.")

    # Check for "CSV inside Excel" logic (same as prepare_data)
    if len(df.columns) == 1 and df[df.columns[0]].dtype == 'object':
        try:
            first_col = df.columns[0]
            if ',' in first_col:
                header_list = first_col.split(',')
                df_split = df[first_col].astype(str).str.split(',', expand=True)
                if len(df_split.columns) == len(header_list):
                    df_split.columns = header_list
                    df = df_split
            elif ';' in first_col:
                header_list = first_col.split(';')
                df_split = df[first_col].astype(str).str.split(';', expand=True)
                if len(df_split.columns) == len(header_list):
                    df_split.columns = header_list
                    df = df_split
        except Exception:
            pass
            
    # 2. Find Date Column
    date_col = None
    df.columns = [str(c).strip() for c in df.columns]
    
    for col in df.columns:
        c_lower = col.lower()
        if 'date' in c_lower or 'datum' in c_lower or 'zeit' in c_lower or 'time' in c_lower:
            date_col = col
            break
            
    if not date_col:
        date_col = df.columns[0]
        
    df = df.rename(columns={date_col: 'Date'})
    
    # 3. Parse Date (Robust)
    if not pd.api.types.is_datetime64_any_dtype(df['Date']):
        try:
            # Check first value to guess format
            first_val = df['Date'].iloc[0]
            try:
                check_val = float(first_val)
                # Timestamp logic
                if 30000000 < check_val < 4102444800: 
                    df['Date'] = pd.to_datetime(df['Date'], unit='s')
                elif check_val > 4102444800: # ms
                    df['Date'] = pd.to_datetime(df['Date'], unit='ms')
                else: 
                     # Integer date like 20230101 ?
                     df['Date'] = pd.to_datetime(df['Date'], format='%Y%m%d', errors='coerce')
            except:
                # String parse
                df['Date'] = pd.to_datetime(df['Date'], dayfirst=True, errors='coerce')
        except:
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            
    df['Date'] = df['Date'].dt.normalize()
    df = df.sort_values('Date')
    
    return df

def calculate_seasonal_trend(df, lookback_years=10, filter_mode=None, filter_odd_years=False, exclude_2020=False, 
                               filter_election=False, filter_midterm=False, filter_pre_election=False, filter_post_election=False):
    """
    Calculates the seasonal trend by averaging normalized yearly performance.
    Uses daily interpolation and aligns by Month-Day to handle leap years correctly.
    """
    try:
        from datetime import datetime
        import pandas as pd
        import numpy as np
        
        df = df.copy()
        # Ensure Index
        if 'Date' not in df.columns and df.index.name == 'Date':
            df = df.reset_index()
            
        if not pd.api.types.is_datetime64_any_dtype(df['Date']):
            df['Date'] = pd.to_datetime(df['Date'])
            
        df = df.set_index('Date').sort_index()
        
        # Remove duplicate index if any
        df = df[~df.index.duplicated(keep='first')]
        
        current_year = datetime.now().year
        start_year = current_year - lookback_years
        
        # Dictionary to store lists of values for each MM-DD
        # We use a non-leap year (2023) to avoid sample size bias on Feb 29
        # (Feb 29 would only have ~1/4 of the samples, causing artifacts if those years were outliers)
        dummy_dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
        mmdd_map = {d.strftime("%m-%d"): [] for d in dummy_dates}
        
        found_years = 0
        
        for year in range(start_year, current_year + 1):
            # --- FILTER LOGIC ---
            if filter_mode == 'post_election': filter_post_election = True
            
            if exclude_2020 and year == 2020: continue
            if filter_odd_years and (year % 2 == 0): continue
            
            if filter_election and (year % 4 != 0): continue
            if filter_post_election and (year % 4 != 1): continue
            if filter_midterm and (year % 4 != 2): continue
            if filter_pre_election and (year % 4 != 3): continue
            # --------------------
            
            # Define full calendar range for this year
            t_start = f'{year}-01-01'
            t_end = f'{year}-12-31'
            
            # Slice and Check
            if t_start not in df.index and t_end not in df.index:
                # Check if we have ANY data for this year
                subset = df[t_start:t_end]
                if subset.empty:
                    continue
            
            # Reindex to full daily range (handles weekends/holidays)
            full_idx = pd.date_range(start=t_start, end=t_end, freq='D')
            
            # Reindex using nearest or ffill
            # Get valid subset first to avoid reindexing huge empty df
            subset = df[df.index.year == year]
            if subset.empty: continue
            
            # Create full year series
            daily_series = subset['Close'].reindex(full_idx, method='ffill')
            
            # Handle start of year missing (backfill)
            daily_series = daily_series.bfill()
            
            if daily_series.empty or pd.isna(daily_series.iloc[0]) or daily_series.iloc[0] == 0:
                continue
                
            # Normalize: Jan 1st = 100
            start_val = daily_series.iloc[0]
            normalized = (daily_series / start_val) * 100
            
            # Store values in map
            for date, val in normalized.items():
                if pd.isna(val): continue
                # key = MM-DD
                k = date.strftime("%m-%d")
                
                # Skip Feb 29 to maintain consistent sample size
                if k == "02-29": continue
                
                if k in mmdd_map:
                    mmdd_map[k].append(val)
            
            found_years += 1
            
        if found_years == 0:
            return []
            
        # Average
        trend = []
        # Use 2023 (Non-Leap) for sorting and output dates
        for d in dummy_dates:
            k = d.strftime("%m-%d")
            vals = mmdd_map.get(k, [])
            
            if vals:
                # Calculate Mean
                avg_val = sum(vals) / len(vals)
                
                # Format for Frontend
                trend.append({
                    "date": d.strftime("%b %d"),
                    "sort_date": d.strftime("2023-%m-%d"),
                    "value": avg_val, # Keep raw for smoothing
                    "count": len(vals)
                })
        
        # No Smoothing - Raw Daily Average
        for t in trend:
             t['value'] = round(t['value'], 2)
                 
        return trend
    except Exception as e:
        print(f"Seasonal Trend Error: {e}")
        import traceback
        traceback.print_exc()
        return []

def get_current_year_data(df):
    try:
        current_year = datetime.now().year
        # Handle case where 'Date' column might be index or column
        df = df.copy()
        if 'Date' not in df.columns and df.index.name == 'Date':
             df = df.reset_index()

        # Ensure datetime
        if not pd.api.types.is_datetime64_any_dtype(df['Date']):
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
             
        # Filter for current year
        subset = df[df['Date'].dt.year == current_year].copy()
        
        if subset.empty:
            return []
            
        subset = subset.sort_values('Date')
        
        # Determine range: Jan 1 to Last Available Date
        # We want to fill weekends/holidays but NOT project into the future
        start_date = f"{current_year}-01-01"
        last_date = subset['Date'].max()
        
        full_idx = pd.date_range(start=start_date, end=last_date, freq='D')
        
        # Set index for reindexing
        subset = subset.set_index('Date')
        
        # Reindex and ffill (propagates Friday close to Sat/Sun)
        daily_subset = subset['Close'].reindex(full_idx, method='ffill')
        
        # Handle start of year if Jan 1 is missing (backfill briefly)
        daily_subset = daily_subset.bfill()

        # Normalize to 100 at start of year
        if daily_subset.empty or pd.isna(daily_subset.iloc[0]) or daily_subset.iloc[0] == 0:
             return []
             
        start_val = daily_subset.iloc[0]
        normalized = (daily_subset / start_val) * 100
        
        # Format for chart
        current_trend = []
        for date, val in normalized.items():
            if pd.isna(val): continue
            
            # Format: "Jan 01" matches the Seasonal Trend keys
            current_trend.append({
                "date": date.strftime("%b %d"),
                "current_value": round(val, 2)
            })
            
        return current_trend
    except Exception as e:
        print(f"Error getting current year data: {e}")
        return []

def evaluate_custom_pattern(df, start_md, end_md, lookback_years=10, min_win_rate=0, filter_mode=None,
                            filter_odd_years=False, exclude_2020=False, 
                            filter_election=False, filter_midterm=False, filter_pre_election=False, filter_post_election=False):
    """
    Evaluates a specific seasonal pattern (Start MD to End MD) over the lookback period.
    Returns the full stats structure.
    """
    try:
        df = df.copy()
        if 'Date' not in df.columns and df.index.name == 'Date':
             df = df.reset_index()
             
        if not pd.api.types.is_datetime64_any_dtype(df['Date']):
            df['Date'] = pd.to_datetime(df['Date'])
            
        df = df.set_index('Date').sort_index()
        trading_dates = df.index
        
        current_year = datetime.now().year
        start_year = current_year - lookback_years
        years = range(start_year, current_year + 1)
        
        s_m, s_d = map(int, start_md.split('-'))
        e_m, e_d = map(int, end_md.split('-'))
        
        wins_long = 0
        total_years = 0
        missed_years_long = []
        yearly_trades = []
        
        for year in years:
            # --- FILTER LOGIC ---
            if filter_mode == 'post_election': filter_post_election = True
            
            if exclude_2020 and year == 2020: continue
            if filter_odd_years and (year % 2 == 0): continue
            
            if filter_election and (year % 4 != 0): continue
            if filter_post_election and (year % 4 != 1): continue
            if filter_midterm and (year % 4 != 2): continue
            if filter_pre_election and (year % 4 != 3): continue
            # --------------------

            try:
                # Target Dates
                target_start = datetime(year, s_m, s_d)
                
                # Handle Year Wrap (Dec -> Jan)
                target_end_year = year if (s_m < e_m) or (s_m == e_m and s_d < e_d) else year + 1
                target_end = datetime(target_end_year, e_m, e_d)
                
                # Find valid trading days
                # Entry
                start_idx = trading_dates.searchsorted(target_start)
                if start_idx >= len(trading_dates): continue
                actual_entry = trading_dates[start_idx]
                
                # Check latency
                if (actual_entry - target_start).days > 10: continue

                # Exit
                end_idx = trading_dates.searchsorted(target_end)
                if end_idx >= len(trading_dates): continue
                actual_exit = trading_dates[end_idx]
                
                if actual_exit <= actual_entry: continue
                
                # Prices
                metrics = df.loc[[actual_entry, actual_exit]]
                if len(metrics) < 2: continue
                
                start_price = metrics.loc[actual_entry]['Close']
                end_price = metrics.loc[actual_exit]['Close']
                
                gain_pct = ((end_price - start_price) / start_price) * 100
                
                yearly_trades.append({
                    "year": year,
                    "entry_date": actual_entry.strftime("%Y-%m-%d"),
                    "exit_date": actual_exit.strftime("%Y-%m-%d"),
                    "entry_price": float(start_price),
                    "exit_price": float(end_price),
                    "gain_percent": float(gain_pct)
                })
                
                total_years += 1
                if gain_pct > 0:
                    wins_long += 1
                else:
                    missed_years_long.append(year)
                    
            except Exception:
                continue
                
        if total_years == 0:
            return None
            
        win_rate = (wins_long / total_years) * 100
        
        trades_df = pd.DataFrame(yearly_trades)
        avg_ret = trades_df['gain_percent'].mean()
        max_ret = trades_df['gain_percent'].max()
        min_ret = trades_df['gain_percent'].min()
        
        # Determine duration
        duration = (datetime(2023, s_m, s_d) - datetime(2023 if s_m <= e_m else 2024, e_m, e_d)).days
        duration = abs(duration)
        
        return {
            'start_md': (s_m, s_d),
            'end_md': (e_m, e_d),
            'type': 'Long', # Default to Long for interactive analysis
            'win_rate': float(win_rate),
            'missed_years': missed_years_long,
            'years_analyzed': total_years,
            'avg_return': float(avg_ret),
            'max_return': float(max_ret),
            'min_return': float(min_ret),
            'yearly_trades': yearly_trades,
             # Format for frontend matching
            'start_str': f"2023-{s_m:02d}-{s_d:02d}",
            'end_str': f"2023-{e_m:02d}-{e_d:02d}"
        }

    except Exception as e:
        print(f"Custom Pattern Error: {e}")
        return None
