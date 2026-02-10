import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { apiUrl } from '../config/api';
import ResultsTable from '../components/ResultsTable';
import { X, Loader2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, ReferenceLine, AreaChart, Area, Brush
} from 'recharts';

// --- Data Constants ---
const assetData = [
    {
        category: "Währungsfutures",
        items: [
            { name: "US Dollar Index Futures", ticker: "DX=F" },
            { name: "Canadian Dollar Futures", ticker: "6C=F" },
            { name: "Australian Dollar Futures", ticker: "6A=F" },
            { name: "Euro FX Futures", ticker: "6E=F" },
            { name: "British Pound Futures", ticker: "6B=F" },
            { name: "Swiss Franc Futures", ticker: "6S=F" },
            { name: "New Zealand Dollar Futures", ticker: "6N=F" },
            { name: "Japanese Yen Futures", ticker: "6J=F" }
        ]
    },
    {
        category: "Agrarfutures",
        items: [
            { name: "Cocoa Futures", ticker: "CC=F" },
            { name: "Sojabohnen Futures", ticker: "ZS=F" },
            { name: "Sugar No. 11 Futures", ticker: "SB=F" },
            { name: "Coffee C Futures", ticker: "KC=F" },
            { name: "Weizen Futures", ticker: "ZW=F" },
            { name: "Mais Futures", ticker: "ZC=F" }
        ]
    },
    {
        category: "Commodity Futures",
        items: [
            { name: "Light Crude Oil Futures", ticker: "CL=F" },
            { name: "Natural Gas Futures", ticker: "NG=F" },
            { name: "Palladium Futures", ticker: "PA=F" },
            { name: "Gold Futures", ticker: "GC=F" },
            { name: "Silber Futures", ticker: "SI=F" },
            { name: "Platin Futures", ticker: "PL=F" },
            { name: "Kupfer Futures", ticker: "HG=F" }
        ]
    },
    {
        category: "Indices Futures",
        items: [
            { name: "NASDAQ 100 E-Mini Futures", ticker: "NQ=F" },
            { name: "DAX, FINANCIAL, INDEX FUTURES", ticker: "^GDAXI" },
            { name: "S&P 500 E-Mini Futures", ticker: "ES=F" },
            { name: "E-Mini Dow Jones ($5) Futures", ticker: "YM=F" },
            { name: "E-Mini Russell 2000 Index Futures", ticker: "RTY=F" }
        ]
    }
];

// --- Sub-Component: Overview (Price & Seasonality) ---
const AssetOverview = ({ asset }) => {
    const [results, setResults] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.post(apiUrl('/analyze_ticker'), {
                    ticker: asset.ticker
                });
                setResults(response.data.results);
                setChartData(response.data.chart_data || []);
            } catch (err) {
                console.error(err);
                setError(`Failed to fetch analysis data.`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [asset]);

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading Overview...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Seasonality Table */}
                <div className="flex-1 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-white">Seasonality Patterns</h3>
                    </div>
                    <div className="flex-1 overflow-auto border border-gray-800 rounded-xl bg-black/50">
                        <ResultsTable results={results || []} />
                    </div>
                </div>

                {/* Price Chart */}
                <div className="flex-1 flex flex-col h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-2">Price History (Daily)</h3>
                    <div className="flex-1 border border-gray-800 rounded-xl bg-black/50 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} minTickGap={50} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                                <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                                <Line type="monotone" dataKey="close" stroke="#fff" dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Component: CoT View ---
const AssetCotView = ({ asset }) => {
    const [cotData, setCotData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter/View State
    const [range, setRange] = useState('All');
    const [viewMode, setViewMode] = useState('index'); // 'index' or 'net'
    const [lookback, setLookback] = useState(26);
    const [reportType, setReportType] = useState('legacy');

    // Toggles
    const [showLine1, setShowLine1] = useState(true);
    const [showLine2, setShowLine2] = useState(true);
    const [showLine3, setShowLine3] = useState(true);

    const supportsTff = ["Währungsfutures", "Indices Futures"].includes(assetData.find(c => c.items.some(i => i.name === asset.name))?.category);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(apiUrl(`/cot/${asset.ticker}`), {
                    params: { report_type: reportType, lookback: lookback }
                });
                setCotData(response.data.data);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch CoT data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [asset, reportType, lookback]);

    const getFilteredData = () => {
        if (!cotData || cotData.length === 0) return [];
        if (range === 'All') return cotData;
        const now = new Date();
        let years = 1;
        if (range === '10Y') years = 10;
        if (range === '5Y') years = 5;
        if (range === '3Y') years = 3;
        const cutoff = new Date(now.setFullYear(now.getFullYear() - years));
        return cotData.filter(d => new Date(d.date) >= cutoff);
    };

    const filteredData = getFilteredData();

    // Labels
    const getLabels = () => {
        if (reportType === 'tff') {
            return {
                line1: "Dealer", key1_net: "dealer_net", key1_idx: "dealer_index",
                line2: "Asset Mgr", key2_net: "asset_net", key2_idx: "asset_index",
                line3: "Lev Funds", key3_net: "lev_net", key3_idx: "lev_index"
            };
        }
        return {
            line1: "Commercials", key1_net: "commercial_net", key1_idx: "commercial_index",
            line2: "Large Spec", key2_net: "large_spec_net", key2_idx: "large_spec_index",
            line3: "Small Spec", key3_net: "small_spec_net", key3_idx: "small_spec_index"
        };
    };
    const labels = getLabels();

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading CoT Data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex gap-2">
                    {supportsTff && (
                        <div className="flex bg-black rounded-lg p-1 border border-gray-800">
                            <button onClick={() => setReportType('legacy')} className={`px-3 py-1 text-xs rounded transition-colors ${reportType === 'legacy' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Legacy</button>
                            <button onClick={() => setReportType('tff')} className={`px-3 py-1 text-xs rounded transition-colors ${reportType === 'tff' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>TFF</button>
                        </div>
                    )}
                    <div className="flex bg-black rounded-lg p-1 border border-gray-800">
                        <button onClick={() => setViewMode('index')} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'index' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Index</button>
                        <button onClick={() => setViewMode('net')} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'net' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Net</button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {['All', '10Y', '5Y', '3Y', '1Y'].map(r => (
                        <button key={r} onClick={() => setRange(r)} className={`px-2 py-1 text-xs rounded transition-colors ${range === r ? 'text-white bg-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>{r}</button>
                    ))}
                </div>
            </div>

            {/* Main Chart */}
            <div className="h-[400px] bg-black border border-gray-800 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} minTickGap={50} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                        <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} domain={viewMode === 'index' ? [-20, 120] : ['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                        <Legend />

                        {viewMode === 'index' && (
                            <>
                                <ReferenceLine y={100} stroke="#444" strokeDasharray="3 3" />
                                <ReferenceLine y={0} stroke="#444" strokeDasharray="3 3" />
                            </>
                        )}

                        {showLine1 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key1_idx : labels.key1_net} name={labels.line1} stroke="#3b82f6" dot={false} strokeWidth={2} />}
                        {showLine2 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key2_idx : labels.key2_net} name={labels.line2} stroke="#22c55e" dot={false} strokeWidth={2} />}
                        {showLine3 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key3_idx : labels.key3_net} name={labels.line3} stroke="#ef4444" dot={false} strokeWidth={2} />}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Open Interest Chart */}
            <div className="h-[150px] bg-black border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Open Interest</p>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                        <Area type="monotone" dataKey="open_interest" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const AssetList = () => {
    const navigate = useNavigate();

    const openAnalysisWindow = (asset, categoryName) => {
        navigate(`/analysis-window?ticker=${asset.ticker}&name=${encodeURIComponent(asset.name)}&category=${encodeURIComponent(categoryName)}`);
    };

    return (
        <div className="bg-[#050505] min-h-screen pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-6 sm:px-10">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-24 text-center">
                    <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-4 font-medium">Asset Universe</p>
                    <h1 className="text-4xl md:text-6xl font-serif italic text-white mb-8">Markt Auswahl.</h1>
                    <div className="w-16 h-[1px] bg-white/[0.1] mb-8"></div>
                    <p className="max-w-xl text-neutral-400 font-light text-sm tracking-wide leading-relaxed">
                        Entdecken Sie die Vielfalt der globalen Märkte.
                        Wählen Sie ein Instrument für eine detaillierte saisonale Analyse.
                    </p>
                </div>

                {/* Grid of Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {assetData.map((category) => {
                        const displayNames = {
                            'Währungsfutures': 'Devisen',
                            'Agrarfutures': 'Agrar',
                            'Commodity Futures': 'Rohstoffe',
                            'Indices Futures': 'Indizes'
                        };
                        const title = displayNames[category.category] || category.category.replace(' Futures', '');

                        return (
                            <div key={category.category} className="flex flex-col space-y-8 animate-fade-in">
                                <div className="relative pb-4">
                                    <h2 className="text-xl font-serif italic text-white tracking-wide">{title}</h2>
                                    <div className="absolute bottom-0 left-0 w-8 h-[1px] bg-[#d4af37]/50"></div>
                                </div>
                                <div className="flex flex-col space-y-3">
                                    {category.items.map((item, idx) => (
                                        <motion.div
                                            key={item.ticker}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => openAnalysisWindow(item, category.category)}
                                            className="group cursor-pointer"
                                        >
                                            <div className="relative p-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#d4af37]/30 transition-all duration-700 overflow-hidden">
                                                {/* Hover line */}
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-light text-neutral-200 group-hover:text-white transition-colors duration-500 tracking-wide mb-2 line-clamp-1">{item.name}</span>
                                                        <span className="text-[9px] font-medium tracking-[0.2em] text-[#d4af37]/60 group-hover:text-[#d4af37] transition-colors duration-500 uppercase">{item.ticker}</span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full border border-white/[0.05] flex items-center justify-center text-neutral-500 group-hover:border-[#d4af37]/30 group-hover:text-[#d4af37] transition-all duration-700">
                                                        <ArrowRight size={12} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AssetList;
