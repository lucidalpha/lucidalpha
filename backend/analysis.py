import pandas as pd
from datetime import datetime, timedelta
import yfinance as yf
import functools

import requests


@functools.lru_cache(maxsize=32)
def fetch_ticker_data(ticker):
    """
    Fetches historical data using yfinance library for better reliability.
    """
    try:
        # Use yfinance download
        # period="max" or "20y" to ensure we have enough history for lookback
        df = yf.download(ticker, period="20y", interval="1d", progress=False, multi_level_index=False)
        
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


def analyze_seasonality(data_source, min_year=2014, min_win_rate=70, search_start_date=None, search_end_date=None):
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

    dummy_dates = pd.date_range('2023-01-01', '2023-12-31', freq='D')
    
    for start_date_dummy in dummy_dates:
        start_month = start_date_dummy.month
        start_day = start_date_dummy.day
        
        # Date Filter Logic
        # Convert to DOY for easy comparison, handling year wrap if needed? 
        # For simplicity, if a specific window is requested, we only check patterns STARTING in that window.
        
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
        
        # Max duration 30 days
        for duration in range(10, 31): # 10 to 30
            target_end_dummy = start_date_dummy + timedelta(days=duration)
            
            wins_long = 0
            wins_short = 0
            total_years = 0
            missed_years_long = []
            missed_years_short = []
            
            for year in years:
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
                    
                    if (actual_entry_date - target_start).days > 7:
                        continue
                except Exception as e:
                    print(f"DEBUG: Crash at Entry Logic: {e}")
                    raise e
                    
                try:
                    # Exit
                    end_idx_loc = trading_dates.searchsorted(target_end, side='right')
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
                    print(f"DEBUG: Crash at Exit/Price Logic: {e} | Type: {type(e)}")
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

            if total_years < 5: 
                continue
                
            # Check Long
            win_rate_long = (wins_long / total_years) * 100
            if win_rate_long >= min_win_rate:
                patterns.append({
                    'start_md': (start_month, start_day),
                    'end_md': (target_end_dummy.month, target_end_dummy.day),
                    'duration': duration,
                    'type': 'Long',
                    'win_rate': float(win_rate_long),
                    'missed_years': missed_years_long,
                    'years_analyzed': total_years,
                    'start_str': f"2023-{start_month:02d}-{start_day:02d}",
                    'end_str': f"2023-{target_end_dummy.month:02d}-{target_end_dummy.day:02d}"
                })
                
            # Check Short
            win_rate_short = (wins_short / total_years) * 100
            if win_rate_short >= min_win_rate:
                patterns.append({
                    'start_md': (start_month, start_day),
                    'end_md': (target_end_dummy.month, target_end_dummy.day),
                    'duration': duration,
                    'type': 'Short',
                    'win_rate': float(win_rate_short),
                    'missed_years': missed_years_short,
                    'years_analyzed': total_years,
                    'start_str': f"2023-{start_month:02d}-{start_day:02d}",
                    'end_str': f"2023-{target_end_dummy.month:02d}-{target_end_dummy.day:02d}"
                })

    # Sort by Win Rate (desc), then by Years (desc) to favor robustness
    patterns.sort(key=lambda x: (x['win_rate'], x['years_analyzed']), reverse=True)
    
    # User Request: Only the SINGLE strongest pattern per asset
    if patterns:
        final_patterns = [patterns[0]]
    else:
        final_patterns = []
            
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
                # 30,000,000 is safely above YYYYMMDD (20250101 approx 20mil)
                # This allows timestamps from ~1971 onwards
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
