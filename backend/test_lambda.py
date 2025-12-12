import numpy as np
import pandas as pd
from statsmodels.tsa.filters.hp_filter import hpfilter
import yfinance as yf

# Fetch ETH data
print("Fetching ETH-USD data...")
eth = yf.download('ETH-USD', period='2y', progress=False)
prices = eth['Close'].values.flatten()
N = len(prices)
print(f"Data points: {N}")

print('\nTesting HP filter lambda values...')
print('='*60)

results = []
for lamb in [1600, 14400, 129600, 500000, 1000000, 6250000]:
    cycle, trend = hpfilter(pd.Series(prices), lamb=lamb)
    cycle = cycle.values
    
    # Calculate direction match percentage (daily)
    price_changes = np.diff(prices)
    cycle_changes = np.diff(cycle)
    
    same_dir = np.sum((price_changes * cycle_changes) > 0)
    total = len(price_changes)
    pct = 100 * same_dir / total
    
    # Correlation
    corr = np.corrcoef(price_changes, cycle_changes)[0,1]
    
    # Also check correlation between LEVELS (cycle vs price minus mean)
    price_centered = prices - np.mean(prices)
    level_corr = np.corrcoef(price_centered, cycle)[0,1]
    
    print(f'{lamb}: DirMatch={pct:.1f}% LevelCorr={level_corr:.3f}')
    results.append((lamb, pct, corr, level_corr))

print('')
print('Best Lambda for level correlation:', max(results, key=lambda x: x[3])[0])
print('Best Lambda for daily direction:', max(results, key=lambda x: x[1])[0])
