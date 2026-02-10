
import React, { useState, useEffect } from 'react';
import { ChevronRight, Settings, DollarSign, Activity } from 'lucide-react';

import API_BASE_URL from '../config/api';
const API_BASE = API_BASE_URL;

const CURRENCY_BASKETS = [
    { id: "curr_usd", label: "USD Basket", symbol: "$" },
    { id: "curr_eur", label: "EUR Basket", symbol: "€" },
    { id: "curr_gbp", label: "GBP Basket", symbol: "£" },
    { id: "curr_jpy", label: "JPY Basket", symbol: "¥" },
    { id: "curr_aud", label: "AUD Basket", symbol: "A$" },
    { id: "curr_nzd", label: "NZD Basket", symbol: "NZ$" },
    { id: "curr_cad", label: "CAD Basket", symbol: "C$" },
    { id: "curr_chf", label: "CHF Basket", symbol: "₣" }
];

const CurrencyAnalysis = () => {
    const [selectedIndex, setSelectedIndex] = useState("curr_usd");

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [expandedTicker, setExpandedTicker] = useState(null);

    // Parameters
    const [params, setParams] = useState({
        startDay: "",
        endDay: "",
        lookback: 15,
        winRate: 70,
        filterOddYears: false,
        exclude2020: false,
        filterElection: false,
        filterMidterm: false,
        filterPreElection: false,
        filterPostElection: false
    });

    const handleRunScreening = async () => {
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const body = {
                index: selectedIndex,
                min_win_rate: parseInt(params.winRate),
                lookback_years: parseInt(params.lookback),
                search_start_date: params.startDay && params.startDay.length === 5 ? params.startDay : null,
                search_end_date: params.endDay && params.endDay.length === 5 ? params.endDay : null,
                filter_odd_years: params.filterOddYears,
                exclude_2020: params.exclude2020,
                filter_election: params.filterElection,
                filter_midterm: params.filterMidterm,
                filter_pre_election: params.filterPreElection,
                filter_post_election: params.filterPostElection
            };

            const res = await fetch(`${API_BASE}/screener/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });


            if (!res.ok) throw new Error("Screening failed. Please try again.");

            const data = await res.json();

            if (data.status === "error") {
                setError(data.detail || "Server meldet einen Fehler.");
                return;
            }

            // Handle new response format vs legacy
            const resultData = data.data || {};
            const patterns = resultData.results || data.results || [];

            setResults({
                patterns: patterns,
                stats: {
                    tickersFound: resultData.tickers_found || 0,
                    scannedCount: resultData.scanned_count || patterns.length,
                    errorCount: resultData.error_count || 0
                }
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // YYYY-MM-DD -> DD.MM.
            return `${parts[2]}.${parts[1]}.`;
        }
        return dateStr;
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Währungsanalyse</h1>
                    <p className="text-gray-500">Saisonale Scanner für Major Currencies und Futures.</p>
                </div>
            </div>

            <div className="flex gap-8 flex-col lg:flex-row items-start">

                {/* Left Panel - Control Center */}
                <div className="w-full lg:w-[350px] shrink-0 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">

                    {/* Header */}
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h2 className="text-blue-400 font-bold flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            SCAN-PARAMETER
                        </h2>
                    </div>


                    <div className="p-6 space-y-6">
                        {/* Basket Selection */}
                        <div className="space-y-3">
                            <label className="text-gray-400 font-medium text-sm">Währungskorb wählen</label>
                            <div className="grid grid-cols-2 gap-2">
                                {CURRENCY_BASKETS.map(basket => (
                                    <button
                                        key={basket.id}
                                        onClick={() => setSelectedIndex(basket.id)}
                                        className={`p-2 rounded border text-sm flex items-center gap-2 transition-all ${selectedIndex === basket.id
                                            ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-lg shadow-blue-500/20'
                                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                            {basket.symbol}
                                        </span>
                                        {basket.label.replace(' Basket', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scan Button */}
                        <button
                            onClick={handleRunScreening}
                            disabled={loading}
                            className={`w-full py-3 text-center font-bold text-lg rounded bg-blue-500 hover:bg-blue-400 text-white transition-all shadow-lg shadow-blue-500/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'ANALISIERE...' : `${CURRENCY_BASKETS.find(b => b.id === selectedIndex)?.label.toUpperCase() || 'WÄHRUNGEN'} SCANNEN`}
                        </button>

                        {/* Note on Basket */}
                        <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded text-xs text-blue-300">
                            Scanner durchsucht automatisch alle Hauptwährungspaare mit {CURRENCY_BASKETS.find(b => b.id === selectedIndex)?.label.replace(' Basket', '')}-Beteiligung.
                        </div>

                        {/* Time Window */}
                        <div className="space-y-3">
                            <label className="text-gray-400 font-medium text-sm">Zeitfenster Suche (Optional)</label>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <span className="text-[10px] text-gray-500 font-bold block mb-1">START (TT.MM)</span>
                                    <input
                                        type="text"
                                        value={params.startDay}
                                        onChange={(e) => setParams({ ...params, startDay: e.target.value })}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                                        placeholder="15.01"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] text-gray-500 font-bold block mb-1">ENDE (TT.MM)</span>
                                    <input
                                        type="text"
                                        value={params.endDay}
                                        onChange={(e) => setParams({ ...params, endDay: e.target.value })}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                                        placeholder="15.02"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lookback */}
                        <div className="space-y-3">
                            <label className="text-gray-400 font-medium text-sm flex justify-between">
                                Lookback (Jahre):
                                <span className="text-white">{params.lookback}</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                value={params.lookback}
                                onChange={(e) => setParams({ ...params, lookback: e.target.value })}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        {/* Win Rate */}
                        <div className="space-y-3">
                            <label className="text-gray-400 font-medium text-sm flex justify-between">
                                Min. Trefferquote (%):
                                <span className="text-white">{params.winRate}</span>
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="100"
                                value={params.winRate}
                                onChange={(e) => setParams({ ...params, winRate: e.target.value })}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        {/* Additional Filters - Compact */}
                        <div className="space-y-2 pt-4 border-t border-white/10">
                            <label className="text-gray-400 font-medium text-sm">Spezial-Filter</label>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Ungerade */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded border transition-all ${params.filterOddYears ? 'bg-blue-900/20 border-blue-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={params.filterOddYears} onChange={(e) => setParams({ ...params, filterOddYears: e.target.checked })} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${params.filterOddYears ? 'text-blue-100' : 'text-gray-400'}`}>Ungerade Jahre</span>
                                </label>

                                {/* No 2020 */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded border transition-all ${params.exclude2020 ? 'bg-blue-900/20 border-blue-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={params.exclude2020} onChange={(e) => setParams({ ...params, exclude2020: e.target.checked })} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${params.exclude2020 ? 'text-blue-100' : 'text-gray-400'}`}>Ohne 2020</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Results */}
                <div className="flex-1 w-full min-h-[600px] flex flex-col">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-gray-400" />
                                <h2 className="text-lg font-bold text-white">
                                    Ergebnisse
                                    {results && <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">{results.patterns ? results.patterns.length : results.length}</span>}
                                </h2>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1 bg-[#0A0A0A]">
                            {!results ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 min-h-[400px]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <DollarSign className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p>Starten Sie den Scan, um saisonale Währungsmuster zu finden.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-gray-400 text-sm border-b border-white/10">
                                            <th className="p-4 font-medium">Instrument</th>
                                            <th className="p-4 font-medium">Richtung</th>
                                            <th className="p-4 font-medium">Win Rate</th>
                                            <th className="p-4 font-medium">Zeitraum</th>
                                            <th className="p-4 font-medium">Dauer</th>
                                            <th className="p-4 font-medium text-right">Avg Return</th>
                                        </tr>
                                    </thead>

                                    <tbody className="text-sm">
                                        {(results.patterns || results).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-12 text-center text-gray-500">
                                                    Keine passenden Muster gefunden.
                                                </td>
                                            </tr>
                                        ) : (
                                            (results.patterns || results).map((r, i) => (
                                                <React.Fragment key={i}>
                                                    <tr
                                                        onClick={() => setExpandedTicker(expandedTicker === r.ticker ? null : r.ticker)}
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors text-gray-300 cursor-pointer group"
                                                    >
                                                        <td className="p-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{r.ticker}</span>
                                                                <span className="text-xs text-gray-500">{r.asset_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${r.type === 'Long' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                                }`}>
                                                                {r.type.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${r.win_rate >= 80 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${r.win_rate}%` }}></div>
                                                                </div>
                                                                <span className="font-medium text-white">{r.win_rate.toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-gray-400">
                                                            {formatDate(r.start_str)} - {formatDate(r.end_str)}
                                                        </td>
                                                        <td className="p-4 text-gray-400">{r.duration} Tage</td>
                                                        <td className="p-4 text-right font-medium text-white">
                                                            {r.avg_return ? `${r.avg_return.toFixed(2)}%` : '-'}
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Row Details */}
                                                    {expandedTicker === r.ticker && r.yearly_trades && (
                                                        <tr className="bg-white/5">
                                                            <td colSpan="6" className="p-4">
                                                                <div className="bg-[#111] rounded-lg p-4 border border-white/10">
                                                                    <h4 className="text-gray-400 font-bold mb-3 text-xs uppercase tracking-wider">Historische Performance ({r.ticker})</h4>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {r.yearly_trades.sort((a, b) => b.year - a.year).map((trade, idx) => {
                                                                            const isWin = (r.type === 'Long' && trade.exit_price > trade.entry_price) || (r.type === 'Short' && trade.exit_price < trade.entry_price);
                                                                            const profitAbs = trade.exit_price - trade.entry_price;
                                                                            const profitDisplay = r.type === 'Short' ? -profitAbs : profitAbs;

                                                                            return (
                                                                                <div key={idx} className={`p-2 rounded border ${isWin ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'} flex justify-between items-center text-xs`}>
                                                                                    <span className="text-gray-400 font-medium">{trade.year}</span>
                                                                                    <span className={isWin ? 'text-green-400' : 'text-red-400'}>
                                                                                        {profitDisplay > 0 ? '+' : ''}{profitDisplay.toFixed(4)}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrencyAnalysis;
