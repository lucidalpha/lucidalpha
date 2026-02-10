import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { Search, Loader2, TrendingUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StockSeasonality = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 2) {
                setSuggestions([]);
                setError(null);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(apiUrl(`/search_ticker?q=${query}`));
                setSuggestions(res.data.results || []);
            } catch (e) {
                console.error(e);
                setSuggestions([]);
                setError("Verbindung zum Server fehlgeschlagen. Bitte prüfen, ob das Backend läuft.");
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (item) => {
        navigate(`/analysis-window?ticker=${item.symbol}&name=${encodeURIComponent(item.shortname || item.longname)}&category=Aktien`);
    };

    return (
        <div className="bg-[#050505] min-h-[80vh] pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-6 sm:px-10">

                {/* Header Section */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-4 font-medium">Equities Search</p>
                    <h1 className="text-4xl md:text-5xl font-serif italic text-white mb-8">Stock Analysis.</h1>
                    <div className="w-16 h-[1px] bg-white/[0.1] mb-12"></div>
                </div>

                {/* Search Interaction Section */}
                <div className="max-w-3xl mx-auto">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#d4af37]/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000"></div>

                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-6 px-14 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/40 transition-all duration-700 text-lg font-light tracking-wide shadow-2xl"
                                placeholder="Suchen Sie nach Ticker oder Unternehmensnamen..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 w-5 h-5 group-focus-within:text-[#d4af37] transition-colors duration-700" />

                            <AnimatePresence>
                                {loading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute right-6 top-1/2 -translate-y-1/2"
                                    >
                                        <Loader2 className="text-[#d4af37] w-5 h-5 animate-spin" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                            {suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute w-full mt-4 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.05] rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-50 p-2"
                                >
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-1">
                                        {suggestions.map((item) => (
                                            <div
                                                key={item.symbol}
                                                className="p-5 hover:bg-white/[0.03] cursor-pointer rounded-2xl flex justify-between items-center transition-all duration-500 group/item"
                                                onClick={() => handleSelect(item)}
                                            >
                                                <div className="flex items-center space-x-5">
                                                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-neutral-500 group-hover/item:border-[#d4af37]/30 group-hover/item:text-[#d4af37] transition-all">
                                                        <TrendingUp size={16} strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <div className="font-serif italic text-white group-hover/item:text-[#d4af37] transition-colors text-lg">{item.shortname || item.longname || item.symbol}</div>
                                                        <div className="text-[9px] tracking-[0.2em] text-neutral-500 uppercase mt-1">{item.exchange} • {item.type}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 font-mono bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.05] group-hover/item:text-white transition-colors">{item.symbol}</span>
                                                    <ArrowRight size={14} className="text-neutral-700 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-8 p-6 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-100/60 text-xs text-center font-light tracking-wide"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Placeholder content when no results */}
                    {!query && (
                        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            <div className="p-8 rounded-[2rem] border border-white/[0.03] bg-white/[0.01]">
                                <h4 className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase mb-4 font-bold">Direktsuche</h4>
                                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                                    Geben Sie einen Ticker (z.B. AAPL, TSLA) oder einen Firmennamen ein, um die saisonale Struktur und Profitabilität zu analysieren.
                                </p>
                            </div>
                            <div className="p-8 rounded-[2rem] border border-white/[0.03] bg-white/[0.01]">
                                <h4 className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase mb-4 font-bold">Intelligence</h4>
                                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                                    Unsere Algorithmen scannen historische Daten der letzten 20+ Jahre, um statistisch signifikante Kauf- und Verkaufsfenster zu identifizieren.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockSeasonality;
