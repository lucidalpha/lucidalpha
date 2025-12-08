import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ResultsTable from '../components/ResultsTable';
import { Loader2, ArrowLeft } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, ReferenceLine, AreaChart, Area, ReferenceArea
} from 'recharts';

// Reuse the AssetOverview and AssetCotView components logic, 
// or import them if we refactor AssetList to export them.
// For simplicity and independence, I will inline the necessary logic here adapted for a full page view.

// --- Sub-Component: Overview (Price & Seasonality) ---
const AssetOverview = ({ ticker }) => {
    const [results, setResults] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.post('http://localhost:8000/analyze_ticker', {
                    ticker: ticker
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
        if (ticker) fetchData();
    }, [ticker]);

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading Overview...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    // Simplified Structure for combined view
    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Price Chart - Full Width */}
            <div className="w-full flex flex-col min-h-[500px]">
                <h3 className="text-lg font-semibold text-white mb-2">Price History (Daily)</h3>
                <div className="flex-1 border border-gray-800 rounded-xl bg-black/50 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} minTickGap={50} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                            <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                            <Line type="monotone" dataKey="close" stroke="#fff" dot={false} strokeWidth={2} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex flex-row gap-8 w-full h-[600px]">
                {/* Seasonality Table - Left Half */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-white">Seasonality Patterns</h3>
                    </div>
                    <div className="flex-1 overflow-auto border border-gray-800 rounded-xl bg-black/50">
                        <ResultsTable results={results || []} />
                    </div>
                </div>

                {/* CoT Report - Right Half Placeholder is handled by parent grid/flex usually, but here we inject CoTView via prop or render separate */}
                {/* Note: The user wants CoT NEXT to Seasonality. So AssetOverview needs to change effectively or we restructure the parent to hold them side by side.
                     Actually, better to have AssetAnalysisWindow manage the layout and these components just return specific blocks. 
                     Refactoring detailed below.
                  */}
            </div>
        </div>
    );
};

// Refactoring AssetOverview to JUST return the data/logic hooks or minimal UI components? 
// No, let's keep it simple. The user wants Price Chart Top, then split row: Seasonality | CoT.
// I will modify AssetOverview to ONLY render the price chart and seasonality, but wait, the prompt asks to put CoT NEXT to Seasonality.
// So:
// Row 1: Price Chart (Full Width)
// Row 2: Seasonality (Left) | CoT (Right)


// --- Constants (duplicated for robustness for now) ---
const ASSET_CATEGORIES = {
    "Währungsfutures": ["DX=F", "6C=F", "6A=F", "6E=F", "6B=F", "6S=F", "6N=F", "6J=F"],
    "Agrarfutures": ["CC=F", "ZS=F", "SB=F", "KC=F", "ZW=F", "ZC=F"],
    "Commodity Futures": ["CL=F", "NG=F", "PA=F", "GC=F", "SI=F", "PL=F", "HG=F"],
    "Indices Futures": ["NQ=F", "^GDAXI", "ES=F", "YM=F", "RTY=F"]
};

const getCategoryByTicker = (ticker) => {
    for (const [cat, tickers] of Object.entries(ASSET_CATEGORIES)) {
        if (tickers.includes(ticker)) return cat;
    }
    return null;
};

// --- Sub-Component: CoT View ---
const AssetCotView = ({ ticker, category }) => {
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

    // Explicitly define assets that support TFF and Disagg
    const TFF_SUPPORTED_TICKERS = [
        "DX=F", "6C=F", "6A=F", "6E=F", "6B=F", "6S=F", "6N=F", "6J=F", // Currencies
        "NQ=F", "ES=F", "YM=F", "RTY=F" // US Indices
    ];
    // Commodities usually support Disaggregated
    const DISAGG_SUPPORTED_TICKERS = [
        "CC=F", "ZS=F", "SB=F", "KC=F", "ZW=F", "ZC=F", // Agri
        "CL=F", "NG=F", "PA=F", "GC=F", "SI=F", "PL=F", "HG=F" // Energy/Metals
    ];

    const supportsTff = TFF_SUPPORTED_TICKERS.includes(ticker);
    const supportsDisagg = DISAGG_SUPPORTED_TICKERS.includes(ticker);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:8000/cot/${ticker}`, {
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
        if (ticker) fetchData();
    }, [ticker, reportType, lookback]);

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
        if (reportType === 'disaggregated') {
            return {
                line1: "Prod/Merc", key1_net: "pm_net", key1_idx: "pm_index",
                line2: "Swap Dlr", key2_net: "swap_net", key2_idx: "swap_index",
                line3: "Mng Money", key3_net: "mm_net", key3_idx: "mm_index"
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
        <div className="flex flex-col gap-6 w-full">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex gap-2">
                    <div className="flex bg-black rounded-lg p-1 border border-gray-800">
                        <button onClick={() => setReportType('legacy')} className={`px-3 py-1 text-xs rounded transition-colors ${reportType === 'legacy' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Legacy</button>
                        {supportsTff && (
                            <button onClick={() => setReportType('tff')} className={`px-3 py-1 text-xs rounded transition-colors ${reportType === 'tff' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>TFF</button>
                        )}
                        {supportsDisagg && (
                            <button onClick={() => setReportType('disaggregated')} className={`px-3 py-1 text-xs rounded transition-colors ${reportType === 'disaggregated' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Disagg</button>
                        )}
                    </div>
                    <div className="flex bg-black rounded-lg p-1 border border-gray-800">
                        <button onClick={() => setViewMode('index')} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'index' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Index</button>
                        <button onClick={() => setViewMode('net')} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === 'net' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Net</button>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={showLine1} onChange={e => setShowLine1(e.target.checked)} className="rounded border-gray-700 bg-gray-800 text-blue-500" />
                        <span style={{ color: '#3b82f6' }}>{labels.line1}</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={showLine2} onChange={e => setShowLine2(e.target.checked)} className="rounded border-gray-700 bg-gray-800 text-green-500" />
                        <span style={{ color: '#22c55e' }}>{labels.line2}</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={showLine3} onChange={e => setShowLine3(e.target.checked)} className="rounded border-gray-700 bg-gray-800 text-red-500" />
                        <span style={{ color: '#ef4444' }}>{labels.line3}</span>
                    </label>
                </div>

                <div className="flex bg-black rounded-lg p-1 border border-gray-800">
                    <button onClick={() => setLookback(26)} className={`px-3 py-1 text-xs rounded transition-colors ${lookback === 26 ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>6 M</button>
                    <button onClick={() => setLookback(156)} className={`px-3 py-1 text-xs rounded transition-colors ${lookback === 156 ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>3 J</button>
                </div>

                <div className="flex bg-black rounded-lg p-1 border border-gray-800">
                    {['All', '10Y', '5Y', '3Y', '1Y'].map(r => (
                        <button key={r} onClick={() => setRange(r)} className={`px-2 py-1 text-xs rounded transition-colors ${range === r ? 'text-white bg-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>{r}</button>
                    ))}
                </div>
            </div>

            {/* Main Chart */}
            <div className="h-[500px] bg-black border border-gray-800 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>

                        <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} minTickGap={50} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                        <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                        <Legend />

                        {viewMode === 'index' && (
                            <>
                                <ReferenceArea y1={80} y2={120} fill="rgba(34, 197, 94, 0.1)" stroke="none" />
                                <ReferenceArea y1={-20} y2={20} fill="rgba(239, 68, 68, 0.1)" stroke="none" />
                                <ReferenceLine y={100} stroke="#444" strokeDasharray="3 3" />
                                <ReferenceLine y={0} stroke="#444" strokeDasharray="3 3" />
                            </>
                        )}

                        {showLine1 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key1_idx : labels.key1_net} name={labels.line1} stroke="#3b82f6" dot={false} strokeWidth={2} connectNulls isAnimationActive={false} />}
                        {showLine2 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key2_idx : labels.key2_net} name={labels.line2} stroke="#22c55e" dot={false} strokeWidth={2} connectNulls isAnimationActive={false} />}
                        {showLine3 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key3_idx : labels.key3_net} name={labels.line3} stroke="#ef4444" dot={false} strokeWidth={2} connectNulls isAnimationActive={false} />}
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

const AssetPriceChart = ({ ticker }) => {
    const [allData, setAllData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [range, setRange] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.post('http://localhost:8000/analyze_ticker', { ticker });
                const data = response.data.chart_data || [];
                setAllData(data);
                filterData(data, range);
            } catch (err) {
                console.error("Error fetching chart data:", err);
                setError(err.message);
            }
            finally { setLoading(false); }
        };
        if (ticker) fetchData();
    }, [ticker]);

    useEffect(() => {
        filterData(allData, range);
    }, [range, allData]);

    const filterData = (data, selectedRange) => {
        if (!data || data.length === 0) {
            setChartData([]);
            return;
        }
        if (selectedRange === 'All') {
            setChartData(data);
            return;
        }

        const now = new Date();
        const cutoff = new Date();
        if (selectedRange === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
        if (selectedRange === '3Y') cutoff.setFullYear(now.getFullYear() - 3);
        if (selectedRange === '5Y') cutoff.setFullYear(now.getFullYear() - 5);

        const filtered = data.filter(d => new Date(d.date) >= cutoff);
        setChartData(filtered);
    };

    if (loading) return <div className="h-full flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2" /> Loading Chart...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-red-500">Error: {error}</div>;
    // Fix: Logical precedence in condition
    if ((!chartData || chartData.length === 0) && (!allData || allData.length === 0)) return <div className="h-full flex items-center justify-center text-gray-500">No price data available for {ticker}</div>;

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Price History (Daily)</h3>
                <div className="flex bg-black rounded-lg p-1 border border-gray-800">
                    {['1Y', '3Y', '5Y', 'All'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${range === r ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[500px] border border-gray-800 rounded-xl bg-black/50 p-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} minTickGap={50} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                        <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={(val) => val.toFixed(4)} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} labelFormatter={(label) => new Date(label).toLocaleDateString()} formatter={(value) => [value, 'Price']} />
                        <Line type="monotone" dataKey="close" stroke="#fff" dot={false} strokeWidth={2} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Main Page Component ---
const AssetAnalysisWindow = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const ticker = searchParams.get('ticker');
    const name = searchParams.get('name');
    const urlCategory = searchParams.get('category');

    // Fallback if category is missing or generic "Asset"
    const category = (urlCategory && urlCategory !== 'Asset') ? urlCategory : getCategoryByTicker(ticker);

    // Default tab removed in favor of single view
    // const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        // Set document title
        if (name) document.title = `${name} - Analysis`;
    }, [name]);

    if (!ticker) return <div className="p-10 text-white">No asset selected.</div>;

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/trading')}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Back to Trading"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">{name}</h1>
                    <span className="text-sm font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded">{ticker}</span>
                    {category && <span className="text-xs text-blue-400 border border-blue-900/30 px-2 py-0.5 rounded-full">{category}</span>}
                </div>
            </div>

            {/* Content Area - unified view */}
            <div className="flex-1 min-h-0 flex flex-col gap-8 overflow-y-auto pb-10">
                {/* 1. Price Chart (Full Width) */}
                <div className="w-full min-h-[500px]">
                    <AssetPriceChart ticker={ticker} />
                </div>

                {/* 2. Split Row: Seasonality | CoT Analysis (Conditional) */}
                {category === 'Aktien' ? (
                    /* Layout for Stocks: Just Seasonality, no CoT */
                    <div className="flex flex-col xl:flex-row gap-8 items-start min-h-[600px]">
                        <div className="flex-1 min-w-0 max-w-[50%]">
                            <AssetSeasonalityTable ticker={ticker} />
                        </div>
                    </div>
                ) : (
                    /* Layout for Futures/Trading: Seasonality + CoT */
                    <div className="flex flex-col xl:flex-row gap-8 items-start min-h-[600px]">
                        <div className="flex-1 min-w-0">
                            <AssetSeasonalityTable ticker={ticker} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <AssetCotView ticker={ticker} category={category} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AssetSeasonalityTable = ({ ticker }) => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.post('http://localhost:8000/analyze_ticker', { ticker });
                setResults(response.data.results);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        if (ticker) fetchData();
    }, [ticker]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-white">Seasonality Patterns</h3>
            </div>
            <div className="flex-1 overflow-auto border border-gray-800 rounded-xl bg-black/50 min-h-[400px]">
                <ResultsTable results={results || []} />
            </div>
        </div>
    );
};


export default AssetAnalysisWindow;
