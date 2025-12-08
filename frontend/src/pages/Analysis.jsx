import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResultsTable from '../components/ResultsTable';
import { FileText, Calendar, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Analysis = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [fetchingReport, setFetchingReport] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await axios.get('http://localhost:8000/reports');
            setReports(response.data);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReport = async (id) => {
        setSelectedReportId(id);
        setFetchingReport(true);
        try {
            const response = await axios.get(`http://localhost:8000/reports/${id}`);
            setReportData(response.data);
        } catch (error) {
            console.error("Failed to fetch report details", error);
        } finally {
            setFetchingReport(false);
        }
    };

    const handleBack = () => {
        setSelectedReportId(null);
        setReportData(null);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    // Detail View
    if (selectedReportId) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-8">
                <button
                    onClick={handleBack}
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Analysis List
                </button>

                {fetchingReport ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                ) : reportData ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-black border border-gray-800 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-2">{reportData.filename}</h2>
                            <div className="flex items-center text-gray-400 text-sm">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(reportData.timestamp * 1000).toLocaleString()}
                            </div>
                        </div>

                        <ResultsTable results={reportData.results} />
                    </motion.div>
                ) : (
                    <div className="text-red-500">Failed to load report data.</div>
                )}
            </div>
        );
    }

    // List View
    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">Saved Analysis Reports</h1>

            <div className="grid gap-4">
                {reports.length === 0 ? (
                    <div className="text-gray-400 text-center py-10 bg-black rounded-xl border border-gray-800">
                        No reports found. Upload a file to generate a report.
                    </div>
                ) : (
                    reports.map((report) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black border border-gray-800 hover:border-white/50 rounded-xl p-6 cursor-pointer transition-all group"
                            onClick={() => handleSelectReport(report.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                        <FileSpreadsheetIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-white transition-colors">
                                            {report.filename}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                {new Date(report.timestamp * 1000).toLocaleDateString()}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                            <span>
                                                {report.result_count} Patterns Found
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

// Simple Icon component helper if strict usage of Lucide is tricky with imports
function FileSpreadsheetIcon({ className }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" x2="16" y1="13" y2="13" />
            <line x1="8" x2="16" y1="17" y2="17" />
        </svg>
    )
}

export default Analysis;
