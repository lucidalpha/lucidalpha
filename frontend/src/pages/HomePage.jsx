import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, Activity, Search, Layers } from 'lucide-react';
import logo from '../assets/lucid_alpha_logo.png';

const MenuCard = ({ title, icon: Icon, to, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <Link
            to={to}
            className="block group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-all duration-300 hover:bg-zinc-800/80 p-6 h-full backdrop-blur-sm"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors border border-white/5">
                    <Icon className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
                </div>
                <span className="text-lg font-medium text-gray-200 group-hover:text-white tracking-wide">
                    {title}
                </span>
            </div>
        </Link>
    </motion.div>
);

const SectionHeader = ({ title }) => (
    <div className="flex items-center justify-center gap-4 mb-8">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-700" />
        <h2 className="text-xl font-light tracking-[0.2em] text-gray-400 uppercase">{title}</h2>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-700" />
    </div>
);

const HomePage = () => {
    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 max-w-7xl mx-auto">

            {/* Hero Logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-20"
            >
                <img src={logo} alt="Lucid Alpha" className="h-32 md:h-48 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32 w-full max-w-5xl relative">

                {/* Vertical Divider (Desktop) */}
                <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-800 to-transparent -translate-x-1/2" />

                {/* Left Column: Aktien Analyse */}
                <div className="flex flex-col space-y-6">
                    <SectionHeader title="Aktien Analyse" />
                    <div className="grid gap-4">
                        <MenuCard
                            title="Saisonalität - Screener"
                            icon={BarChart2}
                            to="/seasonality/stocks"
                            delay={0.1}
                        />
                        <MenuCard
                            title="Einzeln"
                            icon={Search}
                            to="/stocks"
                            delay={0.2}
                        />
                    </div>
                </div>

                {/* Right Column: Trading Analyse */}
                <div className="flex flex-col space-y-6">
                    <SectionHeader title="Trading Analyse" />
                    <div className="grid gap-4">
                        <MenuCard
                            title="Saisonalität - Screener"
                            icon={Activity}
                            to="/seasonality/trading"
                            delay={0.3}
                        />
                        <MenuCard
                            title="Einzeln"
                            icon={Layers}
                            to="/trading"
                            delay={0.4}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Center: Valuation */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-16 w-full max-w-md"
            >
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                    <Link
                        to="/valuation"
                        className="relative block w-full bg-black rounded-2xl border border-gray-800 hover:border-white/30 p-8 flex flex-col items-center justify-center transition-all duration-300"
                    >
                        <TrendingUp className="w-8 h-8 text-white mb-4" />
                        <h3 className="text-xl font-medium text-white tracking-wider mb-2">Valuation - Analyse</h3>
                        <p className="text-sm text-gray-500 font-light">Fair Value Berechnung & Historische Bewertung</p>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default HomePage;
