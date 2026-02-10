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

    const getChartData = () => {
        if (!mcResult) return [];
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

    const fmtCurrency = (val) => {
        return val.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
    };
    const fmtPct = (val) => {
        return val.toFixed(2) + "%";
    };

    const InputField = ({ label, name, value, onChange, type = "number" }) => (
        <div className="flex flex-col space-y-2">
            <label className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase font-medium">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-white focus:border-[#d4af37]/50 focus:bg-white/[0.05] outline-none transition-all duration-500 text-sm font-light tracking-wide"
            />
        </div>
    );

    return (
        <div className="bg-[#050505] min-h-screen pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-6 sm:px-10">

                {/* Header Section */}
                <div className="flex flex-col items-center mb-24 text-center">
                    <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-4 font-medium">Quantitative Analysis</p>
                    <h1 className="text-4xl md:text-6xl font-serif italic text-white mb-8">Wahrscheinlichkeiten.</h1>
                    <div className="w-16 h-[1px] bg-white/[0.1] mb-8"></div>
                    <p className="max-w-xl text-neutral-400 font-light text-sm tracking-wide leading-relaxed">
                        Präzise Risikokalkulation und Simulationen auf Basis Ihrer Handelsstrategie.
                        Visualisieren Sie Pfad-Abhängigkeiten und Ruin-Wahrscheinlichkeiten.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-24">

                    {/* Risk Analysis Section */}
                    <div className="animate-fade-in">
                        <div className="relative p-12 rounded-[3rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-3xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent"></div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                <div className="space-y-12">
                                    <div>
                                        <h2 className="text-2xl font-serif italic text-white mb-2">Risiko Analyse</h2>
                                        <p className="text-xs text-neutral-500 tracking-wide font-light">Berechnen Sie das Risiko des Totalverlusts (Risk of Ruin).</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InputField label="Startkapital (€)" name="start_capital" value={riskParams.start_capital} onChange={handleRiskChange} />
                                        <InputField label="Drawdown-Ziel (%)" name="drawdown_target" value={riskParams.drawdown_target} onChange={handleRiskChange} />
                                        <InputField label="Win Rate (%)" name="win_rate" value={riskParams.win_rate} onChange={handleRiskChange} />
                                        <InputField label="CRV (R:R)" name="risk_reward" value={riskParams.risk_reward} onChange={handleRiskChange} />
                                        <InputField label="Risk per Trade (%)" name="risk_per_trade" value={riskParams.risk_per_trade} onChange={handleRiskChange} />
                                        <InputField label="Anzahl Trades" name="num_trades" value={riskParams.num_trades} onChange={handleRiskChange} />
                                    </div>

                                    <button
                                        onClick={runRiskAnalysis}
                                        disabled={riskLoading}
                                        className="w-full group relative p-5 rounded-2xl border border-[#d4af37]/30 text-white overflow-hidden transition-all duration-700 hover:border-[#d4af37]"
                                    >
                                        <div className="absolute inset-0 bg-[#d4af37]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                                        <span className="relative text-[10px] tracking-[0.4em] uppercase font-bold">
                                            {riskLoading ? 'Berechne...' : 'Simulation starten'}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex flex-col justify-center space-y-16">
                                    {riskResult ? (
                                        <>
                                            <div className="text-center">
                                                <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-6 font-medium">Risk of Ruin</p>
                                                <div className="text-7xl font-serif italic text-white mb-2 tracking-tighter">
                                                    {riskResult.risk_of_ruin?.toFixed(2)}%
                                                </div>
                                                <p className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase">Wahrscheinlichkeit des Kapitalverlusts</p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-6 font-medium">Drawdown Prob.</p>
                                                <div className="text-7xl font-serif italic text-white mb-2 tracking-tighter">
                                                    {riskResult.probability_of_drawdown.toFixed(2)}%
                                                </div>
                                                <p className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase">Wahrscheinlichkeit für {riskParams.drawdown_target}% Drawdown</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-8 opacity-20">
                                            <div className="w-24 h-24 rounded-full border border-[#d4af37]/30 flex items-center justify-center">
                                                <div className="w-12 h-[1px] bg-[#d4af37] rotate-45"></div>
                                            </div>
                                            <p className="text-[10px] tracking-[0.4em] text-white uppercase">Warte auf Eingabe</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monte Carlo Section */}
                    <div className="animate-fade-in delay-200">
                        <div className="relative p-12 rounded-[3rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-3xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent"></div>

                            <div className="grid grid-cols-1 lg:grid-cols-1 gap-20">
                                <div>
                                    <h2 className="text-2xl font-serif italic text-white mb-2">Monte Carlo Simulation</h2>
                                    <p className="text-xs text-neutral-500 tracking-wide font-light mb-12">Simulieren Sie hunderte von Handelskursen, um die Erwartungswerte zu validieren.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
                                        <InputField label="Win Rate (%)" name="win_rate" value={mcParams.win_rate} onChange={handleMcChange} />
                                        <InputField label="CRV" name="risk_reward" value={mcParams.risk_reward} onChange={handleMcChange} />
                                        <InputField label="Risk %" name="risk_per_trade" value={mcParams.risk_per_trade} onChange={handleMcChange} />
                                        <InputField label="Trades" name="num_trades" value={mcParams.num_trades} onChange={handleMcChange} />
                                        <InputField label="Kapital" name="start_capital" value={mcParams.start_capital} onChange={handleMcChange} />
                                        <InputField label="Sims" name="num_simulations" value={mcParams.num_simulations} onChange={handleMcChange} />
                                    </div>

                                    <button
                                        onClick={runMonteCarlo}
                                        disabled={mcLoading}
                                        className="w-full group relative p-5 rounded-2xl border border-[#d4af37]/30 text-white overflow-hidden transition-all duration-700 hover:border-[#d4af37]"
                                    >
                                        <div className="absolute inset-0 bg-[#d4af37]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                                        <span className="relative text-[10px] tracking-[0.4em] uppercase font-bold">
                                            {mcLoading ? 'Simuliere...' : 'Pfade generieren'}
                                        </span>
                                    </button>
                                </div>

                                {mcResult && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-white/[0.05]">
                                        <div className="lg:col-span-1 space-y-6">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                                    <p className="text-[8px] tracking-[0.3em] text-[#d4af37] uppercase mb-3">Erwartetes Endkapital</p>
                                                    <div className="text-2xl font-serif italic text-white">{fmtCurrency(mcResult.median.end_capital)}</div>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                                    <p className="text-[8px] tracking-[0.3em] text-red-400 uppercase mb-3">Worst Case (5%)</p>
                                                    <div className="text-2xl font-serif italic text-white">{fmtCurrency(mcResult.worst.end_capital)}</div>
                                                    <div className="text-[10px] text-red-500 mt-1">{fmtPct(mcResult.worst.performance)} Perf.</div>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                                    <p className="text-[8px] tracking-[0.3em] text-green-400 uppercase mb-3">Best Case (95%)</p>
                                                    <div className="text-2xl font-serif italic text-white">{fmtCurrency(mcResult.best.end_capital)}</div>
                                                    <div className="text-[10px] text-green-500 mt-1">{fmtPct(mcResult.best.performance)} Perf.</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 h-[450px] p-8 rounded-[2rem] border border-white/[0.05] bg-black/40 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                    <XAxis dataKey="trade" hide />
                                                    <YAxis
                                                        domain={['auto', 'auto']}
                                                        stroke="rgba(255,255,255,0.2)"
                                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff', fontSize: '10px' }}
                                                        formatter={(value) => [fmtCurrency(value), '']}
                                                    />
                                                    <Line type="monotone" dataKey="best" stroke="#4ade80" strokeWidth={1} dot={false} strokeOpacity={0.5} />
                                                    <Line type="monotone" dataKey="median" stroke="#d4af37" strokeWidth={2} dot={false} />
                                                    <Line type="monotone" dataKey="worst" stroke="#ef4444" strokeWidth={1} dot={false} strokeOpacity={0.5} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calculators;
