
import React, { useState } from 'react';
import { apiUrl } from '../config/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const Calculators = () => {
    // Risk Analysis State
    const [riskParams, setRiskParams] = useState({
        start_capital: 100000,
        win_rate: 60,
        risk_reward: 2,
        risk_per_trade: 2,
        num_trades: 200,
        drawdown_target: 10
    });
    const [riskResult, setRiskResult] = useState(null);
    const [riskLoading, setRiskLoading] = useState(false);

    // Monte Carlo State
    const [mcParams, setMcParams] = useState({
        start_capital: 100000,
        win_rate: 60,
        risk_reward: 2,
        risk_per_trade: 1,
        num_trades: 250,
        num_simulations: 200
    });
    const [mcResult, setMcResult] = useState(null);
    const [mcLoading, setMcLoading] = useState(false);

    const handleRiskChange = (e) => {
        setRiskParams({ ...riskParams, [e.target.name]: parseFloat(e.target.value) });
    };

    const handleMcChange = (e) => {
        setMcParams({ ...mcParams, [e.target.name]: parseFloat(e.target.value) });
    };

    const runRiskAnalysis = async () => {
        setRiskLoading(true);
        try {
            const response = await fetch(apiUrl('/calculators/risk_analysis'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(riskParams)
            });
            const data = await response.json();
            setRiskResult(data);
        } catch (error) {
            console.error("Error:", error);
        }
        setRiskLoading(false);
    };

    const runMonteCarlo = async () => {
        setMcLoading(true);
        try {
            const response = await fetch(apiUrl('/calculators/monte_carlo'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mcParams)
            });
            const data = await response.json();
            setMcResult(data);
        } catch (error) {
            console.error("Error:", error);
        }
        setMcLoading(false);
    };

    // Prepare chart data for MC
    const getChartData = () => {
        if (!mcResult) return [];
        // Flatten for Recharts: [{ trade: 1, worst: 100, median: 105, best: 120 }, ...]

        // Use length of one of the curves
        const len = mcResult.median.curve.length;
        const data = [];

        for (let i = 0; i < len; i++) {
            data.push({
                trade: i,
                worst: mcResult.worst.curve[i],
                median: mcResult.median.curve[i],
                best: mcResult.best.curve[i]
            });
        }
        return data;
    };

    const chartData = getChartData();

    // Helper formatting
    const fmtCurrency = (val) => {
        return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
    };
    const fmtPct = (val) => {
        return val.toFixed(2) + "%";
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-[#00B5D8]">Quantitative Calculators</h1>

            <div className="grid grid-cols-1 gap-12 max-w-7xl mx-auto">
                {/* Risk Analysis Section */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-lg">
                    <h2 className="text-lg font-bold text-yellow-500 mb-6 uppercase tracking-wider border-b border-gray-800 pb-2">{">"} RISIKO-ANALYSE</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Inputs */}
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Startkapital (€)</label>
                                    <input
                                        type="number" name="start_capital" value={riskParams.start_capital} onChange={handleRiskChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Drawdown-Ziel (%)</label>
                                    <input
                                        type="number" name="drawdown_target" value={riskParams.drawdown_target} onChange={handleRiskChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Win Rate (%)</label>
                                    <input
                                        type="number" name="win_rate" value={riskParams.win_rate} onChange={handleRiskChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">CRV (R:R)</label>
                                    <input
                                        type="number" name="risk_reward" value={riskParams.risk_reward} onChange={handleRiskChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Risk per Trade (%)</label>
                                    <input
                                        type="number" name="risk_per_trade" value={riskParams.risk_per_trade} onChange={handleRiskChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Anzahl Trades</label>
                                    <input
                                        type="number" name="num_trades" value={riskParams.num_trades} onChange={handleRiskChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={runRiskAnalysis}
                                disabled={riskLoading}
                                className="w-full border border-[#00B5D8] text-[#00B5D8] hover:bg-[#00B5D8] hover:text-black font-bold py-3 rounded mt-4 transition-all uppercase tracking-widest text-sm"
                            >
                                {riskLoading ? "Simuliere..." : "Simulation starten"}
                            </button>
                        </div>

                        {/* Visual Results */}
                        <div className="flex flex-col items-center justify-center space-y-10 py-4">
                            {riskResult ? (
                                <>
                                    <div className="text-center group">
                                        <div className="text-6xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">
                                            {riskResult.risk_of_ruin !== undefined ? riskResult.risk_of_ruin.toFixed(2) : "0.00"}%
                                        </div>
                                        <div className="text-[#00B5D8] text-sm font-bold uppercase tracking-widest">
                                            Risiko des Totalverlusts (RoR)
                                        </div>
                                    </div>

                                    <div className="text-center group">
                                        <div className="text-6xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                                            {riskResult.probability_of_drawdown.toFixed(2)}%
                                        </div>
                                        <div className="text-[#00B5D8] text-sm font-bold uppercase tracking-widest">
                                            Wahrscheinlichkeit für {riskParams.drawdown_target}% Drawdown
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-600 text-center text-sm font-mono">
                                    [Waiting for Input]
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monte Carlo Section */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-lg">
                    <h2 className="text-lg font-bold text-yellow-500 mb-6 uppercase tracking-wider border-b border-gray-800 pb-2">{">"} MONTE-CARLO-SIMULATION</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Inputs */}
                        <div className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Gewinnrate (%)</label>
                                    <input
                                        type="number" name="win_rate" value={mcParams.win_rate} onChange={handleMcChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Risiko-Ertrags-Verhältnis (CRV)</label>
                                    <input
                                        type="number" name="risk_reward" value={mcParams.risk_reward} onChange={handleMcChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Risiko pro Trade (%)</label>
                                    <input
                                        type="number" name="risk_per_trade" value={mcParams.risk_per_trade} onChange={handleMcChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Anzahl der Trades</label>
                                    <input
                                        type="number" name="num_trades" value={mcParams.num_trades} onChange={handleMcChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Anfangskapital (€)</label>
                                    <input
                                        type="number" name="start_capital" value={mcParams.start_capital} onChange={handleMcChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00B5D8] mb-1 uppercase">Anzahl der Simulationen</label>
                                    <input
                                        type="number" name="num_simulations" value={mcParams.num_simulations} onChange={handleMcChange}
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-[#00B5D8] outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={runMonteCarlo}
                                disabled={mcLoading}
                                className="w-full border border-[#00B5D8] text-[#00B5D8] hover:bg-[#00B5D8] hover:text-black font-bold py-3 rounded mt-[130px] transition-all uppercase tracking-widest text-sm"
                            >
                                {mcLoading ? "Simuliere..." : "Neue Simulation starten"}
                            </button>
                        </div>

                        {/* Results Right C olumn */}
                        <div className="flex flex-col h-full">
                            {mcResult ? (
                                <>
                                    {/* Table */}
                                    <div className="mb-8 bg-black rounded overflow-hidden border border-gray-800">
                                        <div className="grid grid-cols-4 bg-gray-900/50 text-xs text-[#00B5D8] font-bold uppercase tracking-wider py-3 px-4 border-b border-gray-800">
                                            <div>Metric</div>
                                            <div className="text-right text-red-400">Schlechtester Fall (5.)</div>
                                            <div className="text-right text-[#00B5D8]">Median (50.)</div>
                                            <div className="text-right text-green-400">Bester Fall (95.)</div>
                                        </div>

                                        {/* Rows */}
                                        <div className="grid grid-cols-4 text-sm py-3 px-4 border-b border-gray-800 hover:bg-white/5 transition-colors">
                                            <div className="font-bold text-gray-300">Endkapital:</div>
                                            <div className="text-right text-white font-mono">{fmtCurrency(mcResult.worst.end_capital)}</div>
                                            <div className="text-right text-white font-mono">{fmtCurrency(mcResult.median.end_capital)}</div>
                                            <div className="text-right text-white font-mono">{fmtCurrency(mcResult.best.end_capital)}</div>
                                        </div>
                                        <div className="grid grid-cols-4 text-sm py-3 px-4 border-b border-gray-800 hover:bg-white/5 transition-colors">
                                            <div className="font-bold text-gray-300">Performance (%):</div>
                                            <div className="text-right text-red-500 font-bold font-mono">{fmtPct(mcResult.worst.performance)}</div>
                                            <div className="text-right text-green-400 font-bold font-mono">{fmtPct(mcResult.median.performance)}</div>
                                            <div className="text-right text-green-400 font-bold font-mono">{fmtPct(mcResult.best.performance)}</div>
                                        </div>
                                        <div className="grid grid-cols-4 text-sm py-3 px-4 hover:bg-white/5 transition-colors">
                                            <div className="font-bold text-gray-300">Max. Drawdown (%):</div>
                                            <div className="text-right text-red-500 font-bold font-mono">{fmtPct(mcResult.worst.max_drawdown)}</div>
                                            <div className="text-right text-red-400 font-bold font-mono">{fmtPct(mcResult.median.max_drawdown)}</div>
                                            <div className="text-right text-red-300 font-bold font-mono">{fmtPct(mcResult.best.max_drawdown)}</div>
                                        </div>
                                    </div>

                                    {/* Chart */}
                                    <div className="flex-1 bg-black/50 border border-gray-800 rounded p-4 relative min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                                <XAxis
                                                    dataKey="trade"
                                                    stroke="#555"
                                                    tick={{ fill: '#666', fontSize: 10 }}
                                                    label={{ value: 'Anzahl der Trades', position: 'insideBottom', offset: -5, fill: '#666', fontSize: 12 }}
                                                />
                                                <YAxis
                                                    domain={['auto', 'auto']}
                                                    stroke="#555"
                                                    tick={{ fill: '#666', fontSize: 10 }}
                                                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px' }}
                                                    formatter={(value, name) => {
                                                        const color = name === 'worst' ? '#ef4444' : name === 'median' ? '#facc15' : '#4ade80';
                                                        return [<span style={{ color }}>{fmtCurrency(value)}</span>, name];
                                                    }}
                                                    labelStyle={{ color: '#888' }}
                                                />
                                                <Line
                                                    name="best"
                                                    type="monotone"
                                                    dataKey="best"
                                                    stroke="#4ade80"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    animationDuration={500}
                                                />
                                                <Line
                                                    name="median"
                                                    type="monotone"
                                                    dataKey="median"
                                                    stroke="#facc15"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    animationDuration={500}
                                                />
                                                <Line
                                                    name="worst"
                                                    type="monotone"
                                                    dataKey="worst"
                                                    stroke="#ef4444"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    animationDuration={500}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500 font-mono border border-gray-800 rounded bg-black h-full">
                                    [Ergebnisse werden hier angezeigt]
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calculators;
