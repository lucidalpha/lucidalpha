import React, { useState } from 'react';
import ZenHeader from '../../components/hidden-metrix/ZenHeader';
import ZenHero from '../../components/hidden-metrix/ZenHero';
import ZenMarketTable from '../../components/hidden-metrix/ZenMarketTable';
import ZenFooter from '../../components/hidden-metrix/ZenFooter';
import { Database, BarChart, Binary, Shield, TrendingUp, Search, Activity, Layers, Activity as ActivityIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const LucidAlphaHome = () => {
    const [activeTab, setActiveTab] = useState('Saisonalität');

    const DASHBOARD_TABS = [
        {
            name: 'Saisonalität',
            icon: BarChart,
            items: [
                { title: 'Aktien Screener', desc: 'Suchen Sie weltweit in Aktienmärkten nach saisonalen Zyklen.', path: '/seasonality/stocks', icon: Search },
                { title: 'Asset Screener', desc: 'Saisonale Muster für FX, Rohstoffe und Indizes.', path: '/seasonality/trading', icon: Activity }
            ]
        },
        {
            name: 'Smart Money',
            icon: Binary,
            items: [
                { title: '13F Analyse', desc: 'Überwachen Sie institutionelle Positionierungen und Hedgefonds-Ströme.', path: '/13f', icon: TrendingUp },
                { title: 'Live COT Reports', desc: 'Folgen Sie den großen Playern an den Terminmärkten.', path: '/cot', icon: Layers }
            ]
        },
        {
            name: 'Analyse',
            icon: ActivityIcon,
            items: [
                { title: 'Valuation Hub', desc: 'Berechnen Sie den fairen Wert basierend auf fundamentalen Mustern.', path: '/valuation', icon: Database },
                { title: 'HMM Regime', desc: 'Erkennen Sie Marktphasen mittels Hidden Markov Modellen.', path: '/hmm', icon: Shield }
            ]
        },
        {
            name: 'Rechner',
            icon: Shield,
            items: [
                { title: 'Risiko Manager', desc: 'Fortgeschrittene Positionsgrößenbestimmung und Risikobewertung.', path: '/calculators', icon: Shield },
                { title: 'Monte Carlo', desc: 'Wahrscheinlichkeitsbasierte Pfadsimulation für Assets.', path: '/calculators', icon: TrendingUp }
            ]
        }
    ];

    return (
        <div className="bg-[#050505] min-h-screen font-sans selection:bg-[#d4af37]/30 selection:text-white">
            <ZenHeader />

            <main>
                <ZenHero />

                {/* Dashboard Tabs Section */}
                <section className="py-32 bg-[#050505] border-t border-white/[0.05]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col items-center mb-20 text-center">
                            <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-4 font-medium">Plattform Kern</p>
                            <h2 className="text-4xl md:text-5xl font-serif italic text-white mb-8">Executive Dashboard.</h2>
                            <div className="w-16 h-[1px] bg-white/[0.1]"></div>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex flex-wrap justify-center gap-4 lg:gap-12 mb-20">
                            {DASHBOARD_TABS.map((tab) => (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`flex items-center space-x-3 pb-4 transition-all duration-500 border-b-2 tracking-[0.2em] font-bold uppercase text-[11px] ${activeTab === tab.name
                                        ? 'border-[#d4af37] text-white'
                                        : 'border-transparent text-neutral-400 hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={14} strokeWidth={activeTab === tab.name ? 2.5 : 1.5} />
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            {DASHBOARD_TABS.find(t => t.name === activeTab).items.map((item, i) => (
                                <Link
                                    key={i}
                                    to={item.path}
                                    className="p-10 border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-700 rounded-[2rem] group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="flex items-start justify-between">
                                        <div className="max-w-[80%]">
                                            <h3 className="text-xl font-serif italic text-white mb-4 tracking-wide group-hover:text-[#d4af37] transition-colors">{item.title}</h3>
                                            <p className="text-sm text-neutral-200 font-light leading-relaxed tracking-wide">
                                                {item.desc}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl border border-white/[0.1] flex items-center justify-center text-[#d4af37] group-hover:border-[#d4af37]/50 transition-all duration-700">
                                            <item.icon size={20} strokeWidth={1} />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex items-center text-[10px] tracking-[0.4em] uppercase text-[#d4af37] opacity-60 group-hover:opacity-100 transition-all duration-700">
                                        Öffne Modul <ArrowUpRight size={12} className="ml-2" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Zen Market Table - Live Insights */}
                <ZenMarketTable />

                {/* Aesthetic Quote */}
                <section className="py-40 relative bg-[#050505]">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-[#d4af37]/40 to-transparent mx-auto mb-16"></div>
                        <p className="text-[10px] tracking-[0.5em] text-[#d4af37] uppercase mb-8 font-medium">Die Philosophie der Klarheit</p>
                        <p className="text-3xl md:text-5xl font-serif italic text-white/95 max-w-4xl mx-auto leading-snug">
                            "Wahre Erkenntnis liegt nicht in der Menge der Daten, <br />
                            sondern in der Klarheit des Musters."
                        </p>
                    </div>
                </section>
            </main>

            <ZenFooter />
        </div>
    );
};

const ArrowUpRight = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
);

export default LucidAlphaHome;
