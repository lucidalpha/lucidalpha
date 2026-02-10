import argparse
import sys
import data_fetcher
import hmm_model
import backtester
import datetime
import pandas as pd

def run_pipeline(ticker, start_date, end_date, n_states, threshold):
    print(f"--- Running HMM Analysis for {ticker} ---")
    print(f"Period: {start_date} to {end_date}")
    
    # 1. Fetch Data
    df = data_fetcher.fetch_data(ticker, start_date, end_date)
    if df is None:
        print("Error: Could not fetch data.")
        return

    # 2. Features
    df = data_fetcher.prepare_features(df)
    print(f"Data prepared: {len(df)} days.")

    # 3. Model
    print(f"Training HMM with {n_states} states...")
    model = hmm_model.HMMRegimeModel(n_components=n_states)
    stats = model.train(df)
    df, _ = model.predict(df)
    
    # 4. Backtest
    print("Running Backtest...")
    tester = backtester.Backtester()
    res_df, metrics = tester.run(df, threshold=threshold)
    
    print("\n--- Results ---")
    res_table = pd.DataFrame(metrics).T
    print(res_table[['Total Return', 'Sharpe Ratio', 'Max Drawdown', 'Final Equity']])
    
    print("\nTo see the interactive dashboard, run:")
    print("streamlit run dashboard.py")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HMM Trading Regime Analyzer")
    parser.add_argument("--ticker", type=str, default="SPY", help="Ticker symbol")
    parser.add_argument("--states", type=int, default=2, help="Number of HMM states")
    parser.add_argument("--threshold", type=float, default=0.7, help="Regime probability threshold")
    
    args = parser.parse_args()
    
    end = datetime.date.today()
    start = end - datetime.timedelta(days=365*5)
    
    run_pipeline(args.ticker, start, end, args.states, args.threshold)
