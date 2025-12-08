import React, { useState, useRef } from 'react';
import ResultsTable from './ResultsTable';
import ValuationChart from './ValuationChart';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const FileUpload = () => {
    const inputRef = useRef(null);

    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, success, error
    const [message, setMessage] = useState('');
    const [results, setResults] = useState(null);
    const [valuation, setValuation] = useState(null);
    const [valuationColumns, setValuationColumns] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [timeRange, setTimeRange] = useState('1Y');

    const getFilteredValuationData = () => {
        if (!valuation) return [];
        if (timeRange === 'All') return valuation;

        const now = new Date();
        const cutoffDate = new Date();

        switch (timeRange) {
            case '1Y':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            case '2Y':
                cutoffDate.setFullYear(now.getFullYear() - 2);
                break;
            case '5Y':
                cutoffDate.setFullYear(now.getFullYear() - 5);
                break;
            default:
                return valuation;
        }

        return valuation.filter(item => {
            // Parse date "dd.mm.yyyy"
            const [day, month, year] = item.date.split('.');
            const itemDate = new Date(year, month - 1, day);
            return itemDate >= cutoffDate;
        });
    };

    // Valuation Checkboxes
    const [benchmarks, setBenchmarks] = useState({
        dollar: false,
        euro: false,
        zb: false,
        gold: false
    });

    const handleCheckboxChange = (key) => {
        setBenchmarks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (selectedFile) => {
        setFile(selectedFile);
        setUploadStatus('idle');
        setMessage('');
        await uploadFile(selectedFile);
    };

    const uploadFile = async (fileToUpload) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);

        // Collect selected benchmarks
        const selected = Object.keys(benchmarks).filter(k => benchmarks[k]).join(',');
        if (selected) {
            formData.append('benchmarks', selected);
        }

        // CLEAR MOCK DATA ON NEW UPLOAD ATTEMPT
        setResults(null);
        setValuation(null);
        setStatistics(null);
        setValuationColumns([]);

        try {
            const response = await axios.post('http://localhost:8000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadStatus('success');
            setMessage(response.data.message);
            setResults(response.data.results);
            setValuation(response.data.valuation);
            setValuationColumns(response.data.valuation_columns || []);
            setStatistics(response.data.statistics || null);
        } catch (error) {
            setUploadStatus('error');
            let errorMsg = 'Fehler beim Hochladen.';
            if (error.response) errorMsg = error.response.data.detail || `Server Fehler: ${error.response.status}`;
            else if (error.request) errorMsg = 'Keine Antwort vom Server.';
            else errorMsg = error.message;
            setMessage(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group bg-black rounded-xl border border-gray-800 p-6"
            >
                {/* Config Checkboxes */}


                <div
                    className={cn(
                        "relative w-full h-64 rounded-xl border border-dashed transition-all duration-300 ease-out overflow-hidden bg-black",
                        dragActive ? "border-white bg-white/5" : "border-gray-700 hover:border-gray-600",
                        uploadStatus === 'success' && "border-white/30"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={handleChange}
                            accept=".xlsx,.xls,.csv"
                        />

                        <AnimatePresence mode="wait">
                            {uploading ? (
                                <motion.div
                                    key="uploading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center"
                                >
                                    <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                                    <p className="text-gray-400">Analysiere Daten...</p>
                                </motion.div>
                            ) : uploadStatus === 'success' ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <h3 className="text-2xl font-semibold text-white mb-4">Upload Financial Data</h3>
                                    <div className="flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-full border border-white/20 mb-6">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Upload erfolgreich!</span>
                                        <span className="text-gray-300 ml-2">{file?.name}</span>
                                    </div>
                                    <button
                                        onClick={() => inputRef.current.click()}
                                        className="text-sm text-gray-500 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-700"
                                    >
                                        Datei ändern
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <h3 className="text-2xl font-semibold text-white mb-2">Upload Financial Data</h3>
                                    {uploadStatus === 'error' && (
                                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm max-w-md text-center flex items-center justify-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {message}
                                        </div>
                                    )}
                                    <p className="text-gray-500 mb-8">Drag & drop your Excel file here</p>
                                    <button
                                        onClick={() => inputRef.current.click()}
                                        className="bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-white/20"
                                    >
                                        Datei auswählen
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Analysis Status Section */}
            <AnimatePresence>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full"
                    >
                        {/* Valuation Window */}
                        <div className="space-y-4 flex flex-col h-[600px]">
                            <h3 className="text-xl font-semibold text-white">Valuation</h3>
                            <div className="bg-black border border-gray-800 rounded-xl overflow-hidden flex-1 flex flex-col p-4 relative">
                                {valuation && valuation.length > 0 ? (
                                    <>
                                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                                            {/* Time Range Selector */}
                                            {['1Y', '2Y', '5Y', 'All'].map((range) => (
                                                <button
                                                    key={range}
                                                    onClick={() => setTimeRange(range)}
                                                    className={cn(
                                                        "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
                                                        timeRange === range
                                                            ? "bg-white text-black border-white"
                                                            : "bg-black/50 text-gray-400 border-gray-700 hover:text-white hover:border-gray-500"
                                                    )}
                                                >
                                                    {range}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex-1 min-h-0">
                                            <ValuationChart data={getFilteredValuationData()} columns={valuationColumns} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center p-8">
                                        <div className="text-gray-500 text-sm text-center">
                                            {Object.values(benchmarks).some(v => v) ?
                                                "Keine Übereinstimmung der Daten gefunden." :
                                                "Wähle oben Benchmarks aus oder lade eine Datei mit 'Symbol'-Spalten hoch."
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {statistics && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.values(statistics).map((stat) => (
                                    <div key={stat.label} className="bg-black border border-gray-800 rounded-xl p-4">
                                        <h4 className="text-gray-400 text-sm font-medium mb-3 border-b border-gray-800 pb-2">{stat.label}</h4>

                                        {/* Counts */}
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <div className="text-2xl font-semibold text-white">{stat.total_extremes}</div>
                                                <div className="text-xs text-gray-500">Total Extremes</div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="text-xs text-green-400">Below -75: <span className="text-white font-medium">{stat.count_lower}</span></div>
                                            </div>
                                        </div>

                                        {/* Durations */}
                                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-800">
                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-red-400">{stat.avg_duration_upper}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ø Days Red</div>
                                            </div>
                                            <div className="text-center border-l border-gray-800">
                                                <div className="text-lg font-semibold text-gray-300">{stat.avg_duration_middle}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ø Neutral</div>
                                            </div>
                                            <div className="text-center border-l border-gray-800">
                                                <div className="text-lg font-semibold text-green-400">{stat.avg_duration_lower}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ø Days Green</div>
                                            </div>
                                            <div className="text-center border-l border-gray-800">
                                                <div className="text-lg font-semibold text-white">{stat.avg_duration_total}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ø Total Ext</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FileUpload;
