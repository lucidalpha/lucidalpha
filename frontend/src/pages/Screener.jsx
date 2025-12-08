
import React, { useState, useEffect } from 'react';
import { ChevronRight, Settings } from 'lucide-react';

const API_BASE = "http://localhost:8000";

const Screener = () => {
    const [indices, setIndices] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState("dow");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    // Parameters
    const [params, setParams] = useState({
        startDay: "01.09",
        endDay: "31.10",
        lookback: 20,
        winRate: 70
    });

    useEffect(() => {
        // Fetch available indices
        fetch(`${API_BASE}/screener/indices`)
            .then(res => res.json())
            .then(data => {
                setIndices(data);
                if (data.length > 0) setSelectedIndex(data[0]);
            })
            .catch(err => console.error("Error loading indices:", err));
    }, []);

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
                search_end_date: params.endDay && params.endDay.length === 5 ? params.endDay : null
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

    const getIndexName = (key) => {
        switch (key) {
            case 'dow': return "Dow Jones";
            case 'nasdaq': return "NASDAQ";
            case 'dax': return "DAX 40";
            default: return key.toUpperCase();
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
        <div className="max-w-7xl mx-auto px-6 py-12 flex gap-8 flex-col lg:flex-row items-start">

            {/* Left Panel - Control Center */}
            <div className="w-full lg:w-[400px] shrink-0 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-orange-400 font-bold flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        SCAN-PARAMETER
                    </h2>
                </div>

                <div className="p-6 space-y-8">
                    {/* Scan Button */}
                    <button
                        onClick={handleRunScreening}
                        disabled={loading || indices.length === 0}
                        className={`w-full py-4 text-center font-bold text-lg rounded bg-blue-500 hover:bg-blue-400 text-white transition-all shadow-lg shadow-blue-500/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'WEITER...' : 'SCAN STARTEN'}
                    </button>

                    {/* Basket Selection */}
                    <div className="space-y-3">
                        <label className="text-blue-400 font-medium text-lg">1. Korb auswählen</label>

                        <div className="relative">
                            <select
                                value={selectedIndex}
                                onChange={(e) => setSelectedIndex(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded p-3 text-white appearance-none focus:border-blue-500 focus:outline-none"
                            >
                                {indices.map(idx => (
                                    <option key={idx} value={idx}>{getIndexName(idx)}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">▼</div>
                        </div>
                        {/* Button removed */}
                    </div>

                    {/* Time Window */}
                    <div className="space-y-3">
                        <label className="text-blue-400 font-medium text-lg">2. Zeitfenster für das Muster</label>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <span className="text-xs text-blue-400 font-bold block mb-1">START</span>
                                <input
                                    type="text"
                                    value={params.startDay}
                                    onChange={(e) => setParams({ ...params, startDay: e.target.value })}
                                    className="w-full bg-[#111] border border-white/10 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="DD.MM"
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-xs text-blue-400 font-bold block mb-1">ENDE</span>
                                <input
                                    type="text"
                                    value={params.endDay}
                                    onChange={(e) => setParams({ ...params, endDay: e.target.value })}
                                    className="w-full bg-[#111] border border-white/10 rounded p-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="DD.MM"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lookback */}
                    <div className="space-y-3">
                        <label className="text-blue-400 font-medium text-lg flex justify-between">
                            3. Lookback (Jahre):
                            <span className="text-white">{params.lookback}</span>
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="30"
                            value={params.lookback}
                            onChange={(e) => setParams({ ...params, lookback: e.target.value })}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-sm"
                        />
                    </div>

                    {/* Win Rate */}
                    <div className="space-y-3">
                        <label className="text-blue-400 font-medium text-lg flex justify-between">
                            4. Mindest-Trefferquote (%):
                            <span className="text-white">{params.winRate}</span>
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            value={params.winRate}
                            onChange={(e) => setParams({ ...params, winRate: e.target.value })}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel - Results */}
            <div className="flex-1 w-full">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-8">
                        {error}
                    </div>
                )}

                {results ? (

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-white">Ergebnisse ({results.patterns ? results.patterns.length : results.length})</h2>
                                {results.stats && (
                                    <span className="text-xs text-gray-500 mt-1">
                                        Gescannt: {results.stats.scannedCount} von {results.stats.tickersFound} Aktien | Fehler: {results.stats.errorCount}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-gray-400 text-sm border-b border-white/10">
                                        <th className="p-4 font-medium">Ticker</th>
                                        <th className="p-4 font-medium">Typ</th>
                                        <th className="p-4 font-medium">Win Rate</th>
                                        <th className="p-4 font-medium">Start</th>
                                        <th className="p-4 font-medium">Ende</th>
                                        <th className="p-4 font-medium">Dauer</th>
                                        <th className="p-4 font-medium">Jahre (Missed)</th>
                                    </tr>
                                </thead>

                                <tbody className="text-sm">
                                    {(results.patterns || results).length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                                Keine Muster gefunden, die den Kriterien entsprechen.
                                                <br />
                                                <span className="text-xs opacity-50">Prüfen Sie Filter (Datum/Win Rate) oder Datenverfügbarkeit.</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        (results.patterns || results).map((r, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors text-gray-300">
                                                <td className="p-4 font-semibold text-white">{r.ticker}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${r.type === 'Long' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                                        }`}>
                                                        {r.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-white font-medium">{r.win_rate.toFixed(1)}%</td>
                                                <td className="p-4">{formatDate(r.start_str)}</td>
                                                <td className="p-4">{formatDate(r.end_str)}</td>
                                                <td className="p-4">{r.duration} Tage</td>
                                                <td className="p-4 text-gray-500 text-xs max-w-[200px] truncate" title={r.missed_years?.join(", ")}>
                                                    {r.missed_years && r.missed_years.length > 0
                                                        ? r.missed_years.join(", ")
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-gray-500">
                        Wählen Sie Parameter links und starten Sie den Scan.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Screener;
