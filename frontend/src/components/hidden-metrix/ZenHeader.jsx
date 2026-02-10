import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ZenHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Aktien', path: '/stocks' },
        { name: '13 F', path: '/13f' },
        { name: 'Rechner', path: '/calculators' },
        { name: 'Terminkurven', path: '/term-structure' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-1000 ${scrolled ? 'py-4 bg-[#050505]/70 backdrop-blur-xl border-b border-[#d4af37]/10' : 'py-8 bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 sm:px-10">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-4 group">
                        <div className="relative w-10 h-10 border border-[#d4af37]/40 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-700 group-hover:border-[#d4af37]/80 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                            <span className="text-[#d4af37] font-serif text-xl italic uppercase">L</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-light tracking-[0.3em] text-white japanese-minimal group-hover:text-[#d4af37] transition-colors duration-700">LUCID ALPHA</span>
                            <span className="text-[7px] tracking-[0.6em] text-neutral-500 uppercase mt-0.5">Seasonal Intelligence</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-14">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`text-[10px] font-bold tracking-[0.4em] transition-all duration-700 relative group uppercase ${location.pathname === item.path ? 'text-[#d4af37]' : 'text-neutral-400 hover:text-white'
                                    }`}
                            >
                                {item.name}
                                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent transition-all duration-700 ${location.pathname === item.path ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </Link>
                        ))}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden text-white w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-all duration-500 border border-white/10"
                    >
                        {isMenuOpen ? <X size={18} strokeWidth={1} /> : <Menu size={18} strokeWidth={1} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/98 backdrop-blur-3xl animate-fade-in flex flex-col pt-32">
                    <div className="flex flex-col items-center space-y-10">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="text-2xl font-serif italic text-neutral-200 hover:text-[#d4af37] transition-all duration-500 tracking-wider"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default ZenHeader;
