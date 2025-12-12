import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { Search, Loader2, ArrowLeft, Play, BarChart2 } from 'lucide-react';
import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Brush,
    Scatter,
    Cell
} from 'recharts';

// --- THEME CONSTANTS ---
const THEME = {
    bg: "#131722",
    panel: "#1e222d",
    border: "#2a2e39",
    text: "#d1d4dc",
    up: "#22c55e",
    down: "#ef4444",
    grid: "#2a2e39",
    tooltipBg: "#1e222d",
    accent: "#facc15" // Yellow/Gold for composite
};

const Cycles = () => {
    // --- STATE ---
    const [view, setView] = useState('search');
    const [query, setQuery] = useState('');
    const [ticker, setTicker] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState(null);
    const [selectedCycles, setSelectedCycles] = useState({}); // { id: boolean }
    const [showProjection, setShowProjection] = useState(true);

    // Timeframe State
    const [timeRange, setTimeRange] = useState('MAX');

    // --- EFFECT: SUGGESTIONS ---
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }
            if (view !== 'search') return;

            try {
                const res = await axios.get(apiUrl(`/search_ticker?q=${query}`));
                setSuggestions(res.data.results || []);
            } catch (e) {
                console.warn(e);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [query, view]);

    // --- COMPOSITE CALCULATION ---
    // Calculate composite wave and scale to price axis
    const chartDataWithComposite = React.useMemo(() => {
        if (!chartData.length || !scanResults || !scanResults.cycles) return chartData;

        // Find active IDs
        const activeIds = Object.keys(selectedCycles).filter(id => selectedCycles[id]);

        // If no cycles are active, return data with composite explicitly set to null
        if (activeIds.length === 0) {
            return chartData.map(point => ({ ...point, composite: null }));
        }

        // Get Active Cycle Params
        const activeCycles = scanResults.cycles.filter(c => selectedCycles[c.id]);

        // Calculate raw composite wave
        const rawComposite = chartData.map((point, index) => {
            let combinedWave = 0;
            const t = index;

            activeCycles.forEach(c => {
                // Least-squares fitted formula: A * cos(ωt + φ)
                const omega = 2.0 * Math.PI / c.period;
                const amplitude = c.amplitude || c.amp || 0;
                const phase = c.phase || 0;
                combinedWave += amplitude * Math.cos(omega * t + phase);
            });

            return combinedWave;
        });

        // IMPORTANT: Display composite on PRICE scale by adding to trend
        // This creates a visual "price forecast" that correlates with actual price
        return chartData.map((point, index) => {
            const trend = point.trend || 0;
            const cycleValue = rawComposite[index];

            return {
                ...point,
                composite: cycleValue,  // Raw cycle (for secondary axis if needed)
                cycleForecast: trend + cycleValue  // Cycle added to trend = price-scale forecast
            };
        });
    }, [chartData, scanResults, selectedCycles]);


    // --- ACTIONS ---
    const loadTicker = async (selectedTicker) => {
        setLoading(true);
        setError(null);
        if (setStatusMsg) setStatusMsg(`Requesting ${selectedTicker}...`);
        setTicker(selectedTicker);
        setScanResults(null);
        setSelectedCycles({}); // Reset selection

        try {
            console.log("SENDING REQUEST...");
            const res = await axios.post(apiUrl('/ticker_history'), { ticker: selectedTicker });

            if (setStatusMsg) setStatusMsg("Data received. Processing...");

            if (res.data && res.data.chart_data && res.data.chart_data.length > 0) {
                const sorted = (res.data.chart_data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
                setChartData(sorted);
                if (setStatusMsg) setStatusMsg("Rendering...");
                setView('chart');
            } else {
                setError("Keine Daten gefunden.");
                if (setStatusMsg) setStatusMsg("Empty response.");
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || err.message;
            setError("Fehler: " + msg);
            if (setStatusMsg) setStatusMsg("Error: " + msg);
            alert("Fehler beim Laden: " + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!query) return;
        let target = query.toUpperCase();
        if (suggestions.length > 0) {
            target = suggestions[0].symbol;
        }
        loadTicker(target);
    };

    const handleBack = () => {
        setView('search');
        setChartData([]);
        setTicker(null);
        setSuggestions([]);
        setTimeRange('MAX');
        setScanResults(null);
        setSelectedCycles({});
    };

    const runScan = async () => {
        if (!ticker) return;
        setIsScanning(true);
        setSelectedCycles({}); // Reset on new scan
        try {
            const res = await axios.post(apiUrl('/cycles/analyze'), {
                ticker: ticker,
                period: "max"  // Load ALL historical data for accurate cycle detection
            });
            setScanResults(res.data);

            // The backend returns the full dataset used (including forecast padding).
            // We MUST use this to align t=0 correctly with the cycles.
            if (res.data.chart_data && res.data.chart_data.length > 0) {
                // Map 'price' to 'close' for consistency with Recharts Area component
                const mappedData = res.data.chart_data.map(d => ({
                    ...d,
                    close: d.price // Ensure close is populated from price
                }));
                setChartData(mappedData);

                // Auto-select top 5 cycles for immediate feedback
                if (res.data.cycles.length > 0) {
                    const initialSelection = {};
                    res.data.cycles.slice(0, Math.min(5, res.data.cycles.length)).forEach(c => {
                        initialSelection[c.id] = true;
                    });
                    setSelectedCycles(initialSelection);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Scan failed: " + e.message);
        } finally {
            setIsScanning(false);
        }
    };

    const toggleCycle = (id) => {
        setSelectedCycles(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // --- FILTER LOGIC ---
    const getFilteredData = () => {
        const data = chartDataWithComposite;
        if (!data.length) return [];
        if (timeRange === 'MAX') return data;

        const now = new Date();
        let cutoff = new Date();

        switch (timeRange) {
            case '1M': cutoff.setMonth(now.getMonth() - 1); break;
            case '6M': cutoff.setMonth(now.getMonth() - 6); break;
            case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break;
            case '5Y': cutoff.setFullYear(now.getFullYear() - 5); break;
            default: return data;
        }

        return data.filter(d => new Date(d.date) >= cutoff);
    };

    const filteredData = getFilteredData();


    // --- RENDER ---
    return (
        <div style={{ backgroundColor: THEME.bg, color: THEME.text }} className="h-screen w-full flex flex-col overflow-hidden font-sans">

            {/* SEARCH VIEW */}
            {view === 'search' && (
                <div className="flex flex-col items-center justify-center flex-1 p-6 animate-in fade-in zoom-in-95 duration-300">
                    <h1 className="text-3xl font-bold mb-8 text-white tracking-tight">Cycles Scanner</h1>



                    <div className="w-full max-w-lg relative">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit(e)}
                                placeholder="Ticker suchen (z.B. AAPL)..."
                                className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-xl py-4 pl-12 pr-12 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xl"
                            />
                            {loading && <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />}
                        </div>
                        {suggestions.length > 0 && (
                            <div className="absolute w-full mt-2 bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden shadow-2xl z-[100]">
                                {suggestions.map((item) => (
                                    <div
                                        key={item.symbol}
                                        className="p-3 hover:bg-[#2a2e39] cursor-pointer border-b border-[#2a2e39] last:border-0 flex justify-between items-center transition-colors px-4"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            // Call loadTicker directly
                                            loadTicker(item.symbol);
                                        }}
                                    // Removed onClick to rely on onMouseDown
                                    >
                                        <div>
                                            <div className="font-bold text-gray-200">{item.symbol}</div>
                                            <div className="text-xs text-gray-500">{item.shortname || item.longname}</div>
                                        </div>
                                        <div className="text-xs text-gray-600 bg-black/20 px-2 py-1 rounded">{item.exchange}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* CHART VIEW */}
            {view === 'chart' && (
                <div className="flex flex-col h-full bg-[#131722] p-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={handleBack} className="p-2 bg-[#1e222d] border border-[#2a2e39] hover:bg-[#2a2e39] rounded-lg text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-wide">{ticker}</h2>
                                <p className="text-xs text-gray-500">Price History & Cycle Analysis</p>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="flex flex-row gap-6 h-[calc(100vh-140px)]">

                        {/* LEFT: CHART CARD */}
                        <div className="flex-1 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-lg p-4 flex flex-col gap-4">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between border-b border-[#2a2e39] pb-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-semibold text-gray-300">Overview</h3>
                                    <button
                                        onClick={runScan}
                                        disabled={isScanning}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                        {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                        {isScanning ? "Scanning..." : "Run Scanner"}
                                    </button>

                                    {scanResults && (
                                        <div className="flex items-center gap-2 ml-4 border-l border-[#2a2e39] pl-4">
                                            <input
                                                type="checkbox"
                                                id="showProj"
                                                checked={showProjection}
                                                onChange={e => setShowProjection(e.target.checked)}
                                                className="w-3 h-3 rounded border-gray-600 bg-[#1e222d] text-blue-600 focus:ring-blue-500/20"
                                            />
                                            <label htmlFor="showProj" className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-300">
                                                Show Forecast
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="flex bg-[#131722] rounded-lg p-1 border border-[#2a2e39]">
                                    {['1M', '6M', '1Y', '5Y', 'MAX'].map(range => (
                                        <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${timeRange === range ? 'bg-[#3b82f6] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="flex-1 w-full min-h-0 relative flex flex-col">
                                <div className="flex-1 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={filteredData}>
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke={THEME.text}
                                                tickFormatter={(val) => {
                                                    const d = new Date(val);
                                                    return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                                                }}
                                                minTickGap={50}
                                                tick={{ fontSize: 10 }}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                stroke={THEME.text}
                                                domain={['auto', 'auto']}
                                                tickFormatter={(val) => val.toFixed(2)}
                                                width={50}
                                            />
                                            <YAxis
                                                yAxisId="cycle"
                                                orientation="right"
                                                stroke="#facc15"
                                                domain={['auto', 'auto']}
                                                hide={false}
                                                tick={false}
                                                width={10}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: THEME.tooltipBg, borderColor: THEME.border }}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            />
                                            <Area
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="close"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fill="none"
                                                animationDuration={500}
                                                name="Price"
                                            />

                                            {/* Pure Sine Wave Composite - on separate Y-axis */}
                                            {showProjection && (
                                                <Line
                                                    yAxisId="cycle"
                                                    type="monotone"
                                                    dataKey="composite"
                                                    stroke="#facc15"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    connectNulls
                                                    name="Cycle Wave"
                                                    animationDuration={300}
                                                />
                                            )}

                                            <Brush
                                                dataKey="date"
                                                height={30}
                                                stroke="#3b82f6"
                                                fill="#1e222d"
                                                tickFormatter={(val) => {
                                                    const d = new Date(val);
                                                    return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                                                }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>


                            </div>
                        </div>

                        {/* RIGHT: RESULTS TABLE */}
                        <div className="w-[400px] flex flex-col gap-6">
                            {/* Cycles List */}
                            <div className="flex-1 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-lg flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-[#2a2e39] flex items-center justify-between bg-[#131722]">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <BarChart2 className="w-4 h-4 text-blue-500" />
                                        Dominant Cycles
                                    </h3>
                                    {scanResults && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Active</span>}
                                </div>

                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    {!scanResults ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                            <Play className="w-12 h-12 mb-4 opacity-20" />
                                            <p>Click "Run Scanner" to analyze cycles.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-[#1e222d] z-10">
                                                <tr className="text-xs font-semibold text-gray-500 border-b border-[#2a2e39]">
                                                    <th className="py-2 pl-2 w-8"></th>
                                                    <th className="py-2 text-center text-[10px] uppercase tracking-wider">Len</th>
                                                    <th className="py-2 text-right text-[10px] uppercase tracking-wider">Amp</th>
                                                    <th className="py-2 text-right text-[10px] uppercase tracking-wider">Strg ↓</th>
                                                    <th className="py-2 text-right pr-2 text-[10px] uppercase tracking-wider">Stab</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scanResults.cycles.map((cycle, i) => (
                                                    <tr key={cycle.id || i} className="border-b border-[#2a2e39]/50 hover:bg-[#2a2e39]/50 transition-colors group text-sm">
                                                        <td className="py-2 pl-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!selectedCycles[cycle.id]}
                                                                onChange={() => toggleCycle(cycle.id)}
                                                                className="w-4 h-4 rounded border-gray-500 bg-[#2a2e39] text-blue-500 focus:ring-0 checked:bg-blue-600 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-2 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${cycle.period < 20 ? 'bg-red-500' : cycle.period < 60 ? 'bg-orange-500' : 'bg-[#22c55e]'}`}>
                                                                {(cycle.period || cycle.length || 0).toFixed(0)}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-right font-mono text-gray-300">{(cycle.amplitude || cycle.amp || 0).toFixed(2)}</td>
                                                        <td className="py-2 text-right font-mono text-gray-300">{(cycle.strength || cycle.strg || 0).toFixed(3)}</td>
                                                        <td className="py-2 text-right pr-2 font-mono font-bold text-white">{((cycle.bartels_score || cycle.bartels || 0) / 100).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
};

export default Cycles;
