import React from 'react';
import { Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const ZenFooter = () => {
    return (
        <footer className="bg-[#0a0a0a] pt-40 pb-20 border-t border-white/[0.02]">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-20 mb-32">
                    <div className="max-w-sm">
                        <Link to="/" className="flex items-center space-x-3 mb-10">
                            <div className="w-8 h-8 border border-[#d4af37]/30 rounded-full flex items-center justify-center bg-black/20">
                                <span className="text-[#d4af37] font-serif text-lg italic uppercase">L</span>
                            </div>
                            <span className="text-[10px] font-light tracking-[0.3em] text-white uppercase">LUCID ALPHA</span>
                        </Link>
                        <p className="text-neutral-300 text-[13px] leading-relaxed mb-12 tracking-wide font-light">
                            Entschlüsselung des saisonalen Rhythmus globaler Märkte.
                            Intelligenz, veredelt in ihrer reinsten Form.
                        </p>
                        <div className="flex space-x-8">
                            {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                                <a key={i} href="#" className="text-neutral-400 hover:text-[#d4af37] transition-all duration-700">
                                    <Icon size={14} strokeWidth={1} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20">
                        <div>
                            <h4 className="text-[#d4af37] font-medium mb-10 uppercase tracking-[0.4em] text-[9px]">Intelligenz</h4>
                            <ul className="space-y-6 text-[11px] text-neutral-300 tracking-[0.2em] font-light uppercase">
                                <li><Link to="/screener" className="hover:text-white transition-all duration-700">Screener</Link></li>
                                <li><Link to="/lucid-alpha" className="hover:text-white transition-all duration-700">Einblicke</Link></li>
                                <li><Link to="/dashboard" className="hover:text-white transition-all duration-700">Dashboard</Link></li>
                                <li><Link to="/13f" className="hover:text-white transition-all duration-700">13F Analyse</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[#d4af37] font-medium mb-10 uppercase tracking-[0.4em] text-[9px]">Rechtliches</h4>
                            <ul className="space-y-6 text-[11px] text-neutral-300 tracking-[0.2em] font-light uppercase">
                                <li><a href="#" className="hover:text-white transition-all duration-700">Impressum</a></li>
                                <li><a href="#" className="hover:text-white transition-all duration-700">Datenschutz</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[9px] text-neutral-800 tracking-[0.5em] uppercase font-light">
                        © 2026 LUCID ALPHA. STILLE IST STÄRKE.
                    </p>
                    <div className="w-12 h-[1px] bg-white/[0.03]"></div>
                </div>
            </div>
        </footer>
    );
};

export default ZenFooter;
