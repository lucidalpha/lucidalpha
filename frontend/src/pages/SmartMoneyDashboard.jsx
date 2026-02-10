import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import { TrendingUp, DollarSign, PieChart, ArrowRight, Search, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const SmartMoneyDashboard = () => {
    const navigate = useNavigate();
    const [globalStats, setGlobalStats] = useState(null);
    const [funds, setFunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, fundsRes] = await Promise.all([
                    axios.get(apiUrl('/institutional/global_stats')),
                    axios.get(apiUrl('/institutional/funds'))
                ]);
                setGlobalStats(statsRes.data);
                setFunds(fundsRes.data);
            } catch (e) {
                console.error("Failed to fetch smart money data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredFunds = funds.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-[#050505] min-h-screen pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-6 sm:px-10">

                {/* Header Section */}
                <div className="flex flex-col items-center mb-24 text-center">
                    <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-4 font-medium">Institutional Flow</p>
                    <h1 className="text-4xl md:text-6xl font-serif italic text-white mb-8">Smart Money.</h1>
                    <div className="w-16 h-[1px] bg-white/[0.1] mb-12"></div>

                    <div className="relative w-full max-w-2xl">
                        <input
                            type="text"
                            placeholder="Suche nach Hedgefonds..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-full py-5 px-10 text-white focus:border-[#d4af37]/50 outline-none transition-all duration-700 text-sm font-light tracking-wide placeholder:text-neutral-600"
                        />
                        <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-neutral-600 w-5 h-5 pointer-events-none" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-12 h-12 border border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
                        <p className="mt-8 text-[10px] tracking-[0.3em] uppercase text-[#d4af37]/60">Analysiere 13F Daten...</p>
                    </div>
                ) : (
                    <div className="space-y-32">

                        {/* Top Holdings Section */}
                        <section className="animate-fade-in">
                            <div className="flex flex-col items-center mb-16">
                                <h2 className="text-2xl font-serif italic text-white mb-4">Meistgehaltene Werte</h2>
                                <p className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase">Basierend auf kumuliertem Marktwert</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                {globalStats?.top_holdings?.map((item, idx) => (
                                    <motion.div
                                        key={item.cusip}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => navigate(`/analysis-window?ticker=${item.name}&name=${item.name}`)}
                                        className="group relative p-8 rounded-[2rem] border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#d4af37]/30 transition-all duration-700 cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-6 opacity-10 font-serif italic text-4xl text-white group-hover:text-[#d4af37] transition-colors duration-700">
                                            {idx + 1}
                                        </div>

                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-full border border-white/[0.05] flex items-center justify-center text-[#d4af37] mb-6 mb-8 group-hover:border-[#d4af37]/30 transition-all duration-700">
                                                <DollarSign size={20} strokeWidth={1} />
                                            </div>

                                            <h3 className="text-lg font-serif italic text-white mb-2 line-clamp-1">{item.name}</h3>
                                            <p className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-6">{item.fund_count} Fonds</p>

                                            <div className="pt-6 border-t border-white/[0.05] w-full">
                                                <p className="text-[11px] font-light text-neutral-300">
                                                    ${(item.total_value / 1000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} Mio.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Funds List Table */}
                        <section className="animate-fade-in delay-200">
                            <div className="flex flex-col items-center mb-16">
                                <h2 className="text-2xl font-serif italic text-white mb-4">Überwachte Portfolios</h2>
                                <p className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase">{filteredFunds.length} Institutionen aktiv</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/[0.05]">
                                            <th className="py-6 px-4 text-[10px] tracking-[0.4em] text-[#d4af37] uppercase font-bold">Institution</th>
                                            <th className="py-6 px-4 text-[10px] tracking-[0.4em] text-[#d4af37] uppercase font-bold text-right">Portfolio Wert</th>
                                            <th className="py-6 px-4 text-[10px] tracking-[0.4em] text-[#d4af37] uppercase font-bold text-right">Positionen</th>
                                            <th className="py-6 px-4 text-[10px] tracking-[0.4em] text-[#d4af37] uppercase font-bold">Top Käufe (Letztes Q)</th>
                                            <th className="py-6 px-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {filteredFunds.map((fund, idx) => (
                                            <motion.tr
                                                key={fund.cik}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                onClick={() => navigate(`/fund-analysis?cik=${fund.cik}&name=${encodeURIComponent(fund.name)}`)}
                                                className="group cursor-pointer hover:bg-white/[0.02] transition-colors duration-500"
                                            >
                                                <td className="py-8 px-4">
                                                    <div className="text-lg font-serif italic text-white group-hover:text-[#d4af37] transition-colors duration-500">{fund.name}</div>
                                                    <div className="text-[9px] tracking-widest text-neutral-600 uppercase mt-1">CIK: {fund.cik}</div>
                                                </td>
                                                <td className="py-8 px-4 text-right">
                                                    <span className="text-sm font-light text-white">
                                                        ${(fund.total_value / 1000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd.
                                                    </span>
                                                </td>
                                                <td className="py-8 px-4 text-right">
                                                    <span className="text-sm font-light text-white">{fund.positions_count}</span>
                                                </td>
                                                <td className="py-8 px-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {fund.top_buys && fund.top_buys.length > 0 ? (
                                                            fund.top_buys.slice(0, 3).map((tick, i) => (
                                                                <span key={i} className="text-[9px] tracking-widest bg-white/[0.03] text-neutral-400 px-3 py-1.5 rounded-full border border-white/[0.05]">
                                                                    {tick}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[9px] text-neutral-600 italic">Keine Daten</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 text-right pr-8">
                                                    <div className="w-10 h-10 rounded-full border border-white/[0.05] flex items-center justify-center text-neutral-600 group-hover:border-[#d4af37]/30 group-hover:text-[#d4af37] group-hover:bg-[#d4af37]/5 transition-all duration-700 ml-auto">
                                                        <ArrowRight size={16} strokeWidth={1} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartMoneyDashboard;
