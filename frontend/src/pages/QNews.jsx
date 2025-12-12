import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Newspaper, TrendingUp, Activity, RefreshCw } from 'lucide-react';

const QNews = () => {
    const [fxData, setFxData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        setLoading(true);
        axios.get(apiUrl('/automation/fx_scores'))
            .then(res => {
                setFxData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load FX scores", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Group data by currency
    const groupedData = fxData.reduce((acc, item) => {
        const currency = item.currency || "Unknown";
        if (!acc[currency]) acc[currency] = [];
        acc[currency].push(item);
        return acc;
    }, {});

    // Sort dates within groups
    Object.keys(groupedData).forEach(curr => {
        groupedData[curr].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    const getScoreColor = (score) => {
        if (score > 0.5) return "#10b981"; // Green
        if (score < -0.5) return "#ef4444"; // Red
        return "#d1d5db"; // Gray
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 min-h-screen bg-black text-white">
            <header className="mb-10 text-center relative">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2 flex items-center justify-center gap-3">
                    <Activity className="w-8 h-8 text-green-400" />
                    Quant News Index
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    AI-driven Fundamental Scoring Model (-2.0 Bearish to +2.0 Bullish)
                </p>
                <button
                    onClick={fetchData}
                    className="absolute right-0 top-0 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {loading && fxData.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.keys(groupedData).length === 0 ? (
                        <div className="col-span-2 text-center text-gray-500 py-20">
                            No analysis data available yet. Run the backend script to generate scores.
                        </div>
                    ) : (
                        Object.entries(groupedData).map(([currency, data]) => {
                            const latestScore = data[data.length - 1]?.score || 0;
                            return (
                                <div key={currency} className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-200">
                                                {currency.substring(0, 3)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-white">{currency}</h3>
                                                <span className={`text-sm font-medium ${latestScore > 0 ? 'text-green-400' : latestScore < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                                    Current Score: {latestScore > 0 ? '+' : ''}{latestScore}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-gray-800 text-xs text-gray-400 border border-gray-700">
                                            {data[data.length - 1]?.decision}
                                        </div>
                                    </div>

                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#666"
                                                    tick={{ fill: '#666', fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    domain={[-2, 2]}
                                                    ticks={[-2, -1, 0, 1, 2]}
                                                    stroke="#666"
                                                    tick={{ fill: '#666', fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value) => [value, "Score"]}
                                                    labelStyle={{ color: '#9ca3af' }}
                                                />
                                                <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
                                                <ReferenceLine y={1.3} stroke="#059669" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: "Strong Buy", position: 'insideTopRight', fill: '#059669', fontSize: 10 }} />
                                                <ReferenceLine y={-1.3} stroke="#dc2626" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: "Strong Sell", position: 'insideBottomRight', fill: '#dc2626', fontSize: 10 }} />

                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#000" }}
                                                    activeDot={{ r: 6, fill: "#fff" }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-800">
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {data[data.length - 1]?.summary}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default QNews;

