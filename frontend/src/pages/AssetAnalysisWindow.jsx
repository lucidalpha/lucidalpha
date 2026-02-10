import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../config/api';

import { Loader2, ArrowLeft, TrendingUp, ChevronDown, ChevronUp, Briefcase, Users, Globe, ExternalLink } from 'lucide-react';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, ReferenceLine, AreaChart, Area, ReferenceArea, PieChart, Pie, Cell
} from 'recharts';

// --- Constants ---
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
const AssetCotView = ({ ticker, category, onSignalsChange }) => {
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

    // Zoom State (100 = 100% = Normal view)
    const [zoomLevel, setZoomLevel] = useState(100);

    // --- Backtest Signal State ---
    const [signalParticipant, setSignalParticipant] = useState('commercials');
    const [signalOver80, setSignalOver80] = useState(false);
    const [signalUnder20, setSignalUnder20] = useState(false);
    const [signalShowZones, setSignalShowZones] = useState(false);

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
            // ... existing fetch logic
            setLoading(true);
            try {
                const response = await axios.get(apiUrl(`/cot/${ticker}`), {
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

    // Labels & Keys Helper
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

    // --- Signal Calculation Logic ---
    useEffect(() => {
        if (!cotData || cotData.length === 0 || !onSignalsChange) return;

        // Only calculate signals if at least one checkbox is active
        if (!signalOver80 && !signalUnder20) {
            onSignalsChange([]);
            return;
        }

        // Determine which field to track
        let indexKey = '';
        if (reportType === 'legacy') {
            if (signalParticipant === 'commercials') indexKey = 'commercial_index';
            if (signalParticipant === 'large_spec') indexKey = 'large_spec_index';
            if (signalParticipant === 'small_spec') indexKey = 'small_spec_index';
        } else if (reportType === 'tff') {
            if (signalParticipant === 'commercials') indexKey = 'dealer_index';
            if (signalParticipant === 'large_spec') indexKey = 'asset_index';
            if (signalParticipant === 'small_spec') indexKey = 'lev_index';
        } else if (reportType === 'disaggregated') {
            if (signalParticipant === 'commercials') indexKey = 'pm_index';
            if (signalParticipant === 'large_spec') indexKey = 'mm_index';
            if (signalParticipant === 'small_spec') indexKey = 'swap_index';
        }

        if (!indexKey) return;

        const signals = [];
        let inZoneHigh = false;
        let startHigh = null;
        let inZoneLow = false;
        let startLow = null;

        const sorted = [...cotData].sort((a, b) => new Date(a.date) - new Date(b.date));

        sorted.forEach((d, idx) => {
            const val = d[indexKey];
            if (val === undefined || val === null) return;

            // Check > 80
            if (signalOver80) {
                if (val > 80) {
                    if (!inZoneHigh) {
                        inZoneHigh = true;
                        startHigh = d.date;
                        if (!signalShowZones) {
                            signals.push({ type: 'line', date: d.date, color: '#22c55e', label: '>80' });
                        }
                    }
                } else {
                    if (inZoneHigh) {
                        inZoneHigh = false;
                        if (signalShowZones && startHigh) {
                            signals.push({ type: 'zone', startDate: startHigh, endDate: d.date, color: '#22c55e' });
                        }
                        startHigh = null;
                    }
                }
            }

            // Check < 20
            if (signalUnder20) {
                if (val < 20) {
                    if (!inZoneLow) {
                        inZoneLow = true;
                        startLow = d.date;
                        if (!signalShowZones) {
                            signals.push({ type: 'line', date: d.date, color: '#ef4444', label: '<20' });
                        }
                    }
                } else {
                    if (inZoneLow) {
                        inZoneLow = false;
                        if (signalShowZones && startLow) {
                            signals.push({ type: 'zone', startDate: startLow, endDate: d.date, color: '#ef4444' });
                        }
                        startLow = null;
                    }
                }
            }
        });

        // Close any open zones at the end
        if (signalShowZones) {
            const lastDate = sorted[sorted.length - 1].date;
            if (inZoneHigh && startHigh) {
                signals.push({ type: 'zone', startDate: startHigh, endDate: lastDate, color: '#22c55e' });
            }
            if (inZoneLow && startLow) {
                signals.push({ type: 'zone', startDate: startLow, endDate: lastDate, color: '#ef4444' });
            }
        }

        onSignalsChange(signals);

    }, [cotData, signalParticipant, signalOver80, signalUnder20, signalShowZones, reportType, onSignalsChange]);

    // --- Domain Calculation Logic ---
    const getChartDomain = () => {
        if (viewMode === 'index') {
            // Base: 0 to 100
            // Zoom > 100 -> Zoom In (e.g. 25-75)
            // Zoom < 100 -> Zoom Out (e.g. -50 to 150)
            const center = 50;
            const fullSpan = 100;

            // Factor: 100 -> 1.0, 200 -> 0.5 (shows half range), 50 -> 2.0 (shows double range)
            const factor = 100 / zoomLevel;
            const currentSpan = fullSpan * factor;

            return [center - currentSpan / 2, center + currentSpan / 2];
        } else {
            // Net view: 'auto' is tricky to zoom manually without knowing min/max.
            // Let's rely on Recharts 'dataMin' / 'dataMax' if zoom is 100.
            // If zoom != 100, we need absolute numbers.
            if (zoomLevel === 100) return ['auto', 'auto'];

            // Calculate min/max from data to pivot around
            if (!filteredData || filteredData.length === 0) return ['auto', 'auto'];

            const keys = [
                showLine1 ? labels.key1_net : null,
                showLine2 ? labels.key2_net : null,
                showLine3 ? labels.key3_net : null
            ].filter(Boolean);

            let min = Infinity;
            let max = -Infinity;

            filteredData.forEach(d => {
                keys.forEach(k => {
                    const val = d[k];
                    if (val !== undefined && val !== null) {
                        if (val < min) min = val;
                        if (val > max) max = val;
                    }
                });
            });

            if (min === Infinity || max === -Infinity) return ['auto', 'auto'];

            const center = (max + min) / 2;
            const fullSpan = max - min || 1000; // fallback span

            const factor = 100 / zoomLevel;
            const currentSpan = fullSpan * factor;

            return [center - currentSpan / 2, center + currentSpan / 2];
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading CoT Data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const currentDomain = getChartDomain();

    return (
        <div className="flex flex-col gap-10 w-full animate-fade-in">
            {/* Header / Config Row */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif italic text-white mb-2">Commitment of Traders</h2>
                        <p className="text-[9px] tracking-[0.4em] text-neutral-600 uppercase font-bold">Smart Money Positionierung</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-10 py-8 border-y border-white/[0.03]">
                    <div className="flex flex-wrap gap-8 items-center">
                        <div className="flex bg-white/[0.03] rounded-sm p-0.5 border border-white/[0.05]">
                            {['legacy', 'tff', 'disaggregated'].map(type => (
                                (type === 'legacy' || (type === 'tff' && supportsTff) || (type === 'disaggregated' && supportsDisagg)) && (
                                    <button
                                        key={type}
                                        onClick={() => setReportType(type)}
                                        className={`px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase rounded-sm transition-all duration-700 ${reportType === type ? 'bg-white text-black' : 'text-neutral-600 hover:text-white'}`}
                                    >
                                        {type === 'disaggregated' ? 'Disagg' : type}
                                    </button>
                                )
                            ))}
                        </div>
                        <div className="flex bg-white/[0.03] rounded-sm p-0.5 border border-white/[0.05]">
                            {['index', 'net'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase rounded-sm transition-all duration-700 ${viewMode === mode ? 'bg-[#d4af37] text-black' : 'text-neutral-600 hover:text-white'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex bg-white/[0.03] rounded-sm p-0.5 border border-white/[0.05]">
                            {['1Y', '3Y', '5Y', 'All'].map(r => (
                                <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase rounded-sm transition-all duration-700 ${range === r ? 'bg-white/10 text-white' : 'text-neutral-600 hover:text-white'}`}>{r}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend & Zoom Combined */}
                <div className="flex flex-wrap items-center justify-between gap-6 pb-4">
                    <div className="flex flex-wrap gap-6">
                        {[
                            { id: 1, state: showLine1, set: setShowLine1, color: '#3b82f6', label: labels.line1 },
                            { id: 2, state: showLine2, set: setShowLine2, color: '#22c55e', label: labels.line2 },
                            { id: 3, state: showLine3, set: setShowLine3, color: '#ef4444', label: labels.line3 }
                        ].map(line => (
                            <label key={line.id} className="flex items-center gap-2.5 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" checked={line.state} onChange={e => line.set(e.target.checked)} className="peer w-3.5 h-3.5 opacity-0 absolute z-10 cursor-pointer" />
                                    <div className={`w-3 h-3 rounded-sm border transition-all duration-500 ${line.state ? 'border-white/40' : 'border-white/10 group-hover:border-white/30'}`}>
                                        {line.state && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: line.color }} /></div>}
                                    </div>
                                </div>
                                <span className={`text-[9px] uppercase tracking-[0.2em] font-extrabold transition-colors ${line.state ? 'text-white' : 'text-neutral-600'}`}>{line.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 min-w-[150px]">
                        <span className="text-[8px] text-[#d4af37] font-extrabold uppercase tracking-[0.4em]">Zoom</span>
                        <input
                            type="range" min="50" max="300" value={zoomLevel}
                            onChange={e => setZoomLevel(Number(e.target.value))}
                            className="flex-1 h-[1px] bg-white/10 appearance-none cursor-pointer hover:bg-white/20 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-[#d4af37] [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <span className="text-[9px] font-mono text-neutral-600 w-8">{zoomLevel}%</span>
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="relative h-[400px]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
                <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} minTickGap={50} axisLine={false} tickLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                            <YAxis
                                stroke="rgba(255,255,255,0.2)"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                domain={currentDomain}
                                allowDataOverflow={true}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} labelFormatter={(l) => new Date(l).toLocaleDateString()} />

                            {viewMode === 'index' && (
                                <>
                                    <ReferenceArea y1={80} y2={100} fill="#22c55e" fillOpacity={0.05} stroke="none" />
                                    <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.3} />
                                    <ReferenceArea y1={0} y2={20} fill="#ef4444" fillOpacity={0.05} stroke="none" />
                                    <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.3} />
                                </>
                            )}

                            {showLine1 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key1_idx : labels.key1_net} name={labels.line1} stroke="#3b82f6" dot={false} strokeWidth={1} connectNulls isAnimationActive={false} />}
                            {showLine2 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key2_idx : labels.key2_net} name={labels.line2} stroke="#22c55e" dot={false} strokeWidth={1} connectNulls isAnimationActive={false} />}
                            {showLine3 && <Line type="monotone" dataKey={viewMode === 'index' ? labels.key3_idx : labels.key3_net} name={labels.line3} stroke="#ef4444" dot={false} strokeWidth={1} connectNulls isAnimationActive={false} />}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Open Interest Section */}
            <div className="relative pb-8 border-b border-white/[0.03]">
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-[8px] tracking-[0.4em] font-extrabold text-neutral-600 uppercase">Open Interest</span>
                </div>
                <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData}>
                            <XAxis dataKey="date" hide />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: '#0c0c0c', border: 'none', borderRadius: '1rem' }} />
                            <Area type="monotone" dataKey="open_interest" stroke="#d4af37" fill="url(#colorOI)" strokeWidth={1} fillOpacity={1} />
                            <defs>
                                <linearGradient id="colorOI" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const AssetPriceChart = ({ ticker, cotSignals }) => {
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
                const response = await axios.post(apiUrl('/ticker_history'), { ticker });
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

    // Memoize the data processing to prevent unnecessary calcs
    const processedData = React.useMemo(() => {
        if (!chartData) return [];
        return chartData.map(d => ({
            ...d,
            dateNum: new Date(d.date).getTime()
        }));
    }, [chartData]);

    const processedSignals = React.useMemo(() => {
        if (!cotSignals) return [];
        return cotSignals.map(s => {
            const base = { ...s };
            if (s.date) base.dateNum = new Date(s.date).getTime();
            if (s.startDate) base.startNum = new Date(s.startDate).getTime();
            if (s.endDate) base.endNum = new Date(s.endDate).getTime();
            return base;
        });
    }, [cotSignals]);

    if (loading) return <div className="h-full flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2" /> Loading Chart...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-red-500">Error: {error}</div>;
    if ((!chartData || chartData.length === 0) && (!allData || allData.length === 0)) return <div className="h-full flex items-center justify-center text-gray-500">No price data available for {ticker}</div>;

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-serif italic text-white mb-1">Kursentwicklung</h3>
                    <p className="text-[9px] tracking-[0.4em] font-bold text-neutral-600 uppercase">Markthistorie</p>
                </div>
                <div className="flex bg-white/[0.03] rounded-sm p-0.5 border border-white/[0.05]">
                    {['1Y', '3Y', '5Y', 'All'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-1 text-[9px] font-bold tracking-[0.2em] rounded-sm transition-all duration-700 ${range === r ? 'bg-white text-black' : 'text-neutral-600 hover:text-white'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative h-[450px]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"></div>
                <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis
                                dataKey="dateNum"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                stroke="rgba(255,255,255,0.2)"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                minTickGap={50}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => new Date(val).toLocaleDateString()}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.2)"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                domain={['auto', 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => val.toFixed(2)}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                                labelStyle={{ color: '#d4af37', fontFamily: 'serif', fontStyle: 'italic' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                formatter={(value) => [value.toLocaleString(), 'Kurs']}
                            />

                            {/* CoT Signals */}
                            {processedSignals && processedSignals.map((sig, idx) => {
                                if (sig.type === 'zone') {
                                    return (
                                        <ReferenceArea
                                            key={idx}
                                            x1={sig.startNum}
                                            x2={sig.endNum}
                                            fill={sig.color}
                                            fillOpacity={0.1}
                                            stroke="none"
                                        />
                                    );
                                } else {
                                    return (
                                        <ReferenceLine
                                            key={idx}
                                            x={sig.dateNum}
                                            stroke={sig.color}
                                            strokeWidth={1}
                                            strokeOpacity={0.5}
                                            label={{ value: sig.label, fill: sig.color, fontSize: 8, position: 'insideTopLeft' }}
                                        />
                                    );
                                }
                            })}

                            <Line type="monotone" dataKey="close" stroke="#d4af37" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Component: Stock Institutional View (Live Dashboard) ---
// Compact Helper Table
// --- Sub-Component: Company Profile View ---
// --- Translations & Helpers ---
const translateSector = (s) => {
    const map = {
        "Technology": "Technologie",
        "Consumer Electronics": "Unterhaltungselektronik",
        "Financial Services": "Finanzdienstleistungen",
        "Healthcare": "Gesundheitswesen",
        "Energy": "Energie",
        "Industrials": "Industrie",
        "Utilities": "Versorger",
        "Basic Materials": "Grundstoffe",
        "Communication Services": "Kommunikation",
        "Consumer Cyclical": "Zyklische Konsumgüter",
        "Consumer Defensive": "Basiskonsumgüter",
        "Real Estate": "Immobilien"
    };
    return map[s] || s;
};

// --- Sub-Component: TradingView Widget ---
const TradingViewWidget = ({ symbol }) => {
    const container = useRef();

    useEffect(() => {
        if (!container.current) return;

        // Clear previous script
        container.current.innerHTML = '';

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Europe/Berlin",
            "theme": "dark",
            "style": "1",
            "locale": "de_DE",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "allow_symbol_change": true,
            "save_image": false,
            "calendar": false,
            "hide_side_toolbar": false,
            "support_host": "https://www.tradingview.com",
            "backgroundColor": "rgba(0, 0, 0, 1)"
        });
        container.current.appendChild(script);
    }, [symbol]);

    return (
        <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
            <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
        </div>
    );
};

// --- Sub-Component: Company Profile View ---
const CompanyProfileView = ({ ticker }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await axios.get(apiUrl(`/company_profile/${ticker}`));
                if (res.data && !res.data.error) setProfile(res.data);
            } catch (e) {
                console.error("Profile fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [ticker]);

    if (loading) return <div className="animate-pulse h-64 bg-white/[0.0] rounded-lg"></div>;
    if (!profile) return <div className="text-neutral-500 text-xs text-center py-10">Keine Unternehmensdaten verfügbar.</div>;

    const formatNum = (n) => {
        if (!n) return "-";
        if (n > 1e12) return (n / 1e12).toFixed(2) + " Bio.";
        if (n > 1e9) return (n / 1e9).toFixed(2) + " Mrd.";
        if (n > 1e6) return (n / 1e6).toFixed(2) + " Mio.";
        return n.toLocaleString();
    };

    return (
        <div className="flex flex-col gap-6 p-2 h-full overflow-y-auto custom-scrollbar">
            <div>
                <h3 className="text-xl font-serif italic text-white mb-1">Unternehmensprofil</h3>
                <p className="text-[9px] tracking-[0.2em] font-bold text-neutral-600 uppercase">Grobe Informationen</p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <div className="text-[8px] text-[#d4af37] uppercase tracking-widest mb-1 opacity-70">Sektor</div>
                        <div className="text-sm text-neutral-200 font-medium">{translateSector(profile.sector)}</div>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-[8px] text-[#d4af37] uppercase tracking-widest mb-1 opacity-70">Industrie</div>
                        <div className="text-sm text-neutral-200 font-medium truncate" title={profile.industry}>{translateSector(profile.industry)}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b border-white/[0.1] pb-2">
                    <div>
                        <div className="text-[8px] text-neutral-500 uppercase tracking-widest mb-1">Marktkapitalisierung</div>
                        <div className="text-lg text-white font-serif italic">{formatNum(profile.marketCap)}</div>
                    </div>
                    <Briefcase className="w-4 h-4 text-neutral-700" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                        <div className="text-[7px] text-neutral-500 uppercase tracking-widest mb-1">KGV (PE)</div>
                        <div className="text-sm text-neutral-200 font-mono">{profile.peRatio?.toFixed(2) || '-'}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[7px] text-neutral-500 uppercase tracking-widest mb-1">Div. Rendite</div>
                        <div className="text-sm text-neutral-200 font-mono">{(profile.dividendYield * 100).toFixed(2)}%</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[7px] text-neutral-500 uppercase tracking-widest mb-1">Mitarbeiter</div>
                        <div className="text-sm text-neutral-200 font-mono">{formatNum(profile.employees)}</div>
                    </div>
                </div>

                <div className="mt-2">
                    <div className="text-[8px] text-neutral-500 uppercase tracking-widest mb-2">Beschreibung</div>
                    <p className="text-[11px] leading-relaxed text-neutral-400 font-light text-justify max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {profile.description}
                    </p>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/[0.05]">
                    <Globe className="w-3 h-3 text-neutral-600" />
                    <span className="text-[9px] text-neutral-500">{profile.city}, {profile.country}</span>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Component: Stock News Content ---
const StockNewsContent = ({ ticker }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const res = await axios.get(apiUrl(`/ticker_news/${ticker}`));
                if (Array.isArray(res.data)) setNews(res.data);
            } catch (e) {
                console.error("News fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, [ticker]);

    if (loading) return <div className="text-[9px] text-neutral-500 py-2 text-center animate-pulse">Lade Nachrichten...</div>;
    if (!news || news.length === 0) return <div className="text-[9px] text-neutral-500 py-2 text-center">Keine aktuellen Nachrichten gefunden.</div>;

    return (
        <div className="flex flex-col gap-4">
            {news.map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-1 pb-3 border-b border-white/[0.05] last:border-0 hover:opacity-100 opacity-70 transition-opacity">
                    <div className="flex items-center justify-end mb-1">
                        {/* Source/Publisher removed as requested */}
                        <span className="text-[10px] text-neutral-400 font-mono">{item.date}</span>
                    </div>
                    <h4 className="text-[11px] text-neutral-200 font-medium leading-relaxed group-hover:text-white transition-colors line-clamp-2">
                        {item.title}
                    </h4>
                </a>
            ))}
        </div>
    );
};

// --- Sub-Component: Stock Fundamentals Content ---
// --- Sub-Component: Stock Fundamentals Content (Merged with Extended) ---
const StockFundamentalsContent = ({ ticker }) => {
    const [profile, setProfile] = useState(null);
    const [extended, setExtended] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch both in parallel with allSettled to avoid one failure blocking the other
                const results = await Promise.allSettled([
                    axios.get(apiUrl(`/company_profile/${ticker}`)),
                    axios.get(apiUrl(`/company_financials/${ticker}`))
                ]);

                const [resProfile, resExtended] = results;

                if (resProfile.status === 'fulfilled' && resProfile.value.data && !resProfile.value.data.error) {
                    setProfile(resProfile.value.data);
                } else {
                    console.warn("Profile fetch failed or empty", resProfile);
                }

                if (resExtended.status === 'fulfilled' && resExtended.value.data && !resExtended.value.data.error) {
                    setExtended(resExtended.value.data);
                } else {
                    console.warn("Extended financials fetch failed or empty", resExtended);
                }

            } catch (e) {
                console.error("Fundamentals fetch error (unexpected)", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ticker]);

    if (loading) return <div className="text-[9px] text-neutral-500 py-2 text-center animate-pulse">Lade Daten...</div>;
    if (!profile) return <div className="text-[9px] text-neutral-500 py-2 text-center">Keine Daten verfügbar.</div>;

    const formatCurr = (v) => v ? v.toLocaleString('de-DE', { style: 'currency', currency: profile.currency || 'USD' }) : '-';
    // const formatNum = (v) => v ? v.toLocaleString('de-DE') : '-'; // Duplicate helper
    const formatPct = (v) => v ? (v * 100).toFixed(2) + '%' : '-';
    const formatLarge = (n) => {
        if (!n) return "-";
        if (n > 1e12) return (n / 1e12).toFixed(2) + " Bio.";
        if (n > 1e9) return (n / 1e9).toFixed(2) + " Mrd.";
        if (n > 1e6) return (n / 1e6).toFixed(2) + " Mio.";
        return n.toLocaleString();
    };

    const Section = ({ title, children }) => (
        <div className="flex flex-col gap-2 mb-4 last:mb-0">
            <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/[0.1] pb-1">{title}</h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {children}
            </div>
        </div>
    );

    const Item = ({ label, value }) => (
        <div className="flex flex-col">
            <span className="text-[9px] text-neutral-500 uppercase">{label}</span>
            <span className="text-[12px] text-neutral-200 font-mono truncate">{value}</span>
        </div>
    );

    return (
        <div className="flex flex-col pr-1 gap-6">
            {/* --- Basic Fundamentals --- */}
            <div>
                <Section title="Kurs">
                    <Item label="Kurs" value={formatCurr(profile.currentPrice)} />
                    <Item label="Tagesspanne" value={`${profile.dayLow?.toFixed(2) || '-'} - ${profile.dayHigh?.toFixed(2) || '-'}`} />
                    <Item label="Marktkap." value={formatLarge(profile.marketCap)} />
                </Section>

                <Section title="Performance">
                    <Item label="Beta" value={profile.beta?.toFixed(2)} />
                    <Item label="52W Spanne" value={`${profile.fiftyTwoWeekLow?.toFixed(2) || '-'} - ${profile.fiftyTwoWeekHigh?.toFixed(2) || '-'}`} />
                    <Item label="Volumen (Ø)" value={formatLarge(profile.averageVolume)} />
                </Section>

                <Section title="Bewertung">
                    <Item label="KGV (PE)" value={profile.peRatio?.toFixed(2)} />
                    <Item label="KBV (PB)" value={profile.priceToBook?.toFixed(2)} />
                    <Item label="KUV (PS)" value={profile.pricesToSales?.toFixed(2)} />
                    <Item label="EV/EBITDA" value={profile.enterpriseToEbitda?.toFixed(2)} />
                    <Item label="Div. Rendite" value={formatPct(profile.dividendYield)} />
                </Section>

                <Section title="Profitabilität">
                    <Item label="Eigenkapitalrendite" value={formatPct(profile.returnOnEquity)} />
                    <Item label="Gesamtkapitalrendite" value={formatPct(profile.returnOnAssets)} />
                    <Item label="Gewinnmarge" value={formatPct(profile.profitMargins)} />
                    <Item label="Operative Marge" value={formatPct(profile.operatingMargins)} />
                </Section>

                <Section title="Bilanz & GuV">
                    <Item label="Umsatz" value={formatLarge(profile.totalRevenue)} />
                    <Item label="Nettogewinn" value={formatLarge(profile.netIncome)} />
                    <Item label="Cash" value={formatLarge(profile.totalCash)} />
                    <Item label="Verschuldungsgrad" value={profile.debtToEquity?.toFixed(2)} />
                </Section>
            </div>

            {/* --- Extended Financials (Tables) --- */}
            {extended && (
                <div className="flex flex-col gap-6 pt-4 border-t border-white/[0.1]">
                    {/* 1. Annual Trends */}
                    {extended.trends && extended.trends.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/[0.1] pb-1">Finanzdaten-Trend (Jährlich)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[8px] text-neutral-500 uppercase tracking-wider">
                                            <th className="font-normal pb-1">Metrik</th>
                                            {extended.trends.slice(0, 3).map(y => <th key={y.year} className="font-normal pb-1 text-right">{y.year}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.05]">
                                        <tr className="group">
                                            <td className="py-1 text-[9px] text-neutral-300">Umsatz</td>
                                            {extended.trends.slice(0, 3).map(y => <td key={y.year} className="py-1 text-[9px] text-right font-mono text-neutral-400">{formatLarge(y.revenue)}</td>)}
                                        </tr>
                                        <tr className="group">
                                            <td className="py-1 text-[9px] text-neutral-300">Netto</td>
                                            {extended.trends.slice(0, 3).map(y => <td key={y.year} className="py-1 text-[9px] text-right font-mono text-neutral-400">{formatLarge(y.netIncome)}</td>)}
                                        </tr>
                                        <tr className="group">
                                            <td className="py-1 text-[9px] text-neutral-300">FCF</td>
                                            {extended.trends.slice(0, 3).map(y => <td key={y.year} className="py-1 text-[9px] text-right font-mono text-neutral-400">{formatLarge(y.fcf)}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 2. Dividend History */}
                    {extended.dividends && extended.dividends.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/[0.1] pb-1">Dividendenhistorie</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[8px] text-neutral-500 uppercase tracking-wider">
                                            <th className="font-normal pb-1">Zahltag</th>
                                            <th className="font-normal pb-1 text-right">Dividende</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.05]">
                                        {extended.dividends.slice(0, 5).map((d, i) => (
                                            <tr key={i}>
                                                <td className="py-1 text-[9px] text-neutral-300 font-mono">{d.date}</td>
                                                <td className="py-1 text-[9px] text-right text-[#d4af37] font-mono">{d.amount.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. Insider Trades */}
                    {extended.insiders && extended.insiders.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/[0.1] pb-1">Insider Trades</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[8px] text-neutral-500 uppercase tracking-wider">
                                            <th className="font-normal pb-1">Datum</th>
                                            <th className="font-normal pb-1">Insider</th>
                                            <th className="font-normal pb-1 text-right">Wert</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.05]">
                                        {extended.insiders.slice(0, 5).map((t, i) => (
                                            <tr key={i} className="group hover:opacity-100 opacity-80">
                                                <td className="py-1 text-[9px] text-neutral-500 font-mono">{t.date}</td>
                                                <td className="py-1 text-[9px] text-neutral-300 truncate max-w-[80px]" title={t.insider}>
                                                    <div className="font-medium truncate">{t.insider}</div>
                                                </td>
                                                <td className={`py-1 text-[9px] text-right font-mono ${t.shares > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {formatLarge(t.value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Sub-Component: Stock Extended Financials (Trend, Dividends, Insider) ---
const StockFinancialsExtended = ({ ticker }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(apiUrl(`/company_financials/${ticker}`));
                if (res.data && !res.data.error) setData(res.data);
            } catch (e) {
                console.error("Advanced financials fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ticker]);

    if (loading) return <div className="text-[9px] text-neutral-500 py-2 text-center animate-pulse">Lade erweiterte Daten...</div>;
    if (!data) return <div className="text-[9px] text-neutral-500 py-2 text-center">Keine erweiterten Daten verfügbar.</div>;

    const { trends, dividends, insiders } = data;

    const formatNum = (n) => {
        if (!n) return "-";
        if (n > 1e9) return (n / 1e9).toFixed(2) + " Mrd.";
        if (n > 1e6) return (n / 1e6).toFixed(2) + " Mio.";
        return n.toLocaleString();
    };

    return (
        <div className="flex flex-col gap-6 pr-1">

            {/* 1. Annual Trends */}
            {trends && trends.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/[0.1] pb-1">Finanzdaten-Trend (Jährlich)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[8px] text-neutral-500 uppercase tracking-wider">
                                    <th className="font-normal pb-1">Metrik</th>
                                    {trends.slice(0, 4).map(y => <th key={y.year} className="font-normal pb-1 text-right">{y.year}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                <tr className="group">
                                    <td className="py-1 text-[9px] text-neutral-300">Umsatz</td>
                                    {trends.slice(0, 4).map(y => <td key={y.year} className="py-1 text-[9px] text-right font-mono text-neutral-400">{formatNum(y.revenue)}</td>)}
                                </tr>
                                <tr className="group">
                                    <td className="py-1 text-[9px] text-neutral-300">Nettogewinn</td>
                                    {trends.slice(0, 4).map(y => <td key={y.year} className="py-1 text-[9px] text-right font-mono text-neutral-400">{formatNum(y.netIncome)}</td>)}
                                </tr>
                                <tr className="group">
                                    <td className="py-1 text-[9px] text-neutral-300">Free Cash Flow</td>
                                    {trends.slice(0, 4).map(y => <td key={y.year} className="py-1 text-[9px] text-right font-mono text-neutral-400">{formatNum(y.fcf)}</td>)}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. Dividend History */}
            {dividends && dividends.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/[0.1] pb-1">Dividendenhistorie</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[8px] text-neutral-500 uppercase tracking-wider">
                                    <th className="font-normal pb-1">Zahltag</th>
                                    <th className="font-normal pb-1 text-right">Dividende</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {dividends.slice(0, 5).map((d, i) => (
                                    <tr key={i}>
                                        <td className="py-1 text-[9px] text-neutral-300 font-mono">{d.date}</td>
                                        <td className="py-1 text-[9px] text-right text-[#d4af37] font-mono">{d.amount.toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. Insider Trades */}
            {insiders && insiders.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/[0.1] pb-1">Insider Trades</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[8px] text-neutral-500 uppercase tracking-wider">
                                    <th className="font-normal pb-1">Datum</th>
                                    <th className="font-normal pb-1">Insider</th>
                                    <th className="font-normal pb-1 text-right">Wert</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {insiders.slice(0, 5).map((t, i) => (
                                    <tr key={i} className="group hover:opacity-100 opacity-80">
                                        <td className="py-1 text-[9px] text-neutral-500 font-mono">{t.date}</td>
                                        <td className="py-1 text-[9px] text-neutral-300 truncate max-w-[80px]" title={t.insider}>
                                            <div className="font-medium">{t.insider}</div>
                                            <div className="text-[7px] text-neutral-600">{t.transaction}</div>
                                        </td>
                                        <td className={`py-1 text-[9px] text-right font-mono ${t.shares > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatNum(t.value)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

// --- Sub-Component: Analysis Sidebar (NO BOXES) ---
const AnalysisSidebar = ({ children }) => {
    return (
        <div className="flex flex-col gap-4 h-full">
            {children}
        </div>
    );
}

const SidebarItem = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 hover:opacity-80 transition-opacity border-b border-white/[0.1]"
            >
                <span className="text-sm font-serif italic text-white">{title}</span>
                {isOpen ? <ChevronUp className="w-3 h-3 text-[#d4af37]" /> : <ChevronDown className="w-3 h-3 text-neutral-500" />}
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="py-4 pl-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

const CompactMovesTable = ({ data }) => {
    if (!data || data.length === 0) return <div className="py-4 text-center text-[9px] text-neutral-700 italic tracking-widest uppercase">Keine Daten</div>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <tbody className="divide-y divide-white/[0.03]">
                    {data.slice(0, 5).map((move, i) => (
                        <tr key={i} className="group hover:bg-white/[0.01]">
                            <td className="px-1 py-1.5">
                                <div className="text-[9px] font-medium text-neutral-300 group-hover:text-[#d4af37] truncate max-w-[80px]">{move.investor}</div>
                                <div className="text-[7px] text-neutral-600 uppercase">{new Date(move.reported).toLocaleDateString()}</div>
                            </td>
                            <td className="px-1 py-1.5 text-right text-[8px] font-mono text-neutral-500">{(move.shares_moved / 1000000).toFixed(1)}M</td>
                            <td className="px-1 py-1.5 text-right text-[8px] font-mono text-[#d4af37]">${(move.value_usd / 1000000).toFixed(0)}M</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const StockSidebarContent = ({ ticker }) => {
    const [instData, setInstData] = useState(null);
    const [whaleWatch, setWhaleWatch] = useState(null);
    const [avgPriceData, setAvgPriceData] = useState(null);
    const [largestMoves, setLargestMoves] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Parallel fetch
                const [instRes, whaleRes, priceRes, movesRes] = await Promise.allSettled([
                    axios.get(apiUrl(`/institutional/${ticker}`)),
                    axios.get(apiUrl(`/institutional/whale_watch/${ticker}`)),
                    axios.get(apiUrl(`/institutional/avg_price/${ticker}`)),
                    axios.get(apiUrl(`/institutional/largest_moves/${ticker}`))
                ]);

                if (instRes.status === 'fulfilled') setInstData(instRes.value.data);
                if (whaleRes.status === 'fulfilled') setWhaleWatch(whaleRes.value.data);
                if (priceRes.status === 'fulfilled') setAvgPriceData(priceRes.value.data);
                if (movesRes.status === 'fulfilled') setLargestMoves(movesRes.value.data);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ticker]);

    if (loading) return null;
    if (!instData) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pt-2">

            {/* FEATURE 2: Compact List for Sidebar - CLEAN LAYOUT */}
            <div className="flex flex-col gap-8">

                {avgPriceData?.avg_entry_price > 0 && (
                    <div className="py-2 border-b border-[#d4af37]/30 flex flex-col gap-1">
                        <span className="text-[8px] text-[#d4af37] tracking-widest uppercase">Smart Money Floor</span>
                        <span className="text-xl font-serif italic text-white">{avgPriceData.avg_entry_price.toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                )}

                {/* Column 1: Accumulation */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-white/[0.1]">
                        <span className="text-emerald-500 text-[10px]">↑</span>
                        <span className="text-[8px] tracking-[0.2em] font-extrabold text-white uppercase">Akkumulation</span>
                    </div>
                    <CompactMovesTable data={largestMoves?.purchases} />
                </div>

                {/* Column 2: Distribution */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-white/[0.1]">
                        <span className="text-rose-500 text-[10px]">↓</span>
                        <span className="text-[8px] tracking-[0.2em] font-extrabold text-white uppercase">Distribution</span>
                    </div>
                    <CompactMovesTable data={largestMoves?.sales} />
                </div>

                {/* Column 3: Whale Watch */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-white/[0.1]">
                        <span className="text-[#d4af37] text-[10px]">★</span>
                        <span className="text-[8px] tracking-[0.2em] font-extrabold text-white uppercase">Whale Watch</span>
                    </div>
                    {/* Reuse table but style it minimally */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-white/[0.05]">
                                {whaleWatch?.slice(0, 5).map((g, i) => {
                                    const latest = g.history[g.history.length - 1];
                                    if (!latest) return null;
                                    return (
                                        <tr key={i} className="group hover:opacity-100 opacity-80 transition-opacity">
                                            <td className="px-0 py-2">
                                                <div className="text-[9px] font-medium text-neutral-200 truncate max-w-[90px]">{g.fund}</div>
                                            </td>
                                            <td className={`px-0 py-2 text-right text-[8px] font-mono ${latest.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {latest.change > 0 ? '+' : ''}{latest.change.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
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

    // State for CoT Signals
    const [cotSignals, setCotSignals] = useState([]);

    const handleCotSignals = useCallback((signals) => {
        setCotSignals(prev => {
            if (JSON.stringify(prev) === JSON.stringify(signals)) return prev;
            return signals;
        });
    }, []);

    // Fallback if category is missing or generic "Asset"
    const category = (urlCategory && urlCategory !== 'Asset') ? urlCategory : getCategoryByTicker(ticker);

    useEffect(() => {
        // Set document title
        if (name) document.title = `${name} - Analysis`;
    }, [name]);

    if (!ticker) return <div className="p-10 text-white">No asset selected.</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-300 font-sans p-6 flex flex-col relative selection:bg-[#d4af37]/30">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 pb-6 border-b border-white/[0.05]">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full border border-white/[0.05] flex items-center justify-center text-neutral-500 hover:border-[#d4af37]/40 hover:text-[#d4af37] transition-all duration-700 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-1">
                            <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">{name}</h1>
                            <div className="px-3 py-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 text-[#d4af37] text-[10px] font-bold tracking-[0.2em] uppercase">
                                {ticker}
                            </div>
                        </div>
                        <p className="text-[10px] tracking-[0.5em] text-neutral-500 uppercase font-medium">{category || 'Asset Analysis'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-8 md:mt-0 text-right">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] tracking-[0.3em] text-[#d4af37] uppercase font-bold mb-1">Status</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] text-neutral-500 font-light tracking-widest uppercase">Echtzeit Analyse</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 flex flex-col gap-12 pb-20">
                {/* Content Logic: 3-Column Layout for Stocks */}
                {category === 'Aktien' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 w-full h-full min-h-[600px] animate-fade-in">
                        {/* 1. Left Sidebar (Expandable List) */}
                        <div className="xl:col-span-1 min-w-[280px]">
                            <AnalysisSidebar>
                                <SidebarItem title="13F Files" defaultOpen={true}>
                                    <StockSidebarContent ticker={ticker} />
                                </SidebarItem>
                                <SidebarItem title="Aktuelle Nachrichten" defaultOpen={false}>
                                    <StockNewsContent ticker={ticker} />
                                </SidebarItem>
                                <SidebarItem title="Fundamentaldaten" defaultOpen={false}>
                                    <StockFundamentalsContent ticker={ticker} />
                                </SidebarItem>
                            </AnalysisSidebar>
                        </div>

                        {/* 2. Middle: Company Info */}
                        <div className="xl:col-span-1 min-w-[280px]">
                            {/* Remove Box Container, just content */}
                            <CompanyProfileView ticker={ticker} />
                        </div>

                        {/* 3. Right: Chart (TradingView) */}
                        <div className="xl:col-span-2 flex flex-col gap-6">
                            {searchParams.get('view') !== '13f' && (
                                <div className="h-[600px] w-full relative border border-white/[0.05] rounded-lg overflow-hidden">
                                    <TradingViewWidget symbol={ticker} />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-12">
                        {searchParams.get('view') !== '13f' && (
                            <div className="animate-fade-in">
                                <AssetPriceChart ticker={ticker} cotSignals={cotSignals} />
                            </div>
                        )}
                        <div className="flex flex-col gap-24">
                            <div className="animate-fade-in">
                                <AssetCotView ticker={ticker} category={category} onSignalsChange={handleCotSignals} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetAnalysisWindow;

