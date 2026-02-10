
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { ArrowLeft, Loader2, DollarSign, PieChart, Layers } from 'lucide-react';

const FundAnalysisWindow = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const cik = queryParams.get('cik');
    const name = queryParams.get('name');

    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!cik) return;

        const fetchHoldings = async () => {
            try {
                const res = await axios.get(apiUrl(`/institutional/fund_holdings/${cik}`));
                setHoldings(res.data);
            } catch (e) {
                console.error("Failed to fetch holdings", e);
            } finally {
                setLoading(false);
            }
        };
        fetchHoldings();
    }, [cik]);

    const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-5 h-5" /> Zurück zur Übersicht
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-800 pb-8">
                    <div>
                        <div className="text-sm text-yellow-500 font-bold tracking-wider mb-2">HEDGEFONDS REPORT</div>
                        <h1 className="text-4xl font-bold text-white mb-4">{name || 'Unbekannter Fonds'}</h1>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                                <Layers className="w-4 h-4" /> CIK: {cik}
                            </span>
                            <span className="flex items-center gap-2">
                                <PieChart className="w-4 h-4" /> {holdings.length} Positionen
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 text-right">
                        <div className="text-sm text-gray-500 mb-1">Verwaltetes Vermögen (Assets)</div>
                        <div className="text-3xl font-mono text-emerald-400 font-bold">
                            ${(totalValue / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd.
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        <div className="bg-zinc-900/30 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 bg-black/40 flex justify-between items-center">
                                <h3 className="font-bold text-gray-200">Aktuelles Portfolio</h3>
                                <span className="text-xs text-gray-500">Sortiert nach Marktwert</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-900/50 text-gray-400 border-b border-gray-800 uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Position</th>
                                            <th className="px-6 py-4 font-medium">Ticker</th>
                                            <th className="px-6 py-4 font-medium text-right">Wert (USD)</th>
                                            <th className="px-6 py-4 font-medium text-right">Anteile</th>
                                            <th className="px-6 py-4 font-medium text-right">% Portfolio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {holdings.map((h, i) => {
                                            const pct = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
                                            return (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-200">
                                                        {h.name}
                                                        {i === 0 && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">TOP 1</span>}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-blue-400 cursor-pointer hover:underline" onClick={() => navigate(`/analysis-window?ticker=${h.ticker || ''}&name=${encodeURIComponent(h.name)}`)}>
                                                        {h.ticker || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-300">
                                                        ${(h.value * 1000).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-400">
                                                        {h.shares.toLocaleString('de-DE')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-gray-300">{pct.toFixed(2)}%</span>
                                                            <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FundAnalysisWindow;
