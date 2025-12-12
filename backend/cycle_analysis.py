"""
FSC Cycle Scanner Algorithm Implementation - CORRECTED VERSION
Based on Lars von Thienen's whitepaper from the Foundation for the Study of Cycles

Key Fixes:
- Phase calculation now uses LEAST SQUARES fitting for accurate alignment
- Composite wave matches actual price movements
- Proper phase alignment at the end of the data series
"""

import numpy as np
import pandas as pd
from scipy import signal, stats, optimize
from statsmodels.tsa.filters.hp_filter import hpfilter


# =============================================================================
# STEP 1: DETRENDING - Hodrick-Prescott Filter
# =============================================================================

def hp_detrend(series, lamb=None):
    """
    Hodrick-Prescott filter detrending as per FSC methodology.
    
    Lambda (λ) adjustment based on data frequency (Ravn & Uhlig, 1997):
    - For quarterly data: λ = 1600 (standard)
    - For monthly data: λ = 129600
    - For daily data: λ = 6250000 (approx 1600 * (365/4)^4)
    """
    if lamb is None:
        lamb = 6250000  # Optimized for daily financial data
    
    series_clean = series.replace(0, np.nan).ffill().bfill()
    cycle_component, trend_component = hpfilter(series_clean, lamb=lamb)
    
    return cycle_component, trend_component


# =============================================================================
# STEP 2: CYCLE DETECTION - Goertzel Algorithm
# =============================================================================

def goertzel_single(data, period):
    """
    Goertzel DFT for a single frequency/period.
    Returns amplitude and phase for spectrum analysis.
    """
    N = len(data)
    
    if N < period:
        return 0.0, 0.0
    
    k = N / period
    omega = 2.0 * np.pi * k / N
    coeff = 2.0 * np.cos(omega)
    
    s0, s1, s2 = 0.0, 0.0, 0.0
    for sample in data:
        s0 = sample + coeff * s1 - s2
        s2, s1 = s1, s0
    
    real = s1 - s2 * np.cos(omega)
    imag = s2 * np.sin(omega)
    
    amplitude = (2.0 * np.sqrt(real**2 + imag**2)) / N
    phase = np.arctan2(imag, real)
    
    return amplitude, phase


def fit_sine_wave(data, period):
    """
    CRITICAL FIX: Use least-squares fitting to find amplitude and phase
    that BEST matches the actual data.
    
    This ensures the reconstructed wave aligns with price movements.
    
    Model: y = A * cos(ωt + φ) + C
    
    Using linear regression on:
    y = a*cos(ωt) + b*sin(ωt) + c
    
    Where: A = sqrt(a² + b²), φ = atan2(-b, a)
    """
    N = len(data)
    t = np.arange(N)
    omega = 2.0 * np.pi / period
    
    # Create design matrix for linear regression
    # y = a*cos(ωt) + b*sin(ωt) + c
    cos_component = np.cos(omega * t)
    sin_component = np.sin(omega * t)
    ones = np.ones(N)
    
    # Stack as columns
    X = np.column_stack([cos_component, sin_component, ones])
    
    # Solve least squares: X @ coeffs = data
    try:
        coeffs, residuals, rank, s = np.linalg.lstsq(X, data, rcond=None)
        a, b, c = coeffs
    except:
        return 0.0, 0.0, 0.0
    
    # Convert to amplitude and phase
    amplitude = np.sqrt(a**2 + b**2)
    # Phase such that A*cos(ωt + φ) = a*cos(ωt) + b*sin(ωt)
    # cos(ωt + φ) = cos(ωt)cos(φ) - sin(ωt)sin(φ)
    # So: a = A*cos(φ), b = -A*sin(φ)
    phase = np.arctan2(-b, a)
    
    return amplitude, phase, c


def scan_spectrum_goertzel(data, min_period=5, max_period=None, step=1):
    """
    Scan the full period spectrum using Goertzel algorithm.
    """
    N = len(data)
    
    if max_period is None:
        max_period = N // 2
    max_period = min(max_period, N // 2)
    
    spectrum = []
    
    for period in range(int(min_period), int(max_period) + 1, step):
        amplitude, _ = goertzel_single(data, period)
        spectrum.append({
            'period': float(period),
            'amplitude': float(amplitude)
        })
    
    if len(spectrum) < 3:
        return spectrum, spectrum
    
    amplitudes = np.array([s['amplitude'] for s in spectrum])
    periods = np.array([s['period'] for s in spectrum])
    
    # Find local maxima
    peaks, _ = signal.find_peaks(amplitudes, height=np.mean(amplitudes) * 0.5)
    
    candidates = []
    for idx in peaks:
        candidates.append({
            'period': float(periods[idx]),
            'amplitude': float(amplitudes[idx])
        })
    
    candidates.sort(key=lambda x: x['amplitude'], reverse=True)
    
    return candidates, spectrum


# =============================================================================
# STEP 3: CYCLE VALIDATION - Bartels Test
# =============================================================================

def bartels_test_fsc(data, period):
    """
    FSC Bartels Test for cycle genuineness with LEAST SQUARES phase fitting.
    """
    N = len(data)
    num_blocks = int(N // period)
    
    if num_blocks < 2:
        amp, phase, _ = fit_sine_wave(data, period)
        return 0.0, amp, phase
    
    block_vectors = []
    block_amps = []
    
    for i in range(num_blocks):
        start = int(i * period)
        end = int(start + period)
        block = data[start:end]
        
        if len(block) < period * 0.8:
            continue
        
        amp, phase, _ = fit_sine_wave(block, period)
        
        if amp > 1e-10:
            block_amps.append(amp)
            block_vectors.append(np.exp(1j * phase))
    
    if len(block_amps) < 2:
        amp, phase, _ = fit_sine_wave(data, period)
        return 0.0, amp, phase
    
    k = len(block_vectors)
    
    vector_sum = np.sum(block_vectors)
    vector_sum_magnitude = np.abs(vector_sum)
    
    R = vector_sum_magnitude / k
    z = k * R * R
    p_value = np.exp(-z)
    genuine_percent = (1.0 - p_value) * 100.0
    genuine_percent = min(genuine_percent, 99.9)
    
    # Get FITTED amplitude and phase (this is the key fix)
    global_amplitude, global_phase, _ = fit_sine_wave(data, period)
    
    return genuine_percent, global_amplitude, global_phase


# =============================================================================
# STEP 4: RANKING - Cycle Strength
# =============================================================================

def calculate_cycle_strength(amplitude, period):
    """FSC Cycle Strength = Amplitude / Length"""
    if period <= 0:
        return 0.0
    return amplitude / period


def filter_clusters(cycles, tolerance=0.15):
    """Remove cycles too close in period."""
    if not cycles:
        return []
    
    cycles_sorted = sorted(cycles, key=lambda x: x.get('strength', 0), reverse=True)
    final = []
    
    for c in cycles_sorted:
        is_cluster = False
        p1 = c['period']
        for existing in final:
            p2 = existing['period']
            if abs(p1 - p2) / max(p1, p2) < tolerance:
                is_cluster = True
                break
        if not is_cluster:
            final.append(c)
    
    return final


# =============================================================================
# MAIN ANALYSIS FUNCTION
# =============================================================================

def perform_cycle_analysis(df, close_col='Close', max_period_input=None, top_n=50):
    """
    FSC Cycle Scanner - Main Analysis Pipeline
    
    Key improvements:
    - Uses least-squares fitting for accurate amplitude/phase
    - Composite wave aligns with actual price movements
    """
    if df is None or df.empty:
        return {'error': 'No data provided'}
    
    # Column Setup
    if close_col not in df.columns:
        cols = [c for c in df.columns if 'close' in c.lower()]
        close_col = cols[0] if cols else df.columns[-1]
    
    series = df[close_col].copy()
    dates = pd.to_datetime(df['Date'] if 'Date' in df.columns else df.index)
    
    N = len(series)
    if N < 20:
        return {'error': 'Insufficient data (need at least 20 bars)'}
    
    # ==========================================================================
    # STEP 1: HP FILTER DETRENDING
    # ==========================================================================
    try:
        cycle_component, trend_component = hp_detrend(series)
        data_detrended = cycle_component.values
    except Exception as e:
        print(f"HP filter error, falling back to simple detrend: {e}")
        x = np.arange(N)
        slope, intercept, _, _, _ = stats.linregress(x, series)
        trend_line = slope * x + intercept
        data_detrended = (series - trend_line).values
        trend_component = pd.Series(trend_line, index=series.index)
    
    # ==========================================================================
    # STEP 2: GOERTZEL SPECTRUM ANALYSIS
    # ==========================================================================
    max_period = max_period_input if max_period_input else min(N // 2, 400)
    min_period = 5
    
    candidates, full_spectrum = scan_spectrum_goertzel(
        data_detrended, 
        min_period=min_period, 
        max_period=max_period
    )
    
    # ==========================================================================
    # STEP 3: BARTELS VALIDATION + LEAST SQUARES FITTING
    # ==========================================================================
    verified_cycles = []
    
    for cand in candidates[:100]:
        period = cand['period']
        
        # Bartels test WITH least-squares phase fitting
        genuine_pct, amplitude, phase = bartels_test_fsc(data_detrended, period)
        
        if genuine_pct >= 49.0 and amplitude > 1e-9:
            strength = calculate_cycle_strength(amplitude, period)
            
            verified_cycles.append({
                'period': period,
                'amplitude': amplitude,
                'phase': phase,
                'bartels_score': genuine_pct,
                'strength': strength
            })
    
    # ==========================================================================
    # STEP 4: RANKING BY CYCLE STRENGTH
    # ==========================================================================
    final_cycles = filter_clusters(verified_cycles, tolerance=0.15)
    final_cycles.sort(key=lambda x: x['strength'], reverse=True)
    top_cycles = final_cycles[:top_n]
    
    # ==========================================================================
    # COMPOSITE WAVE CONSTRUCTION (Using proper least-squares phases)
    # ==========================================================================
    forecast_days = 200
    total_len = N + forecast_days
    t_full = np.arange(total_len)
    
    composite_wave = np.zeros(total_len)
    
    # Use top cycles for composite
    active_cycles_count = min(len(top_cycles), 10)
    
    for i in range(active_cycles_count):
        c = top_cycles[i]
        omega = 2.0 * np.pi / c['period']
        phase = c['phase']
        amp = c['amplitude']
        
        # CORRECT reconstruction: A * cos(ωt + φ)
        # The phase from fit_sine_wave is already in the correct form
        wave = amp * np.cos(omega * t_full + phase)
        composite_wave += wave
    
    # ==========================================================================
    # PREPARE UI OUTPUT
    # ==========================================================================
    colors = ['#22c55e', '#f97316', '#3b82f6', '#ef4444', '#eab308', 
              '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e']
    
    for i, c in enumerate(top_cycles):
        c['id'] = i + 1
        c['color'] = colors[i % len(colors)]
        c['active'] = i < 5
        c['length'] = round(c['period'], 1)
        c['bartels'] = round(c['bartels_score'], 1)
        c['strg'] = round(c['strength'], 3)
        c['amp'] = round(c['amplitude'], 2)
        
        # Calculate next peak/trough using the CORRECT phase
        omega = 2.0 * np.pi / c['period']
        current_t = N - 1
        
        # Current phase position
        current_phase_pos = (omega * current_t + c['phase']) % (2 * np.pi)
        
        # Distance to next peak (where cos = 1, phase_pos = 0 or 2π)
        if current_phase_pos <= 0:
            bars_to_peak = -current_phase_pos / omega
        else:
            bars_to_peak = (2 * np.pi - current_phase_pos) / omega
        
        # Distance to next trough (where cos = -1, phase_pos = π)
        if current_phase_pos <= np.pi:
            bars_to_trough = (np.pi - current_phase_pos) / omega
        else:
            bars_to_trough = (3 * np.pi - current_phase_pos) / omega
        
        try:
            date_peak = dates.iloc[-1] + pd.Timedelta(days=int(bars_to_peak))
            date_trough = dates.iloc[-1] + pd.Timedelta(days=int(bars_to_trough))
            c['next_peak'] = int(bars_to_peak)
            c['next_trough'] = int(bars_to_trough)
            c['date_peak'] = date_peak.strftime('%Y-%m-%d')
            c['date_trough'] = date_trough.strftime('%Y-%m-%d')
        except:
            c['next_peak'] = 0
            c['next_trough'] = 0
            c['date_peak'] = 'N/A'
            c['date_trough'] = 'N/A'
    
    # Chart Data - Scale composite to match detrended price movements
    chart_output = []
    
    # The composite is already in the same scale as detrended data
    # For visualization, we add it to the trend to show on price scale
    # OR we can show it on a separate y-axis (current approach)
    
    # Historical data
    for i in range(N):
        chart_output.append({
            'date': dates.iloc[i].strftime('%Y-%m-%d'),
            'price': float(series.iloc[i]),
            'close': float(series.iloc[i]),
            'composite': float(composite_wave[i]),
            'trend': float(trend_component.iloc[i]),
            'detrended': float(data_detrended[i])  # Add detrended for debugging
        })
    
    # Forecast data
    last_date = dates.iloc[-1]
    last_trend = float(trend_component.iloc[-1])
    
    for i in range(forecast_days):
        t = N + i
        next_date = last_date + pd.Timedelta(days=i + 1)
        chart_output.append({
            'date': next_date.strftime('%Y-%m-%d'),
            'price': None,
            'close': None,
            'composite': float(composite_wave[t]),
            'trend': last_trend,
            'detrended': None
        })
    
    spectrum_ui = [{'period': float(c['period']), 'power': float(c['strength'])} for c in top_cycles]
    
    # Sanitize
    def clean_obj(obj):
        if isinstance(obj, (np.integer, int)):
            return int(obj)
        elif isinstance(obj, (np.floating, float)):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: clean_obj(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_obj(i) for i in obj]
        return obj
    
    result = {
        'cycles': top_cycles,
        'spectrum': spectrum_ui,
        'spectrum_full': full_spectrum,
        'chart_data': chart_output,
        'info': 'FSC: HP Detrend + Goertzel + Least-Squares Phase + Bartels + Strength',
        'data_length': N
    }
    
    return clean_obj(result)
