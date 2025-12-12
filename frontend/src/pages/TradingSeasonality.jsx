import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MONTHS = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const TradingSeasonality = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterOddYears, setFilterOddYears] = useState(false);
    const [exclude2020, setExclude2020] = useState(false);
    const [filterElection, setFilterElection] = useState(false);
    const [filterMidterm, setFilterMidterm] = useState(false);
    const [filterPreElection, setFilterPreElection] = useState(false);
    const [filterPostElection, setFilterPostElection] = useState(false);

    // New Params
    const [lookback, setLookback] = useState(15);
    const [minWinRate, setMinWinRate] = useState(70);
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [useCustomDate, setUseCustomDate] = useState(false);

    useEffect(() => {
        const fetchPatterns = async () => {
            setLoading(true);
            try {
                // Construct Query Params
                const params = new URLSearchParams();

                params.append('lookback_years', lookback);
                params.append('min_win_rate', minWinRate);

                if (useCustomDate && customStart && customEnd) {
                    params.append('search_start_date', customStart);
                    params.append('search_end_date', customEnd);
                }

                if (filterOddYears) params.append('filter_odd_years', 'true');
                if (exclude2020) params.append('exclude_2020', 'true');
                if (filterElection) params.append('filter_election', 'true');
                if (filterMidterm) params.append('filter_midterm', 'true');
                if (filterPreElection) params.append('filter_pre_election', 'true');
                if (filterPostElection) params.append('filter_post_election', 'true');

                const res = await axios.get(apiUrl(`/analyze_all_assets?${params.toString()}`));
                setPatterns(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        // Debounce slightly to avoid rapid reloading on slider change
        const timer = setTimeout(() => {
            fetchPatterns();
        }, 800);
        return () => clearTimeout(timer);

    }, [filterOddYears, exclude2020, filterElection, filterMidterm, filterPreElection, filterPostElection, lookback, minWinRate, customStart, customEnd, useCustomDate]);

    const filteredPatterns = patterns.filter(p => {
        if (useCustomDate) return true; // Backend handles filtering if custom date is set
        // p.start_md is [Month, Day]
        const startM = p.start_md[0];
        const endM = p.end_md[0];
        return startM === month || endM === month;
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-6">Trading Saisonalität - Screener</h1>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Panel - Parameter & Filters */}
                <div className="w-full lg:w-[350px] shrink-0 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h2 className="text-orange-400 font-bold flex items-center gap-2">
                            FILTER
                        </h2>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Mode Selection: Month or Date Range */}
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => setUseCustomDate(false)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${!useCustomDate ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Monat
                            </button>
                            <button
                                onClick={() => setUseCustomDate(true)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${useCustomDate ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Datum
                            </button>
                        </div>

                        {/* Month Selector */}
                        {!useCustomDate && (
                            <div>
                                <label className="text-gray-400 block mb-2 text-sm font-semibold">Monat auswählen</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {MONTHS.map((m, idx) => {
                                        const mNum = idx + 1;
                                        const active = mNum === month;
                                        return (
                                            <button
                                                key={m}
                                                onClick={() => setMonth(mNum)}
                                                className={`py-1.5 rounded text-xs transition-colors ${active ? "bg-white text-black font-bold" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                                            >
                                                {m.slice(0, 3)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Custom Date Inputs */}
                        {useCustomDate && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Start (DD.MM)</label>
                                    <input
                                        type="text"
                                        placeholder="01.01"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full bg-[#111] border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Ende (DD.MM)</label>
                                    <input
                                        type="text"
                                        placeholder="31.12"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full bg-[#111] border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10 space-y-4">
                            {/* Lookback Slider */}
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-400">Analysierte Jahre</span>
                                    <span className="text-white font-bold">{lookback}</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    step="1"
                                    value={lookback}
                                    onChange={(e) => setLookback(parseInt(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                />
                            </div>

                            {/* Winrate Slider */}
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-400">Min. Trefferquote</span>
                                    <span className="text-white font-bold">{minWinRate}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    step="5"
                                    value={minWinRate}
                                    onChange={(e) => setMinWinRate(parseInt(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="pt-4 border-t border-white/10">
                            <label className="text-blue-400 font-medium text-sm block mb-3">Jahres-Filter (Global)</label>

                            <div className="grid grid-cols-2 gap-2">
                                {/* Ungerade */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded border transition-all ${filterOddYears ? 'bg-blue-900/20 border-blue-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={filterOddYears} onChange={(e) => setFilterOddYears(e.target.checked)} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${filterOddYears ? 'text-blue-100' : 'text-gray-300'}`}>Ungerade</span>
                                </label>

                                {/* Exclude 2020 */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded border transition-all ${exclude2020 ? 'bg-red-900/20 border-red-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={exclude2020} onChange={(e) => setExclude2020(e.target.checked)} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${exclude2020 ? 'text-red-100' : 'text-gray-300'}`}>No 2020</span>
                                </label>

                                {/* Election */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded border transition-all ${filterElection ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={filterElection} onChange={(e) => setFilterElection(e.target.checked)} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${filterElection ? 'text-indigo-100' : 'text-gray-300'}`}>Election</span>
                                </label>

                                {/* Post-Election */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded border transition-all ${filterPostElection ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={filterPostElection} onChange={(e) => setFilterPostElection(e.target.checked)} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${filterPostElection ? 'text-indigo-100' : 'text-gray-300'}`}>Post-El.</span>
                                </label>

                                {/* Midterm */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded border transition-all ${filterMidterm ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={filterMidterm} onChange={(e) => setFilterMidterm(e.target.checked)} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${filterMidterm ? 'text-indigo-100' : 'text-gray-300'}`}>Midterm</span>
                                </label>

                                {/* Pre-Election */}
                                <label className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded border transition-all ${filterPreElection ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                    <input type="checkbox" checked={filterPreElection} onChange={(e) => setFilterPreElection(e.target.checked)} className="w-3 h-3 bg-gray-800 border-gray-600 rounded" />
                                    <span className={`text-[10px] select-none ${filterPreElection ? 'text-indigo-100' : 'text-gray-300'}`}>Pre-El.</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Results */}
                <div className="flex-1 w-full">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                            <p className="text-gray-400">Analysiere alle Assets (das kann einen Moment dauern)...</p>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-black border border-gray-800 rounded-xl overflow-hidden"
                        >
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5">
                                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Asset</th>
                                        <th className="px-6 py-4">Richtung</th>
                                        <th className="px-6 py-4">Start</th>
                                        <th className="px-6 py-4">Ende</th>
                                        <th className="px-6 py-4">Dauer</th>
                                        <th className="px-6 py-4 text-right">Trefferquote</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredPatterns.length > 0 ? filteredPatterns.map((p, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{p.asset_name}</div>
                                                <div className="text-xs text-gray-500">{p.ticker}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${p.type === 'Long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {p.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {p.start_md[1]}. {MONTHS[p.start_md[0] - 1]}
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {p.end_md[1]}. {MONTHS[p.end_md[0] - 1]}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {p.duration} Tage
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-white">
                                                {p.win_rate.toFixed(1)}%
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                Keine Muster für diesen Monat gefunden.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TradingSeasonality;
