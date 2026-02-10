import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

const SeasonalChart = ({ data, lookback, highlightRange, onRangeSelect }) => {
    const [showCurrentYear, setShowCurrentYear] = useState(true);
    const [refAreaLeft, setRefAreaLeft] = useState(null);
    const [refAreaRight, setRefAreaRight] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);

    if (!data || data.length === 0) return null;

    const handleMouseDown = (e) => {
        if (!e || !e.activeLabel) return;
        setRefAreaLeft(e.activeLabel);
        setIsSelecting(true);
    };

    const handleMouseMove = (e) => {
        if (!isSelecting || !e || !e.activeLabel) return;
        setRefAreaRight(e.activeLabel);
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
        if (refAreaLeft && refAreaRight) {
            const idx1 = data.findIndex(d => d.date === refAreaLeft);
            const idx2 = data.findIndex(d => d.date === refAreaRight);

            let start = refAreaLeft;
            let end = refAreaRight;

            if (idx1 > idx2) {
                start = refAreaRight;
                end = refAreaLeft;
            }

            if (onRangeSelect) {
                onRangeSelect(start, end);
            }
        }
        setRefAreaLeft(null);
        setRefAreaRight(null);
    };

    return (
        <div className="h-full w-full flex flex-col select-none">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] tracking-[0.4em] font-bold text-[#d4af37] uppercase">Saisonaler Durchschnitt</span>
                    <span className="text-[9px] tracking-widest text-neutral-600 uppercase">({lookback || 15} Jahre Analyse)</span>
                </div>
                <button
                    onClick={() => setShowCurrentYear(!showCurrentYear)}
                    className="flex items-center gap-3 px-6 py-2 text-[9px] font-bold tracking-widest uppercase rounded-full border border-white/[0.05] bg-white/[0.02] text-neutral-500 hover:text-white hover:border-white/20 transition-all duration-700"
                >
                    {showCurrentYear ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showCurrentYear ? 'Benchmark Verbergen' : 'Benchmark Zeigen'}
                </button>
            </div>
            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            interval={30}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => val.split(' ')[0]}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            domain={['dataMin - 10', 'dataMax + 10']}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                            labelStyle={{ color: '#d4af37', fontFamily: 'serif', fontStyle: 'italic' }}
                            formatter={(value, name) => {
                                if (name === "current_value") return [value, `Benchmark`];
                                return [value, "Trend"];
                            }}
                        />

                        {/* External Highlight */}
                        {highlightRange && (
                            <ReferenceArea
                                x1={highlightRange.start}
                                x2={highlightRange.end}
                                strokeOpacity={0}
                                fill="#d4af37"
                                fillOpacity={0.05}
                            />
                        )}

                        {/* User Selection Highlight */}
                        {(refAreaLeft && refAreaRight) && (
                            <ReferenceArea
                                x1={refAreaLeft}
                                x2={refAreaRight}
                                strokeOpacity={0}
                                fill="#ffffff"
                                fillOpacity={0.03}
                            />
                        )}

                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#d4af37"
                            dot={false}
                            strokeWidth={1.5}
                            name="Saisonaler Trend"
                            isAnimationActive={false}
                        />

                        {showCurrentYear && (
                            <Line
                                type="monotone"
                                dataKey="current_value"
                                stroke="rgba(255,255,255,0.3)"
                                dot={false}
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                name="Benchmark"
                                connectNulls={true}
                                isAnimationActive={false}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SeasonalChart;
