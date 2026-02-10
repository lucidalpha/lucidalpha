import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import datetime

import data_fetcher
import hmm_model
import backtester

# Page Config
st.set_page_config(
    page_title="HMM Market Regime Analyzer",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Dark Theme
st.markdown("""
<style>
    .reportview-container {
        background: #131722;
        color: white;
    }
    .stButton>button {
        color: white;
        background-color: #2962FF;
        border-radius: 5px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🛡️ Hidden Markov Model (HMM) Trading Regime Analyzer")

# --- Sidebar ---
st.sidebar.header("Configuration")
ticker = st.sidebar.text_input("Ticker Symbol", value="SPY")

today = datetime.date.today()
default_start = today - datetime.timedelta(days=365*8)
start_date = st.sidebar.date_input("Start Date", value=default_start)
end_date = st.sidebar.date_input("End Date", value=today)

if start_date >= end_date:
    st.sidebar.error("Start date must be before end date")
    st.stop()

st.sidebar.subheader("HMM Parameters")
n_states = st.sidebar.radio("Number of States", options=[2, 3], index=0)

regime_threshold = st.sidebar.slider("Regime Confidence Threshold", min_value=0.0, max_value=1.0, value=0.7, step=0.05)

run_btn = st.sidebar.button("Run Analysis")

# --- Main Analysis ---

if run_btn:
    with st.spinner("Fetching Data..."):
        df = data_fetcher.fetch_data(ticker, start_date, end_date)
    
    if df is None or len(df) < 500: # Min 2 years approx
        st.error("Insufficient data fetched. Please checkticker or extend date range (min 2 years).")
    else:
        # Features
        df = data_fetcher.prepare_features(df)
        
        # Model
        with st.spinner("Training HMM Model..."):
            model = hmm_model.HMMRegimeModel(n_components=n_states)
            try:
                model_stats = model.train(df)
                df, probs = model.predict(df)
            except Exception as e:
                st.error(f"Model Training Failed: {e}")
                st.stop()
        
        # Backtest
        tester = backtester.Backtester()
        res_df, metrics = tester.run(df, threshold=regime_threshold)
        
        # --- Dashboard Layout ---
        
        # summary_cols = st.columns(4)
        # summary_cols[0].metric("Regime", res_df['Regime'].iloc[-1], f"{probs[-1, model.model.predict(df[['Returns', 'Volatility']].values)[-1]]:.2%}")
        
        # Panel 1: Price Chart with Regimes
        st.subheader("1. Market Regimes & Price Action")
        
        # Create contiguous blocks for background coloring
        res_df = res_df.reset_index()
        res_df['group'] = (res_df['State'] != res_df['State'].shift()).cumsum()
        blocks = res_df.groupby('group').agg({
            'Date': ['first', 'last'], # yfinance usually names index 'Date' or 'Datetime'
            'State': 'first',
            'Color': 'first'
        })
        blocks.columns = ['start', 'end', 'state', 'color']
        
        # Restore index for plotting if needed, or just use columns
        res_df = res_df.set_index('Date')
        
        fig1 = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.03, row_heights=[0.7, 0.3])
        
        # Price Line
        fig1.add_trace(go.Scatter(x=res_df.index, y=res_df['Close'], name='Price', line=dict(color='white', width=1)), row=1, col=1)
        
        # Returns Bars
        fig1.add_trace(go.Bar(x=res_df.index, y=res_df['Returns'], name='Log Returns', marker_color='lightblue'), row=2, col=1)

        # Add Background Shapes for Regimes
        shapes = []
        for i, row in blocks.iterrows():
            shapes.append(dict(
                type="rect",
                xref="x", yref="paper",
                x0=row['start'], x1=row['end'],
                y0=0, y1=1,
                fillcolor=row['color'],
                opacity=0.2,
                layer="below",
                line_width=0,
            ))
        
        fig1.update_layout(shapes=shapes, template="plotly_dark", height=600, margin=dict(l=0, r=0, t=30, b=0))
        st.plotly_chart(fig1, use_container_width=True)
        
        # Panel 2: Regime Probability
        st.subheader("2. Bull Regime Probability")
        
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(
            x=res_df.index, 
            y=res_df['Bull_Prob'], 
            name='Bull Probability',
            line=dict(color='#00E676', width=1),
            fill='tozeroy',
            fillcolor='rgba(0, 230, 118, 0.1)'
        ))
        
        # Threshold Line
        fig2.add_hline(y=regime_threshold, line_dash="dash", line_color="orange", annotation_text="Threshold")
        
        # Color Zones (Simulated by simple background or colored areas?)
        # Let's just keep the line clean.
        fig2.update_layout(template="plotly_dark", height=300, yaxis_range=[0, 1.05])
        st.plotly_chart(fig2, use_container_width=True)
        
        # Panel 3: Equity Curves
        st.subheader("3. Strategy Performance Comparison")
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            fig3 = go.Figure()
            fig3.add_trace(go.Scatter(x=res_df.index, y=res_df['BH_Equity'], name='Buy & Hold', line=dict(color='#2962FF')))
            fig3.add_trace(go.Scatter(x=res_df.index, y=res_df['RF_Equity'], name='Regime Filter', line=dict(color='gray')))
            fig3.update_layout(template="plotly_dark", height=400, title="Equity Growth (start 100k)")
            st.plotly_chart(fig3, use_container_width=True)
            
        with col2:
            st.markdown("### Metrics")
            metric_df = pd.DataFrame(metrics).T
            
            # Format
            metric_df['Total Return'] = metric_df['Total Return'].apply(lambda x: f"{x:.2%}")
            metric_df['Sharpe Ratio'] = metric_df['Sharpe Ratio'].apply(lambda x: f"{x:.2f}")
            metric_df['Max Drawdown'] = metric_df['Max Drawdown'].apply(lambda x: f"{x:.2%}")
            metric_df['Final Equity'] = metric_df['Final Equity'].apply(lambda x: f"€{x:,.0f}")
            
            st.table(metric_df)
            
        # Model Parameters
        with st.expander("Show Model Parameters"):
            st.write("State Statistics:")
            st.write(pd.DataFrame(model_stats))
            
            st.write("Transition Matrix:")
            st.write(model.model.transmat_)
            
else:
    st.info("Please configure settings and click 'Run Analysis' to start.")

