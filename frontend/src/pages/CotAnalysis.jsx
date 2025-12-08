import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, AreaChart, Area, Brush } from 'recharts';

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

const CotAnalysis = () => {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [cotData, setCotData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Chart visibility state
    const [showLine1, setShowLine1] = useState(true); // Comm or Dealer
    const [showLine2, setShowLine2] = useState(true); // Large or Asset
    const [showLine3, setShowLine3] = useState(true); // Small or Lev

    // View Mode: 'index' or 'net'
    const [viewMode, setViewMode] = useState('index');

    // Range State
    const [range, setRange] = useState('All');

    // Report Type: 'legacy' or 'tff'
    const [reportType, setReportType] = useState('legacy');

    // Index Cycle Lookback (weeks)
    const [lookback, setLookback] = useState(26);

    const handleAssetClick = (asset) => {
        setSelectedAsset(asset);
        setCotData([]);
        setError(null);
        setRange('All');
        setReportType('legacy');
        setLookback(26); // Reset lookback
    };

    const closeAnalysis = () => {
        setSelectedAsset(null);
        setCotData([]);
        setError(null);
    };

    // Helper to check category
    const supportsTff = (asset) => {
        if (!asset) return false;
        for (let g of assetData) {
            if (g.items.some(i => i.name === asset.name)) {
                return ["Währungsfutures", "Indices Futures"].includes(g.category);
            }
        }
        return false;
    };

    // Fetch Data Effect
    React.useEffect(() => {
        const fetchData = async () => {
            if (!selectedAsset) return;

            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:8000/cot/${selectedAsset.ticker}`, {
                    params: {
                        report_type: reportType,
                        lookback: lookback
                    }
                });
                setCotData(response.data.data);
            } catch (err) {
                console.error(err);
                setError(`Failed to fetch CoT data for ${selectedAsset.name}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedAsset, reportType, lookback]); // Refetch when lookback changes

    // Filter Logic
    const getFilteredData = () => {
        if (!cotData || cotData.length === 0) return [];
        if (range === 'All') return cotData;

        const now = new Date();
        let years = 0;
        switch (range) {
            case '10Y': years = 10; break;
            case '5Y': years = 5; break;
            case '3Y': years = 3; break;
            case '1Y': years = 1; break;
            default: return cotData;
        }

        const cutoff = new Date(now.setFullYear(now.getFullYear() - years));
        return cotData.filter(d => new Date(d.date) >= cutoff);
    };

    const filteredData = getFilteredData();

    // Mapping based on Report Type
    const getLabels = () => {
        if (reportType === 'tff') {
            return {
                line1: "Dealer/Intermediary", key1_net: "dealer_net", key1_idx: "dealer_index",
                line2: "Asset Mgr/Inst", key2_net: "asset_net", key2_idx: "asset_index",
                line3: "Leveraged Funds", key3_net: "lev_net", key3_idx: "lev_index"
            };
        } else {
            return {
                line1: "Commercials", key1_net: "commercial_net", key1_idx: "commercial_index",
                line2: "Large Speculators", key2_net: "large_spec_net", key2_idx: "large_spec_index",
                line3: "Small Speculators", key3_net: "small_spec_net", key3_idx: "small_spec_index"
            };
        }
    };

    const labels = getLabels();


    return (
        <div className="max-w-7xl mx-auto px-6 py-8 relative">
            <h1 className="text-3xl font-bold text-white mb-8">Commitment of Traders (CoT)</h1>

            {/* List Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${selectedAsset ? 'opacity-50 pointer-events-none' : ''}`}>
                {assetData.map((sector, index) => (
                    <motion.div
                        key={sector.category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black border border-gray-800 rounded-xl p-6"
                    >
                        <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-800">
                            {sector.category}
                        </h2>
                        <ul className="space-y-2">
                            {sector.items.map((item, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => handleAssetClick(item)}
                                    className={`text-sm transition-colors cursor-pointer flex items-center ${selectedAsset?.name === item.name ? "text-white hover:text-white font-medium" : "text-gray-500 hover:text-gray-400"}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${selectedAsset?.name === item.name ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "bg-gray-700"}`} />
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>

            {/* Analysis Modal/Overlay */}
            <AnimatePresence>
                {selectedAsset && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeAnalysis}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[95vw] h-[90vh] bg-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-black">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    CoT Report: <span className="text-white">{selectedAsset.name}</span>
                                </h2>
                                <button
                                    onClick={closeAnalysis}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="flex flex-col gap-8 h-full">

                                    {/* Main Chart */}
                                    <div className="bg-black border border-gray-800 rounded-xl p-6 flex-1 flex flex-col min-h-[500px]">
                                        <div className="flex flex-col gap-4 mb-6">

                                            {/* Report Type & Cycle Combined Row */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">

                                                {/* Report Type (If Supported) */}
                                                {supportsTff(selectedAsset) ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-semibold text-sm">Report:</span>
                                                        <div className="bg-gray-800 rounded-lg p-1 flex text-xs sm:text-sm">
                                                            <button
                                                                onClick={() => setReportType('legacy')}
                                                                className={`px-3 py-1 rounded-md transition-colors ${reportType === 'legacy' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                Legacy
                                                            </button>
                                                            <button
                                                                onClick={() => setReportType('tff')}
                                                                className={`px-3 py-1 rounded-md transition-colors ${reportType === 'tff' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                TFF
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    {/* Placeholder if toggle not needed */ }
                                                )}

                                                {/* Index Cycle Toggle */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white font-semibold text-sm">Index Cycle:</span>
                                                    <div className="bg-gray-800 rounded-lg p-1 flex text-xs sm:text-sm">
                                                        <button
                                                            onClick={() => setLookback(26)}
                                                            className={`px-3 py-1 rounded-md border transition-colors ${lookback === 26 ? 'bg-transparent border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                                                        >
                                                            26 Weeks
                                                        </button>
                                                        <button
                                                            onClick={() => setLookback(156)}
                                                            className={`px-3 py-1 rounded-md border transition-colors ${lookback === 156 ? 'bg-transparent border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                                                        >
                                                            36 Months
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center gap-4">
                                                    {/* View Mode Toggle */}
                                                    <div className="bg-gray-800 rounded-lg p-1 flex text-sm">
                                                        <button
                                                            onClick={() => setViewMode('index')}
                                                            className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'index' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            CoT Index
                                                        </button>
                                                        <button
                                                            onClick={() => setViewMode('net')}
                                                            className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'net' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            Net Positions
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Range Selector */}
                                                <div className="bg-gray-800 rounded-lg p-1 flex text-sm">
                                                    {['All', '10Y', '5Y', '3Y', '1Y'].map((r) => (
                                                        <button
                                                            key={r}
                                                            onClick={() => setRange(r)}
                                                            className={`px-3 py-1 rounded-md transition-colors ${range === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Line Visibility Toggles */}
                                            <div className="flex justify-end gap-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={showLine1}
                                                        onChange={(e) => setShowLine1(e.target.checked)}
                                                        className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-black"
                                                    />
                                                    <span className="text-sm text-gray-300">{labels.line1}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={showLine2}
                                                        onChange={(e) => setShowLine2(e.target.checked)}
                                                        className="rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500 focus:ring-offset-black"
                                                    />
                                                    <span className="text-sm text-gray-300">{labels.line2}</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={showLine3}
                                                        onChange={(e) => setShowLine3(e.target.checked)}
                                                        className="rounded border-gray-700 bg-gray-800 text-red-500 focus:ring-red-500 focus:ring-offset-black"
                                                    />
                                                    <span className="text-sm text-gray-300">{labels.line3}</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex-1 w-full min-h-0 relative">
                                            {loading ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                                                </div>
                                            ) : error ? (
                                                <div className="absolute inset-0 flex items-center justify-center text-red-500">
                                                    {error}
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={filteredData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            stroke="#6b7280"
                                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                                            tickFormatter={(val) => {
                                                                const d = new Date(val);
                                                                return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear().toString().slice(2)}`;
                                                            }}
                                                            minTickGap={50}
                                                        />
                                                        <YAxis
                                                            stroke="#6b7280"
                                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                                            domain={viewMode === 'index' ? [-30, 130] : ['auto', 'auto']}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#000000', borderColor: '#374151', color: '#fff' }}
                                                            itemStyle={{ color: '#ffffff' }}
                                                            labelFormatter={(label) => new Date(label).toLocaleDateString("de-DE")}
                                                            formatter={(value, name) => [
                                                                value === null ? 'N/A' : (viewMode === 'index' ? `${value.toFixed(1)}%` : value.toLocaleString()),
                                                                name
                                                            ]}
                                                        />
                                                        <Legend />
                                                        <Brush
                                                            dataKey="date"
                                                            height={30}
                                                            stroke="#374151"
                                                            fill="#111827"
                                                            tickFormatter={(val) => new Date(val).getFullYear()}
                                                        />

                                                        {viewMode === 'index' && (
                                                            <>
                                                                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" />
                                                                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" />
                                                                <ReferenceLine y={120} stroke="#eab308" strokeDasharray="3 3" />
                                                                <ReferenceLine y={-20} stroke="#eab308" strokeDasharray="3 3" />
                                                            </>
                                                        )}
                                                        {viewMode !== 'index' && <ReferenceLine y={0} stroke="#9ca3af" />}

                                                        {showLine1 && (
                                                            <Line
                                                                type="monotone"
                                                                dataKey={viewMode === 'index' ? labels.key1_idx : labels.key1_net}
                                                                name={labels.line1}
                                                                stroke="#3b82f6"
                                                                strokeWidth={2}
                                                                dot={false}
                                                                connectNulls
                                                            />
                                                        )}
                                                        {showLine2 && (
                                                            <Line
                                                                type="monotone"
                                                                dataKey={viewMode === 'index' ? labels.key2_idx : labels.key2_net}
                                                                name={labels.line2}
                                                                stroke="#22c55e"
                                                                strokeWidth={2}
                                                                dot={false}
                                                                connectNulls
                                                            />
                                                        )}
                                                        {showLine3 && (
                                                            <Line
                                                                type="monotone"
                                                                dataKey={viewMode === 'index' ? labels.key3_idx : labels.key3_net}
                                                                name={labels.line3}
                                                                stroke="#ef4444"
                                                                strokeWidth={2}
                                                                dot={false}
                                                                connectNulls
                                                            />
                                                        )}
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>

                                    {/* Open Interest Chart */}
                                    <div className="bg-black border border-gray-800 rounded-xl p-6 h-[250px] flex flex-col">
                                        <h3 className="text-xl font-semibold text-white mb-4">Open Interest</h3>
                                        <div className="flex-1 w-full min-h-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={filteredData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#6b7280"
                                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                                        tickFormatter={(val) => {
                                                            const d = new Date(val);
                                                            return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear().toString().slice(2)}`;
                                                        }}
                                                        minTickGap={50}
                                                    />
                                                    <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#000000', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#ffffff' }} labelFormatter={(label) => new Date(label).toLocaleDateString("de-DE")} />
                                                    <Area type="monotone" dataKey="open_interest" name="Open Interest" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    {!loading && !error && (
                                        <div className="bg-black border border-gray-800 rounded-xl p-6 flex flex-col max-h-[400px]">
                                            <h3 className="text-xl font-semibold text-white mb-4">Raw Data ({reportType.toUpperCase()})</h3>
                                            <div className="flex-1 overflow-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0 bg-black z-10">
                                                        <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                                                            <th className="px-6 py-3 whitespace-nowrap">Date</th>
                                                            <th className="px-6 py-3 text-right whitespace-nowrap text-blue-400">{labels.line1}</th>
                                                            <th className="px-6 py-3 text-right whitespace-nowrap text-blue-400">Index</th>
                                                            <th className="px-6 py-3 text-right whitespace-nowrap text-green-400">{labels.line2}</th>
                                                            <th className="px-6 py-3 text-right whitespace-nowrap text-green-400">Index</th>
                                                            <th className="px-6 py-3 text-right whitespace-nowrap text-red-400">{labels.line3}</th>
                                                            <th className="px-6 py-3 text-right whitespace-nowrap text-red-400">Index</th>
                                                            <th className="px-6 py-3 text-right whitespace-nowrap text-purple-400">OI</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-800">
                                                        {[...filteredData].reverse().map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-white/5">
                                                                <td className="px-6 py-2.5 text-sm text-gray-400 whitespace-nowrap">{row.date}</td>
                                                                <td className="px-6 py-2.5 text-sm text-right whitespace-nowrap font-mono">{row[labels.key1_net]?.toLocaleString()}</td>
                                                                <td className="px-6 py-2.5 text-sm text-right whitespace-nowrap font-mono">{row[labels.key1_idx] !== null ? row[labels.key1_idx]?.toFixed(1) : '-'}</td>
                                                                <td className="px-6 py-2.5 text-sm text-right whitespace-nowrap font-mono">{row[labels.key2_net]?.toLocaleString()}</td>
                                                                <td className="px-6 py-2.5 text-sm text-right whitespace-nowrap font-mono">{row[labels.key2_idx] !== null ? row[labels.key2_idx]?.toFixed(1) : '-'}</td>
                                                                <td className="px-6 py-2.5 text-sm text-right whitespace-nowrap font-mono">{row[labels.key3_net]?.toLocaleString()}</td>
                                                                <td className="px-6 py-2.5 text-sm text-right whitespace-nowrap font-mono">{row[labels.key3_idx] !== null ? row[labels.key3_idx]?.toFixed(1) : '-'}</td>
                                                                <td className="px-6 py-2.5 text-sm text-right whitespace-nowrap font-mono">{row.open_interest?.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CotAnalysis;
