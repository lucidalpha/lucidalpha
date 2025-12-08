import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Generate dates from 2015 to 2024
dates = pd.date_range(start='2015-01-01', end='2024-12-31', freq='B') # Business days
df = pd.DataFrame({'Date': dates})

# Base price
price = 100
prices = []

for d in dates:
    # Seasonal pattern: January is bullish
    if d.month == 1:
        price += 1 # Up in Jan
    elif d.month == 2:
        price -= 0.5 # Down/Correction in Feb
    else:
        price += np.random.normal(0, 0.5) # Random walk
    
    prices.append(price)

df['Close'] = prices

df.to_csv('dummy_seasonal.csv', index=False)
print("Created dummy_seasonal.csv")
