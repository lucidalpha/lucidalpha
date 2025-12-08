import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

    useEffect(() => {
        const fetchPatterns = async () => {
            try {
                // Use port 8000 as per uvicorn command
                const res = await axios.get('http://localhost:8000/analyze_all_assets');
                setPatterns(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchPatterns();
    }, []);

    const filteredPatterns = patterns.filter(p => {
        // p.start_md is [Month, Day]
        const startM = p.start_md[0];
        const endM = p.end_md[0];
        return startM === month || endM === month;
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-6">Trading Saisonalität - Screener</h1>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8 bg-black p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400">Filter Monat:</span>
                <div className="flex gap-2 flex-wrap">
                    {MONTHS.map((m, idx) => {
                        const mNum = idx + 1;
                        const active = mNum === month;
                        return (
                            <button
                                key={m}
                                onClick={() => setMonth(mNum)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${active ? "bg-white text-black font-medium" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    }`}
                            >
                                {m}
                            </button>
                        );
                    })}
                </div>
            </div>

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
    );
};

export default TradingSeasonality;
