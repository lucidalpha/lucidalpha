
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';

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
                const res = await axios.get(`http://localhost:8000/search_ticker?q=${query}`);
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
        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center min-h-[60vh]">
            <h1 className="text-4xl font-bold text-white mb-8">Aktien Suche</h1>
            <div className="w-full relative">
                <div className="relative group">
                    <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${error ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"}`} />
                    <input
                        type="text"
                        className={`w-full bg-zinc-900 border rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-lg ${error ? "border-red-500/50 focus:ring-red-500/50" : "border-gray-700 focus:ring-blue-500"}`}
                        placeholder="Aktienname oder Ticker eingeben (z.B. Apple, TSLA)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />}
                </div>

                {error && (
                    <div className="absolute w-full mt-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="absolute w-full mt-2 bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {suggestions.map((item) => (
                                <div
                                    key={item.symbol}
                                    className="p-4 hover:bg-zinc-800 cursor-pointer border-b border-gray-800 last:border-0 flex justify-between items-center transition-colors group"
                                    onClick={() => handleSelect(item)}
                                >
                                    <div>
                                        <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">{item.shortname || item.longname || item.symbol}</div>
                                        <div className="text-xs text-gray-500">{item.exchange} • {item.type}</div>
                                    </div>
                                    <span className="text-sm font-mono text-gray-400 bg-black/40 px-2 py-1 rounded group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">{item.symbol}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-12 text-center text-gray-500 max-w-lg">
                <p>Geben Sie einen Namen ein, um detaillierte Saisonalitätsanalysen sowie Yahoo Finance Daten für Aktien weltweit zu erhalten.</p>
            </div>
        </div>
    );
};

export default StockSeasonality;
