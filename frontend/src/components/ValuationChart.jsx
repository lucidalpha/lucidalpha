import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const ValuationChart = ({ data, columns }) => {
    if (!data || data.length === 0) return null;

    // Pine Script Colors: Navy, Yellow, Purple, Red
    const colors = ['#3b82f6', '#fbbf24', '#a855f7', '#ef4444'];
    // Using Tailwind shades: Blue-500, Amber-400, Purple-500, Red-500 (Brighter for dark mode)

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl">
                    <p className="text-gray-400 text-xs mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-300">
                                {entry.name}:
                            </span>
                            <span className="text-white font-medium">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                    {/* Threshold Lines */}
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Overvalued', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={-75} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Undervalued', fill: '#22c55e', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={0} stroke="#4b5563" />

                    {columns.map((col, index) => (
                        <Line
                            key={col.key}
                            type="monotone"
                            dataKey={col.key}
                            name={col.label}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ValuationChart;
