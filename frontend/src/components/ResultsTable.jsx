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
            <div className="text-center text-gray-400 mt-8">
                Keine signifikanten Muster gefunden.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-200">Analyse-Ergebnisse</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                                <th className="px-3 py-2.5">Startdatum</th>
                                <th className="px-3 py-2.5">Enddatum</th>
                                <th className="px-3 py-2.5">Typ</th>
                                <th className="px-3 py-2.5">Trefferquote</th>
                                <th className="px-3 py-2.5">Ø Gewinn</th>
                                <th className="px-3 py-2.5">Bester Trade</th>
                                <th className="px-3 py-2.5">Schlechtester Trade</th>
                                <th className="px-3 py-2.5">Fehltreffer (Jahre)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {results.map((pattern, index) => (
                                <tr
                                    key={index}
                                    onClick={() => onRowClick && onRowClick(pattern)}
                                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <td className="px-3 py-2.5 text-sm font-medium text-gray-300">
                                        {formatDate(pattern.start_str)}
                                    </td>
                                    <td className="px-3 py-2.5 text-sm font-medium text-gray-300">
                                        {formatDate(pattern.end_str)}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium ${pattern.type === 'Long'
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                            }`}>
                                            {pattern.type === 'Long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {pattern.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className={`text-sm font-bold ${pattern.win_rate >= 90 ? 'text-emerald-400' : 'text-white'}`}>
                                            {pattern.win_rate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-sm">
                                        <span className={`${pattern.avg_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {pattern.avg_return ? pattern.avg_return.toFixed(2) + '%' : '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-sm text-green-400">
                                        {pattern.max_return ? '+' + pattern.max_return.toFixed(2) + '%' : '-'}
                                    </td>
                                    <td className="px-3 py-2.5 text-sm text-red-400">
                                        {pattern.min_return ? pattern.min_return.toFixed(2) + '%' : '-'}
                                    </td>
                                    <td className="px-3 py-2.5 text-sm text-gray-500">
                                        {pattern.missed_years.length > 0 ? (
                                            <span className="text-gray-400">{pattern.missed_years.join(', ')}</span>
                                        ) : (
                                            <span className="text-gray-600 text-xs">Keine</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default ResultsTable;
