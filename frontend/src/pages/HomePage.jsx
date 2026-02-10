import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, Activity, Search, Layers, Sparkles, Calculator, PieChart } from 'lucide-react';
import logo from '../assets/lucid_alpha_logo.png';

const MenuCard = ({ title, icon: Icon, to, description, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="h-full"
    >
        <Link
            to={to}
            className="block group h-full"
        >
            <div className="tech-card p-6 h-full flex flex-col items-center text-center justify-center space-y-4 hover:bg-white/[0.02] transition-colors">
                <div className="p-4 rounded-full bg-emerald-500/5 border border-emerald-500/10 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-500">
                    <Icon className="w-8 h-8 text-emerald-500/70 group-hover:text-emerald-400 transition-colors duration-500" strokeWidth={1.5} />
                </div>

                <div>
                    <span className="text-xl font-light text-white tracking-widest uppercase block mb-2 group-hover:text-emerald-300 transition-colors">
                        {title}
                    </span>
                    {description && (
                        <span className="text-xs text-neutral-500 font-light tracking-wide group-hover:text-neutral-400 transition-colors">
                            {description}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    </motion.div>
);

const SectionHeader = ({ title }) => (
    <div className="flex items-center justify-center gap-6 mb-12">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent" />
        <h2 className="text-sm font-light tracking-[0.4em] text-emerald-500/80 uppercase">{title}</h2>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent" />
    </div>
);

const HomePage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center pt-20 pb-20 px-6 max-w-7xl mx-auto relative z-10">

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="mb-24 flex flex-col items-center"
            >
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full opacity-20" />
                    <img src={logo} alt="Lucid Alpha" className="h-40 md:h-56 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]" />
                </div>
                <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] text-white uppercase text-center mb-4">
                    Lucid<span className="text-emerald-500 font-extralight">Alpha</span>
                </h1>
                <p className="text-neutral-500 tracking-[0.3em] text-xs uppercase">Quantitative Seasonal Intelligence</p>
            </motion.div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl">

                {/* Stocks Column */}
                <div className="space-y-8">
                    <SectionHeader title="Equity Markets" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <MenuCard
                            title="Saisonalität"
                            description="Historical Pattern Analysis"
                            icon={BarChart2}
                            to="/seasonality/stocks"
                            delay={0.1}
                        />
                        <MenuCard
                            title="Einzel-Analyse"
                            description="Deep Dive Fundamentals"
                            icon={Search}
                            to="/stocks"
                            delay={0.2}
                        />
                    </div>
                </div>

                {/* Trading Column */}
                <div className="space-y-8">
                    <SectionHeader title="Trading Desk" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <MenuCard
                            title="Saisonalität"
                            description="Futures & Commodities"
                            icon={Activity}
                            to="/seasonality/trading"
                            delay={0.3}
                        />
                        <MenuCard
                            title="CoT Report"
                            description="Commitment of Traders"
                            icon={Layers}
                            to="/cot"
                            delay={0.4}
                        />
                    </div>
                </div>

            </div>

            {/* Specialized Tools */}
            <div className="w-full max-w-6xl mt-24">
                <SectionHeader title="Quantitative Suite" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MenuCard
                        title="HMM Regimes"
                        description="Market State Detection"
                        icon={Sparkles}
                        to="/hmm"
                        delay={0.5}
                    />
                    <MenuCard
                        title="Smart Money"
                        description="Institutional 13F Flow"
                        icon={PieChart}
                        to="/smart-money"
                        delay={0.6}
                    />
                    <MenuCard
                        title="Terminkurven"
                        description="Futures Term Structure"
                        icon={Activity}
                        to="/term-structure"
                        delay={0.7}
                    />
                    <MenuCard
                        title="Simulation"
                        description="Monte Carlo Risk"
                        icon={Calculator}
                        to="/calculators"
                        delay={0.8}
                    />
                </div>
            </div>

            {/* Footer Status */}
            <div className="mt-32 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/10 border border-emerald-500/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-emerald-500/70">System Operational</span>
                </div>
            </div>

        </div>
    );
};

export default HomePage;
