import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, Send, Sparkles, Newspaper, TrendingUp, Globe, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QNews = () => {
    const [query, setQuery] = useState("");
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const handleAsk = async (customQuery = null) => {
        const q = customQuery || query;
        if (!q.trim()) return;

        setLoading(true);
        setResponse(null);
        // Add to history immediately for better UX
        const newHistoryItem = { type: 'user', text: q, timestamp: new Date() };
        setHistory(prev => [newHistoryItem, ...prev]);

        try {
            const res = await axios.post('http://localhost:8000/ask_ai', {
                query: q,
                context: "You are QNews, a financial news aggregator and analyst. Provide real-time, data-driven market news summaries. Be concise, professional, and focus on verifiable financial events."
            });

            if (res.data.answer) {
                setResponse(res.data.answer);
                setHistory(prev => [{ type: 'ai', text: res.data.answer, timestamp: new Date() }, ...prev]);
            } else {
                setResponse("Error: No response from AI.");
            }
        } catch (e) {
            setResponse("Failed to connect to QNews service.");
            console.error(e);
        } finally {
            setLoading(false);
            if (!customQuery) setQuery("");
        }
    };

    const suggestions = [
        { icon: Globe, label: "Global Market Summary", query: "Summarize the current state of global financial markets today." },
        { icon: TrendingUp, label: "Crypto Trends", query: "What are the top trending cryptocurrencies and major news in the crypto space today?" },
        { icon: Newspaper, label: "Earnings Reports", query: "Which major companies are reporting earnings this week and what are the expectations?" },
        { icon: AlertTriangle, label: "Market Risks", query: "What are the biggest geopolitical or economic risks facing the markets right now?" }
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 min-h-screen flex flex-col">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-2 flex items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                    QNews AI
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Real-time financial intelligence powered by advanced AI. Ask about markets, stocks, crypto, or global economic events.
                </p>
            </header>

            {/* Input Section */}
            <div className="w-full max-w-3xl mx-auto mb-12">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative flex bg-[#0A0A0A] border border-gray-800 rounded-xl p-2 shadow-2xl items-center">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                            placeholder="Ask QNews about the markets..."
                            className="flex-1 bg-transparent px-4 py-3 text-lg text-white outline-none placeholder-gray-600"
                        />
                        <button
                            onClick={() => handleAsk()}
                            disabled={loading || !query.trim()}
                            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 text-blue-400" />}
                        </button>
                    </div>
                </div>

                {/* Quick Suggestions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {suggestions.map((s, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAsk(s.query)}
                            className="flex flex-col items-center justify-center p-4 bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 rounded-xl transition-all group"
                        >
                            <s.icon className="w-6 h-6 mb-2 text-gray-500 group-hover:text-purple-400 transition-colors" />
                            <span className="text-xs font-medium text-gray-400 group-hover:text-white text-center">{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Response Area */}
            <div className="flex-1 w-full max-w-4xl mx-auto space-y-8">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 animate-pulse">
                        <Sparkles className="w-12 h-12 text-purple-500 mb-4 animate-bounce" />
                        <span className="text-purple-300 font-medium">Analyzing market data...</span>
                    </div>
                )}

                <AnimatePresence mode='popLayout'>
                    {history.map((item, index) => (
                        <motion.div
                            key={item.timestamp.toISOString() + index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] rounded-2xl p-6 ${item.type === 'user'
                                    ? 'bg-gray-800/50 text-gray-200 border border-gray-700'
                                    : 'bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-purple-900/30 shadow-xl'
                                }`}>
                                {item.type === 'ai' && (
                                    <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 uppercase tracking-wider">QNews Intelligence</span>
                                    </div>
                                )}

                                <div className={`prose prose-invert max-w-none text-sm leading-7 ${item.type === 'user' ? 'font-medium' : 'text-gray-300'}`}>
                                    {item.text.split('\n').map((line, i) => (
                                        <p key={i} className="mb-2 last:mb-0">{line}</p>
                                    ))}
                                </div>

                                <div className="mt-2 text-[10px] text-gray-600 text-right">
                                    {item.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QNews;
