import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const TermStructure = () => {
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [rawResponse, setRawResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Slider State
    const [sliderIndex, setSliderIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Fetch Assets
    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await fetch('http://localhost:8000/term_structure/assets');
                if (!res.ok) throw new Error("Failed to load assets");
                const list = await res.json();
                setAssets(list);
                const gold = list.find(a => a.ticker === 'GC=F');
                if (gold) {
                    setSelectedAsset(gold.ticker);
                } else if (list.length > 0) {
                    setSelectedAsset(list[0].ticker);
                }
            } catch (err) {
                console.error(err);
                setError("Konnte Asset-Liste nicht laden.");
            }
        };
        fetchAssets();
    }, []);

    // Fetch Data
    useEffect(() => {
        if (!selectedAsset) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setRawResponse(null);
            try {
                const res = await fetch('http://localhost:8000/term_structure/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticker: selectedAsset })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || "Fehler beim Laden der Daten");
                }

                const result = await res.json();
                setRawResponse(result);
                if (result.dates && result.dates.length > 0) {
                    setSliderIndex(result.dates.length - 1);
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedAsset]);

    // Playback Logic
    useEffect(() => {
        let interval;
        if (isPlaying && rawResponse && rawResponse.dates) {
            interval = setInterval(() => {
                setSliderIndex(prev => {
                    if (prev >= rawResponse.dates.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, rawResponse]);

    const currentChartData = useMemo(() => {
        if (!rawResponse || !rawResponse.dates || !rawResponse.contracts) return null;
        const dateStr = rawResponse.dates[sliderIndex];
        if (!dateStr) return null;

        const points = [];
        rawResponse.contracts.forEach(c => {
            const price = c.history[dateStr];
            if (price !== undefined && price !== null) {
                points.push({
                    expiry: c.expiry,
                    label: c.label,
                    price: price,
                    symbol: c.symbol
                });
            }
        });
        return { date: dateStr, points };
    }, [rawResponse, sliderIndex]);

    const spreadInfo = useMemo(() => {
        if (!currentChartData || currentChartData.points.length < 2) return null;
        const pts = currentChartData.points;
        const first = pts[0];
        const last = pts[pts.length - 1];
        const diff = last.price - first.price;
        const pct = ((last.price - first.price) / first.price) * 100;
        return { diff, pct, firstPrice: first.price, lastPrice: last.price };
    }, [currentChartData]);

    return (
        <div className="bg-[#050505] min-h-screen pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-6 sm:px-10">

                {/* Header Section */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-4 font-medium">Market Curves</p>
                    <h1 className="text-4xl md:text-5xl font-serif italic text-white mb-8">Termin Kurven.</h1>
                    <div className="w-16 h-[1px] bg-white/[0.1] mb-8"></div>
                </div>

                {/* Assets Selection */}
                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {assets.map(asset => (
                        <button
                            key={asset.ticker}
                            onClick={() => setSelectedAsset(asset.ticker)}
                            className={`px-5 py-2.5 rounded-full border transition-all duration-700
                                ${selectedAsset === asset.ticker
                                    ? 'bg-[#d4af37]/10 border-[#d4af37] text-white'
                                    : 'bg-white/[0.02] border-white/[0.05] text-neutral-400 hover:border-[#d4af37]/30 hover:text-white'
                                }`}
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold tracking-widest uppercase mb-0.5">{asset.root}</span>
                                <span className="text-[8px] tracking-wider opacity-60 uppercase">{asset.name}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="w-12 h-12 border border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
                        <p className="mt-8 text-[10px] tracking-[0.3em] uppercase text-[#d4af37]/60">Lade Marktdaten...</p>
                    </div>
                )}

                {!loading && !error && currentChartData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">

                        {/* Control Column */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="p-10 rounded-[2rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-3xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>

                                <div className="mb-10">
                                    <p className="text-[9px] tracking-[0.4em] text-[#d4af37] uppercase mb-4 font-medium">Zeitpunkt</p>
                                    <h3 className="text-3xl font-serif italic text-white">
                                        {new Date(currentChartData.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </h3>
                                </div>

                                <div className="space-y-10">
                                    {/* Playback Button */}
                                    <div className="flex items-center space-x-6">
                                        <button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-16 h-16 rounded-full border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-700 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                                        >
                                            {isPlaying ? <Pause size={20} strokeWidth={1.5} /> : <Play size={20} strokeWidth={1.5} className="ml-1" />}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase mb-1">Status</span>
                                            <span className="text-xs text-white uppercase tracking-widest">{isPlaying ? 'Animation läuft' : 'Pausiert'}</span>
                                        </div>
                                    </div>

                                    {/* Slider */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[8px] tracking-[0.4em] text-neutral-500 uppercase">
                                            <span>Start</span>
                                            <span>Jetzt</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={rawResponse.dates.length - 1}
                                            value={sliderIndex}
                                            onChange={(e) => {
                                                setSliderIndex(parseInt(e.target.value));
                                                setIsPlaying(false);
                                            }}
                                            className="zen-slider"
                                        />
                                    </div>

                                    {spreadInfo && (
                                        <div className="pt-10 border-t border-white/[0.05]">
                                            <p className="text-[9px] tracking-[0.4em] text-[#d4af37] uppercase mb-4 font-medium">Spread Info</p>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Abweichung</span>
                                                <span className={`text-xl font-serif italic ${spreadInfo.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {spreadInfo.diff.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Prozentual</span>
                                                <span className={`text-xl font-serif italic ${spreadInfo.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {spreadInfo.pct.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="p-8 rounded-[2rem] border border-white/[0.05] bg-white/[0.01]">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-8 h-8 rounded-full border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                                        <span className="text-xs font-serif uppercase">i</span>
                                    </div>
                                    <h4 className="text-[10px] tracking-[0.3em] text-white uppercase font-bold">Struktur Info</h4>
                                </div>
                                <p className="text-[11px] text-neutral-400 leading-relaxed tracking-wide font-light">
                                    Diese Kurve visualisiert die Preise für verschiedene Fälligkeitstermine.
                                    {selectedAsset && ` Aktuelles Modell: ${assets.find(a => a.ticker === selectedAsset)?.structure || 'Normal'}.`}
                                </p>
                            </div>
                        </div>

                        {/* Chart Column */}
                        <div className="lg:col-span-2">
                            <div className="h-[600px] p-10 rounded-[2rem] border border-white/[0.05] bg-black/40 backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="flex flex-col items-end">
                                        <p className="text-[8px] tracking-[0.5em] text-[#d4af37] uppercase mb-1 font-medium">Live Feed</p>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    </div>
                                </div>

                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={currentChartData.points} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            stroke="rgba(255,255,255,0.2)"
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, tracking: '0.1em' }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            angle={-30}
                                            textAnchor="end"
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            stroke="rgba(255,255,255,0.2)"
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => val.toLocaleString('de-DE')}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0c0c0c',
                                                border: '1px solid rgba(212,175,55,0.2)',
                                                borderRadius: '1rem',
                                                color: '#fff',
                                                fontSize: '11px',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                            }}
                                            itemStyle={{ color: '#d4af37' }}
                                            formatter={(val) => val.toFixed(2)}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#d4af37"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: "#0c0c0c", strokeWidth: 2, stroke: "#d4af37" }}
                                            activeDot={{ r: 6, fill: "#d4af37", strokeWidth: 0 }}
                                            animationDuration={300}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TermStructure;
