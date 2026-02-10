import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.`;
    }
    return dateStr;
};

const ResultsTable = ({ results, onRowClick }) => {
    if (!results || results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <p className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase font-medium italic">Keine signifikanten Muster für die gewählten Parameter gefunden.</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full"
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-white/[0.05]">
                        <tr className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.4em]">
                            <th className="px-2 py-4">Zeitraum</th>
                            <th className="px-2 py-4">Typ</th>
                            <th className="px-2 py-4 text-right">Trefferquote</th>
                            <th className="px-2 py-4 text-right">Ø Ertrag</th>
                            <th className="px-2 py-4 text-right">Performances</th>
                            <th className="px-2 py-4">Fehltreffer</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {results.map((pattern, index) => (
                            <tr
                                key={index}
                                onClick={() => onRowClick && onRowClick(pattern)}
                                className="group hover:bg-white/[0.01] transition-all duration-500 cursor-pointer"
                            >
                                <td className="px-2 py-6">
                                    <div className="text-sm font-serif italic text-white group-hover:text-[#d4af37] transition-colors">
                                        {formatDate(pattern.start_str)} — {formatDate(pattern.end_str)}
                                    </div>
                                    <div className="text-[8px] tracking-[0.2em] text-neutral-600 uppercase mt-1.5 font-bold">Historisches Fenster</div>
                                </td>
                                <td className="px-2 py-6">
                                    <span className={`px-4 py-1.5 rounded-sm text-[9px] font-bold tracking-[0.2em] uppercase border transition-all ${pattern.type === 'Long'
                                        ? 'border-emerald-500/30 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black'
                                        : 'border-rose-500/30 text-rose-500 group-hover:bg-rose-500 group-hover:text-black'
                                        }`}>
                                        {pattern.type}
                                    </span>
                                </td>
                                <td className="px-2 py-6 text-right">
                                    <div className={`text-xl font-serif italic ${pattern.win_rate >= 90 ? 'text-[#d4af37]' : 'text-neutral-300'}`}>
                                        {pattern.win_rate.toFixed(0)}%
                                    </div>
                                </td>
                                <td className="px-2 py-6 text-right">
                                    <div className={`text-sm font-serif italic ${pattern.avg_return >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {pattern.avg_return > 0 ? '+' : ''}{pattern.avg_return.toFixed(2)}%
                                    </div>
                                </td>
                                <td className="px-2 py-6 text-right">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <div className="text-[10px] font-mono font-bold text-emerald-500">+{pattern.max_return.toFixed(1)}%</div>
                                        <div className="text-[10px] font-mono font-bold text-rose-500">{pattern.min_return.toFixed(1)}%</div>
                                    </div>
                                </td>
                                <td className="px-2 py-6">
                                    <div className="flex flex-wrap gap-1.5 min-w-[100px]">
                                        {pattern.missed_years.length > 0 ? (
                                            pattern.missed_years.map(y => (
                                                <span key={y} className="text-[8px] font-mono font-bold text-neutral-600 bg-white/[0.03] px-1.5 py-0.5 rounded-sm">{y}</span>
                                            ))
                                        ) : (
                                            <span className="text-[8px] tracking-[0.2em] text-neutral-700 uppercase font-bold italic">Makellos</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default ResultsTable;
