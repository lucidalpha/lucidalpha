import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { Search, Play, AlertCircle } from 'lucide-react';

const HMMAnalysis = () => {
    const [ticker, setTicker] = useState('SPY');
    const [startDate, setStartDate] = useState('2017-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [nStates, setNStates] = useState(2);
    const [threshold, setThreshold] = useState(0.7);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const runAnalysis = async () => {
        setLoading(true);
        setError('');
        setData(null);

        try {
            const response = await axios.post('http://localhost:8000/hmm/analyze', {
                ticker,
                start_date: startDate,
                end_date: endDate,
                n_states: parseInt(nStates),
                threshold: parseFloat(threshold)
            });

            if (response.data.error) {
                setError(response.data.error);
            } else {
                setData(response.data);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Analysis failed. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    // Process data for charts
    const getUpdateCharts = () => {
        if (!data) return null;

        const df = data.chart_data;

        // Group contiguous states for background shapes
        const shapes = [];
        let currentStart = df[0].Date;
        let currentState = df[0].State;
        let currentColor = df[0].Color;

        for (let i = 1; i < df.length; i++) {
            if (df[i].State !== currentState) {
                // End block
                shapes.push({
                    type: 'rect',
                    xref: 'x', yref: 'paper',
                    x0: currentStart, x1: df[i].Date,
                    y0: 0, y1: 1,
                    fillcolor: currentColor,
                    opacity: 0.15,
                    line: { width: 0 },
                    layer: "below"
                });
                currentStart = df[i].Date;
                currentState = df[i].State;
                currentColor = df[i].Color;
            }
        }
        // Last block
        shapes.push({
            type: 'rect',
            xref: 'x', yref: 'paper',
            x0: currentStart, x1: df[df.length - 1].Date,
            y0: 0, y1: 1,
            fillcolor: currentColor,
            opacity: 0.15,
            line: { width: 0 },
            layer: "below"
        });

        const dates = df.map(d => d.Date);
        const close = df.map(d => d.Close);
        const returns = df.map(d => d.Returns);
        const prob = df.map(d => d.Bull_Prob);
        const bhEquity = df.map(d => d.BH_Equity);
        const rfEquity = df.map(d => d.RF_Equity);

        return { shapes, dates, close, returns, prob, bhEquity, rfEquity };
    };

    const chartData = getUpdateCharts();

    return (
        <div className="p-6 bg-[#0E1117] min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="text-blue-500">🛡️</span>
                HMM Regime Analyzer
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Controls Panel */}
                <div className="lg:col-span-1 bg-[#161b22] p-5 rounded-xl h-fit border border-gray-800">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">Configuration</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Ticker Symbol</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={ticker}
                                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 pl-9 text-white focus:border-blue-500 outline-none"
                                />
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">HMM States</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={nStates === 2}
                                        onChange={() => setNStates(2)}
                                        className="accent-blue-500"
                                    /> 2
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={nStates === 3}
                                        onChange={() => setNStates(3)}
                                        className="accent-blue-500"
                                    /> 3
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Regime Threshold: {threshold * 100}%</label>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={runAnalysis}
                            disabled={loading}
                            className={`w-full py-2 rounded font-semibold flex items-center justify-center gap-2 mt-4 
                ${loading ? 'bg-blue-800 text-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            {loading ? 'Running Analysis...' : <><Play className="w-4 h-4" /> Run Analysis</>}
                        </button>

                        {error && (
                            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm flex gap-2 items-start">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-3 space-y-6">
                    {!data && !loading && (
                        <div className="h-96 flex items-center justify-center text-gray-500 border border-gray-800 rounded-xl bg-[#161b22]">
                            Select parameters and click Run Analysis
                        </div>
                    )}

                    {data && (
                        <>
                            {/* Metrics Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MetricCard label="Total Return (Strat)" value={(data.metrics['Regime Filter'].total_return * 100).toFixed(2) + '%'} sub={(data.metrics['Buy & Hold'].total_return * 100).toFixed(2) + '% BH'} />
                                <MetricCard label="Sharpe Ratio" value={data.metrics['Regime Filter'].sharpe_ratio.toFixed(2)} sub={data.metrics['Buy & Hold'].sharpe_ratio.toFixed(2) + ' BH'} />
                                <MetricCard label="Max Drawdown" value={(data.metrics['Regime Filter'].max_drawdown * 100).toFixed(2) + '%'} sub={(data.metrics['Buy & Hold'].max_drawdown * 100).toFixed(2) + '% BH'} />
                                <MetricCard label="Final Equity" value={'€' + Math.round(data.metrics['Regime Filter'].final_equity).toLocaleString()} sub={'€' + Math.round(data.metrics['Buy & Hold'].final_equity).toLocaleString()} />
                            </div>

                            {/* Chart 1: Price and Regimes */}
                            <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800">
                                <h3 className="text-lg font-semibold mb-2 text-gray-300">Market Regimes & Price</h3>
                                <Plot
                                    data={[
                                        { x: chartData.dates, y: chartData.close, type: 'scatter', mode: 'lines', name: 'Price', line: { color: '#ffffff', width: 1 } },
                                    ]}
                                    layout={{
                                        autosize: true,
                                        height: 400,
                                        margin: { l: 40, r: 20, t: 30, b: 30 },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                        font: { color: '#9ca3af' },
                                        xaxis: { gridcolor: '#374151' },
                                        yaxis: { gridcolor: '#374151' },
                                        shapes: chartData.shapes,
                                        showlegend: true,
                                        legend: { orientation: 'h', y: 1.05 }
                                    }}
                                    useResizeHandler={true}
                                    style={{ width: '100%', height: '100%' }}
                                    config={{ responsive: true, displayModeBar: false }}
                                />
                            </div>

                            {/* Chart 2: Bull Probability */}
                            <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800">
                                <h3 className="text-lg font-semibold mb-2 text-gray-300">Bull Regime Probability</h3>
                                <Plot
                                    data={[
                                        { x: chartData.dates, y: chartData.prob, type: 'scatter', mode: 'lines', name: 'Bull Prob', line: { color: '#00e676', width: 1 }, fill: 'tozeroy' },
                                    ]}
                                    layout={{
                                        autosize: true,
                                        height: 250,
                                        margin: { l: 40, r: 20, t: 30, b: 30 },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                        font: { color: '#9ca3af' },
                                        xaxis: { gridcolor: '#374151' },
                                        yaxis: { gridcolor: '#374151', range: [0, 1.05] },
                                        shapes: [{
                                            type: 'line', x0: chartData.dates[0], x1: chartData.dates[chartData.dates.length - 1],
                                            y0: threshold, y1: threshold,
                                            line: { color: 'orange', width: 2, dash: 'dash' }
                                        }],
                                        showlegend: false
                                    }}
                                    useResizeHandler={true}
                                    style={{ width: '100%', height: '100%' }}
                                    config={{ responsive: true, displayModeBar: false }}
                                />
                            </div>

                            {/* Chart 3: Equity Curves */}
                            <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800">
                                <h3 className="text-lg font-semibold mb-2 text-gray-300">Equity Growth (Start €100k)</h3>
                                <Plot
                                    data={[
                                        { x: chartData.dates, y: chartData.bhEquity, type: 'scatter', mode: 'lines', name: 'Buy & Hold', line: { color: '#3b82f6', width: 2 } },
                                        { x: chartData.dates, y: chartData.rfEquity, type: 'scatter', mode: 'lines', name: 'Regime Filter', line: { color: '#fbbf24', width: 2 } },
                                    ]}
                                    layout={{
                                        autosize: true,
                                        height: 350,
                                        margin: { l: 40, r: 20, t: 30, b: 30 },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                        font: { color: '#9ca3af' },
                                        xaxis: { gridcolor: '#374151' },
                                        yaxis: { gridcolor: '#374151' },
                                        showlegend: true,
                                        legend: { orientation: 'h', y: 1.05 }
                                    }}
                                    useResizeHandler={true}
                                    style={{ width: '100%', height: '100%' }}
                                    config={{ responsive: true, displayModeBar: false }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, sub }) => (
    <div className="bg-[#1d232e] p-4 rounded-lg border border-gray-800">
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
);

export default HMMAnalysis;
