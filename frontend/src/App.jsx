
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import SeasonalityHub from './pages/SeasonalityHub';
import TradingSeasonality from './pages/TradingSeasonality';
import StockSeasonality from './pages/StockSeasonality';
import AssetAnalysisWindow from './pages/AssetAnalysisWindow';
import CotAnalysis from './pages/CotAnalysis';
import Screener from './pages/Screener';
import HomePage from './pages/HomePage';
import Calculators from './pages/Calculators';
import QNews from './pages/QNews';
import Cycles from './pages/Cycles';
import { Sparkles } from 'lucide-react';

import logo from './assets/lucid_alpha_logo.png';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`relative transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-5 left-0 w-full h-0.5 bg-white" />
      )}
    </Link>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent)] text-gray-300 font-sans selection:bg-white/30">
      {/* Navigation Bar */}
      <nav className="bg-transparent relative z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Lucid Alpha" className="h-10 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <NavLink to="/valuation">Valuation</NavLink>
            <NavLink to="/trading">Trading</NavLink>
            <NavLink to="/stocks">Aktien</NavLink>
            <NavLink to="/seasonality">Saisonalität</NavLink>
            <NavLink to="/calculators">Rechner</NavLink>
            <NavLink to="/cycles">Cycles</NavLink>
            <NavLink to="/qnews">QNews</NavLink>
          </div>

          <div className="flex items-center gap-4">
            {/* User Icon Removed */}
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/valuation" element={<Dashboard />} />
          <Route path="/trading" element={<AssetList />} />
          <Route path="/seasonality" element={<SeasonalityHub />} />

          <Route path="/analysis-window" element={<AssetAnalysisWindow />} />
          <Route path="/stocks" element={<StockSeasonality />} />
          <Route path="/seasonality/stocks" element={<StockSeasonality />} />
          <Route path="/seasonality/trading" element={<TradingSeasonality />} />
          <Route path="/seasonality/screener" element={<Screener />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/cycles" element={<Cycles />} />
          <Route path="/qnews" element={<QNews />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
