import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart2, Activity, DollarSign } from 'lucide-react';

const HubCard = ({ title, description, icon: Icon, to, image }) => {
    return (
        <Link to={to} className="group relative block w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-800 hover:border-white/20 transition-all">
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black to-transparent z-10" />

            {/* Icon Background */}
            <div className="absolute inset-0 bg-gray-900 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center">
                <Icon className="w-32 h-32 text-gray-800 group-hover:text-gray-700 transition-colors opacity-50" />
            </div>

            <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-wide group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>
                </div>
                <p className="text-gray-400 text-sm max-w-sm">
                    {description}
                </p>
            </div>
        </Link>
    );
};

const SeasonalityHub = () => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-4xl font-light text-white mb-4">Saisonalitäts-Analyse</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Wähle einen Bereich aus, um saisonale Muster und historische Wahrscheinlichkeiten zu analysieren.
                </p>
            </motion.div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <HubCard
                        title="Aktien Screener"
                        description="Saisonale Analyse für Indizes (Dow Jones, Nasdaq, DAX)."
                        icon={BarChart2}
                        to="/seasonality/screener"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <HubCard
                        title="Trading Screener"
                        description="Futures, Rohstoffe und Währungen. Finde statistische Vorteile in kurz- bis mittelfristigen Zeitfenstern."
                        icon={Activity}
                        to="/seasonality/trading"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-2"
                >
                    <HubCard
                        title="Währungsanalyse"
                        description="Spezialisierter Scanner für FX-Futures und Währungspaare."
                        icon={DollarSign}
                        to="/seasonality/currency"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default SeasonalityHub;
