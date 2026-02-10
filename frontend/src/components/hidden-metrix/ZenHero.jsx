import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import heroBg from '../../assets/lucid_zen_bg.png';

const ZenHero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                <img
                    src={heroBg}
                    alt="Background"
                    className="w-full h-full object-cover scale-100 opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0a0a0a]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 text-center mt-[-5vh]">
                <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.05] text-[10px] tracking-[0.3em] font-medium text-[#d4af37] mb-12 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d4af37]"></span>
                    </span>
                    <span className="uppercase">V3.0 | Saisonale Intelligenz</span>
                </div>

                <h1 className="text-6xl md:text-9xl font-serif italic tracking-tight text-white mb-8 animate-fade-in opacity-0 leading-[1.1]" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                    Stille <span className="gold-gradient">Präzision.</span>
                </h1>

                <p className="max-w-xl mx-auto text-base md:text-lg text-neutral-200 mb-12 font-light leading-relaxed animate-fade-in opacity-0 tracking-wide" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                    Willkommen zu einer ruhigeren Art zu investieren.
                    Lucid Alpha entschlüsselt Marktmuster mit müheloser Klarheit.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-5 sm:space-y-0 sm:space-x-8 animate-fade-in opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                    <button className="zen-button-gold px-12 py-4 text-xs tracking-[0.2em] uppercase flex items-center group">
                        Reise beginnen
                        <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={16} strokeWidth={1.5} />
                    </button>
                    <button className="px-10 py-4 text-xs tracking-[0.2em] border-b border-white/20 text-white/70 hover:text-white transition-all uppercase flex items-center">
                        <Play className="mr-3 text-[#d4af37]" size={14} strokeWidth={1} />
                        Einblicke entdecken
                    </button>
                </div>

                {/* Minimalist Performance Metric */}
                <div className="mt-28 max-w-3xl mx-auto flex justify-between items-end border-t border-white/[0.1] pt-12 animate-fade-in opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                    <div className="text-left">
                        <p className="text-[9px] text-neutral-400 uppercase tracking-[0.4em] mb-2 font-medium">Algorithmus Alpha</p>
                        <p className="text-4xl font-serif italic text-[#d4af37]">+24.8%</p>
                    </div>
                    <div className="flex space-x-1 items-end h-16 w-1/2">
                        {[30, 45, 35, 60, 40, 55, 75, 50, 65, 80, 55, 70, 85, 60, 95].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-[#d4af37]/30 border-t border-[#d4af37]/50"
                                style={{ height: `${h}%` }}
                            ></div>
                        ))}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-neutral-400 uppercase tracking-[0.4em] mb-2 font-medium">Systemstatus</p>
                        <p className="text-sm font-light text-white uppercase tracking-widest">Aktiver Einblick</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ZenHero;
