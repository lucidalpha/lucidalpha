import pandas as pd
import numpy as np

class Backtester:
    def __init__(self, initial_capital=100000.0):
        self.initial_capital = initial_capital

    def run(self, df, threshold=0.7):
        """
        Runs backtest for Buy & Hold and Regime Filter strategies.
        df must contain 'Returns' (log returns) and 'Bull_Prob'.
        """
        data = df.copy()
        
        # Strategy 1: Buy & Hold
        # We assume we are always long.
        data['BH_Returns'] = data['Returns']
        
        # Strategy 2: Regime Filter
        # Signal is based on Previous Day's Probability to avoid look-ahead bias
        # If Bull_Prob[t-1] > threshold, we define t as a "Long" day.
        # However, for a "Regime Analyzer" showing what happened, sometimes users want to see 
        # "Returns during this regime". 
        # But for "Backtest", we Must shift.
        # We will use shift(1).
        
        data['Signal'] = (data['Bull_Prob'].shift(1) > threshold).astype(int)
        data['RF_Returns'] = data['Signal'] * data['Returns']
        
        # Calculate Equity Curves (using Log returns: Price_t = P_0 * exp(sum(r)))
        # Adjust for initial capital
        
        data['BH_Equity'] = self.initial_capital * np.exp(data['BH_Returns'].cumsum())
        data['RF_Equity'] = self.initial_capital * np.exp(data['RF_Returns'].cumsum())
        
        # Handle NA from shift
        data = data.dropna()
        
        metrics = {
            'Buy & Hold': self.calculate_metrics(data['BH_Returns'], data['BH_Equity']),
            'Regime Filter': self.calculate_metrics(data['RF_Returns'], data['RF_Equity'])
        }
        
        return data, metrics

    def calculate_metrics(self, daily_returns, equity_curve):
        total_return = (equity_curve.iloc[-1] / equity_curve.iloc[0]) - 1
        
        # Sharpe Ratio (assuming 0 risk-free for simplicity or excess returns)
        # Annualized
        if daily_returns.std() == 0:
            sharpe = 0
        else:
            sharpe = (daily_returns.mean() / daily_returns.std()) * np.sqrt(252)
            
        # Max Drawdown
        rolling_max = equity_curve.cummax()
        drawdown = (equity_curve - rolling_max) / rolling_max
        max_drawdown = drawdown.min()
        
        return {
            'Total Return': total_return,
            'Sharpe Ratio': sharpe,
            'Max Drawdown': max_drawdown,
            'Final Equity': equity_curve.iloc[-1]
        }
