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
            // Ensure correct order
            // We need to compare specific dates or indices. 
            // Since labels are "Jan 01", comparison is tricky strings.
            // Better to find index in data.
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
        <div className="h-[600px] w-full bg-black border border-gray-800 rounded-xl p-4 flex flex-col select-none">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Saisonaler Durchschnitt ({lookback || 15} Jahre)</h3>
                <button
                    onClick={() => setShowCurrentYear(!showCurrentYear)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors"
                >
                    {showCurrentYear ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showCurrentYear ? 'Aktuelles Jahr ausblenden' : 'Aktuelles Jahr einblenden'}
                </button>
            </div>
            <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        >
                            <CartesianGrid strokeDasharray="0" stroke="#333" vertical={true} opacity={0.4} />
                            <XAxis
                                dataKey="date"
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: 12 }}
                                interval={30}
                                tickFormatter={(val) => val.split(' ')[0]}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: 12 }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                                labelStyle={{ color: '#9ca3af' }}
                                formatter={(value, name) => {
                                    if (name === "current_value") return [value, `Aktuelles Jahr`];
                                    return [value, "Saisonaler Durchschnitt"];
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />

                            {/* External Highlight (from Table click) */}
                            {highlightRange && (
                                <ReferenceArea
                                    x1={highlightRange.start}
                                    x2={highlightRange.end}
                                    strokeOpacity={0}
                                    fill="#0ea5e9"
                                    fillOpacity={0.2}
                                />
                            )}

                            {/* User Selection Highlight (during drag) */}
                            {(refAreaLeft && refAreaRight) && (
                                <ReferenceArea
                                    x1={refAreaLeft}
                                    x2={refAreaRight}
                                    strokeOpacity={0}
                                    fill="#ffffff"
                                    fillOpacity={0.1}
                                />
                            )}

                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#0ea5e9"
                                dot={false}
                                strokeWidth={2}
                                name="Saisonaler Trend"
                                isAnimationActive={false}
                            />

                            {showCurrentYear && (
                                <Line
                                    type="monotone"
                                    dataKey="current_value"
                                    stroke="#ffffff"
                                    dot={false}
                                    strokeWidth={2}
                                    name="Aktuelles Jahr"
                                    connectNulls={true}
                                    isAnimationActive={false}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SeasonalChart;
