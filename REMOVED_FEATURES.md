# Removed Features Documentation
Date: 2026-01-26

The following features and their corresponding backend logic have been removed from the application as per user request.

## 1. Valuation
- **Frontend**: Removed route `/valuation`.
- **Backend**: 
  - Removed logic related to `calculate_valuation` and `calculate_valuation_from_df` in `backend/analysis.py`.
  - Removed endpoints related to valuation upload and analysis in `backend/main.py`.

## 2. Trading (Asset Overview)
- **Frontend**: Removed route `/trading` (`AssetList`).
- **Backend**:
  - Removed `analyze_all_assets` endpoint in `backend/main.py`.
  - This feature used `backend/seasonality_cache.json` for caching results.

## 3. Saisonalität (Seasonality Hub)
- **Frontend**: Removed route `/seasonality` (`SeasonalityHub`).
- **Backend**:
  - This view largely shared logic with "Aktien" (`analyze_seasonality`), so the core logic in `analysis.py` is RETAINED for the "Aktien" tab.
  - Specific endpoints for the hub overview might be removed if unique.

## 4. Cycles
- **Frontend**: Removed route `/cycles` (`Cycles`).
- **Backend**:
  - Removed `backend/cycle_analysis.py`.
  - Removed `/cycles/analyze` endpoint in `backend/main.py`.

## 5. Regimes (HMM Analysis)
- **Frontend**: Removed route `/regimes` (`HMMAnalysis`).
- **Backend**:
  - Removed `backend/hmm_service.py`.
  - Removed `/hmm/analyze` endpoint in `backend/main.py`.

## 6. QNews (Automation & AI)
- **Frontend**: Removed route `/qnews` (`QNews`).
- **Backend**:
  - Removed `backend/automation.py`.
  - Removed `backend/daily_news_index.py`.
  - Removed `backend/ai_service.py`.
  - Removed background task scheduler and startup events in `backend/main.py`.

- **Aktien**: Uses `fetch_ticker_data`, `analyze_seasonality`, `calculate_seasonal_trend` from `analysis.py`.
- **Rechner**: Uses `calculators.py`.
- **Terminkurven**: Uses `term_structure.py` and `futures_config.py`.

## 7. Seasonality in Asset Analysis (Update 2026-01-30)
- **Frontend**: Removed Seasonality Section (Table & Chart) from `AssetAnalysisWindow.jsx`.
- **Reason**: User requested "Zen" aesthetic and removal of seasonality features from this view.
