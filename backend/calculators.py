
import random
import numpy as np

def run_risk_analysis(start_capital, win_rate, risk_reward, risk_per_trade, num_trades, drawdown_target, num_simulations=100000):
    """
    Calculates the probability of hitting a specific drawdown target within a series of trades.
    Uses fully vectorized NumPy operations for high performance and stability.
    """
    # NO fixed seed -> True Randomness each time
    
    # Parameters
    win_prob = win_rate / 100.0
    risk_pct = risk_per_trade / 100.0
    reward_pct = risk_pct * risk_reward
    target_dd_ratio = drawdown_target / 100.0
    
    # 1. Generate all trade outcomes
    # Using a fresh Generator each time ensures randomness without global state side effects
    rng = np.random.default_rng() 
    draws = rng.random((num_simulations, num_trades), dtype=np.float32)
    
    # 2. Convert to returns multipliers
    win_multiplier = 1.0 + reward_pct
    loss_multiplier = 1.0 - risk_pct
    
    factors = np.where(draws < win_prob, win_multiplier, loss_multiplier)
    
    # 3. Calculate Equity Curves
    equity_curves = np.empty((num_simulations, num_trades + 1), dtype=np.float64)
    equity_curves[:, 0] = start_capital
    equity_curves[:, 1:] = start_capital * np.cumprod(factors, axis=1)
    
    # 4. Drawdowns
    peaks = np.maximum.accumulate(equity_curves, axis=1)
    drawdowns = (peaks - equity_curves) / peaks
    max_dds = np.max(drawdowns, axis=1)
    
    # 5. Thresholds
    hits_drawdown = np.sum(max_dds >= target_dd_ratio)
    
    # Ruin
    min_equities = np.min(equity_curves, axis=1)
    hits_ruin = np.sum(min_equities <= 0.01)

    return {
        "probability_of_drawdown": (hits_drawdown / num_simulations) * 100,
        "risk_of_ruin": (hits_ruin / num_simulations) * 100,
        "average_max_drawdown": np.mean(max_dds) * 100
    }

def run_monte_carlo(start_capital, win_rate, risk_reward, risk_per_trade, num_trades, num_simulations):
    """
    Runs Monte Carlo simulation with TRUE RANDOMNESS.
    """
    # Ensure reasonable minimum for percentiles, but respect user input mainly
    if num_simulations < 100:
        num_simulations = 100
        
    # NO fixed seed -> True Randomness
    rng = np.random.default_rng()
    
    win_prob = win_rate / 100.0
    risk_pct = risk_per_trade / 100.0
    reward_pct = risk_pct * risk_reward
    
    # Generate numbers
    draws = rng.random((num_simulations, num_trades), dtype=np.float32)
    
    win_multiplier = 1.0 + reward_pct
    loss_multiplier = 1.0 - risk_pct
    
    factors = np.where(draws < win_prob, win_multiplier, loss_multiplier)
    
    # Calculate Curves
    equity_curves = np.empty((num_simulations, num_trades + 1), dtype=np.float64)
    equity_curves[:, 0] = start_capital
    equity_curves[:, 1:] = start_capital * np.cumprod(factors, axis=1)
    
    # Final Equities
    final_equities = equity_curves[:, -1]
    
    # Sort for Percentiles
    sorted_indices = np.argsort(final_equities)
    
    # Extract Indexes
    idx_5 = sorted_indices[int(num_simulations * 0.05)]
    idx_50 = sorted_indices[int(num_simulations * 0.50)]
    idx_95 = sorted_indices[int(num_simulations * 0.95)]
    
    def calculate_max_dd(curve):
        peak = np.maximum.accumulate(curve)
        dds = (peak - curve) / peak
        return np.max(dds) * 100.0
        
    results = {}
    
    for name, idx in [("worst", idx_5), ("median", idx_50), ("best", idx_95)]:
        curve = equity_curves[idx]
        final_eq = curve[-1]
        max_dd = calculate_max_dd(curve)
        performance = ((final_eq - start_capital) / start_capital) * 100.0
        
        results[name] = {
            "end_capital": float(final_eq),
            "performance": float(performance),
            "max_drawdown": float(max_dd),
            "curve": curve.tolist()
        }
    
    return results
