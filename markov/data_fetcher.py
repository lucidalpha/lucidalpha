import yfinance as yf
import pandas as pd
import numpy as np

def fetch_data(ticker, start_date, end_date):
    """
    Fetches OHLCV data from yfinance.
    """
    try:
        df = yf.download(ticker, start=start_date, end=end_date, progress=False)
        if df.empty:
            return None
        
        # Flatten MultiIndex columns if present (common in new yfinance versions)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        # Ensure standard columns
        df = df[['Open', 'High', 'Low', 'Close', 'Volume']].dropna()
        
        return df
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def prepare_features(df):
    """
    Calculates log returns and rolling volatility.
    """
    df = df.copy()
    
    # Log Returns
    df['Returns'] = np.log(df['Close'] / df['Close'].shift(1))
    
    # 20-day Rolling Volatility (Annualized)
    # Volatility = std_dev * sqrt(252)
    df['Volatility'] = df['Returns'].rolling(window=20).std() * np.sqrt(252)
    
    # Drop NaNs created by rolling/shifting
    df = df.dropna()
    
    return df
