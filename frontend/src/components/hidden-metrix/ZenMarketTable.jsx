import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const MOCK_DATA = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '234.12', change: '+1.45%', signal: 'Bullish', status: 'Aktiv' },
    { symbol: 'BTC', name: 'Bitcoin', price: '98,450', change: '+3.12%', signal: 'Kraftvoll', status: 'Aktiv' },
    { symbol: 'GLD', name: 'Gold Trust', price: '245.88', change: '+0.85%', signal: 'Präzise', status: 'Aktiv' },
    { symbol: 'NVDA', name: 'Nvidia', price: '145.20', change: '+5.67%', signal: 'Aufstrebend', status: 'Aktiv' },
    { symbol: 'TSLA', name: 'Tesla', price: '210.55', change: '-2.10%', signal: 'Ruhig', status: 'Wartend' },
];

const ZenMarketTable = () => {
    return (
        <section className="py-40 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
                <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
                    <div className="max-w-2xl">
                        <p className="text-[9px] tracking-[0.5em] text-[#d4af37] uppercase mb-6 font-medium">Fluss & Resonanz</p>
                        <h2 className="text-4xl md:text-6xl font-serif italic text-white mb-8 leading-tight">Live Intelligenz.</h2>
                        <p className="text-neutral-300 font-light tracking-wide leading-relaxed text-sm">
                            Eine destillierte Perspektive auf das Marktmomentum.
                            Muster, enthüllt durch die Linse der Klarheit und des zeitlichen Rhythmus.
                        </p>
                    </div>
                    <div className="flex border-b border-white/[0.1] pb-2">
                        <button className="px-10 py-3 text-[10px] tracking-[0.3em] uppercase text-[#d4af37] border-b border-[#d4af37] -mb-[2px] font-medium">Bereiche</button>
                        <button className="px-10 py-3 text-[10px] tracking-[0.3em] uppercase text-neutral-400 hover:text-white transition-colors">Archiv</button>
                    </div>
                </div>

                <div className="relative group">
                    {/* Subtle outer glow */}
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-white/[0.1] to-transparent rounded-[2rem] -z-10"></div>

                    <div className="overflow-hidden bg-[#0c0c0c]/60 backdrop-blur-2xl border border-white/[0.05] rounded-[2rem]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.05]">
                                        <th className="px-10 py-8 text-[9px] font-medium text-neutral-200 uppercase tracking-[0.4em] japanese-minimal">Asset</th>
                                        <th className="px-10 py-8 text-[9px] font-medium text-neutral-200 uppercase tracking-[0.4em] japanese-minimal">Preis</th>
                                        <th className="px-10 py-8 text-[9px] font-medium text-neutral-200 uppercase tracking-[0.4em] japanese-minimal">Zeitfluss</th>
                                        <th className="px-10 py-8 text-[9px] font-medium text-neutral-200 uppercase tracking-[0.4em] japanese-minimal">Signal</th>
                                        <th className="px-10 py-8 text-[9px] font-medium text-neutral-200 uppercase tracking-[0.4em] japanese-minimal text-right">Einblick</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {MOCK_DATA.map((item, i) => (
                                        <tr key={item.symbol} className="hover:bg-white/[0.02] transition-all duration-700 group/row">
                                            <td className="px-10 py-10">
                                                <div className="flex items-center space-x-6">
                                                    <div className="w-12 h-12 border border-white/[0.1] rounded-full flex items-center justify-center text-[11px] text-[#d4af37] group-hover/row:border-[#d4af37]/40 transition-all duration-700">
                                                        {item.symbol[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white tracking-[0.1em]">{item.symbol}</p>
                                                        <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] mt-1.5 font-light">{item.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-[13px] text-neutral-300 font-light tabular-nums tracking-wide">${item.price}</td>
                                            <td className="px-10 py-10 text-[13px]">
                                                <span className={`tabular-nums tracking-wide ${item.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                                    {item.change}
                                                </span>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex items-center space-x-3">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Aktiv' ? 'bg-green-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                                                    <span className={`text-[10px] uppercase tracking-[0.3em] font-medium ${item.signal === 'Bullish' || item.signal === 'Kraftvoll' || item.signal === 'Aufstrebend' ? 'text-[#d4af37]' : 'text-neutral-400'
                                                        }`}>
                                                        {item.signal}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-right">
                                                <button className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.05] text-neutral-400 hover:text-[#d4af37] hover:border-[#d4af37]/40 transition-all duration-700">
                                                    <ArrowUpRight size={14} strokeWidth={1} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-16 flex justify-center">
                    <div className="h-[1px] w-12 bg-[#d4af37]/20"></div>
                </div>
            </div>
        </section>
    );
};

export default ZenMarketTable;
