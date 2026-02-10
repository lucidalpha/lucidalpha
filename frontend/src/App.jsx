
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
import HMMAnalysis from './pages/HMMAnalysis';
import CurrencyAnalysis from './pages/CurrencyAnalysis';
import TermStructure from './pages/TermStructure';
import FundAnalysisWindow from './pages/FundAnalysisWindow';
import SmartMoneyDashboard from './pages/SmartMoneyDashboard';
import LucidAlphaHome from './pages/HiddenMetrix/LucidAlphaHome';
import TechBackground from './components/ui/TechBackground';
import ZenHeader from './components/hidden-metrix/ZenHeader';

function Layout() {
  const location = useLocation();

  return (
    <div className={`min-h-screen text-white font-sans selection:bg-[#10b981]/30 relative`}>
      <TechBackground />
      <div className="vignette-overlay" />

      <ZenHeader />

      <main className="relative z-10">
        <div className={location.pathname === '/' ? '' : 'pt-32'}>
          <Routes>
            <Route path="/" element={<LucidAlphaHome />} />
            <Route path="/stocks" element={<StockSeasonality />} />
            <Route path="/seasonality/stocks" element={<StockSeasonality />} />
            <Route path="/seasonality/trading" element={<TradingSeasonality />} />
            <Route path="/trading" element={<AssetList mode="trading" />} />

            <Route path="/13f" element={<SmartMoneyDashboard />} />
            <Route path="/smart-money" element={<SmartMoneyDashboard />} />
            <Route path="/fund-analysis" element={<FundAnalysisWindow />} />

            <Route path="/valuation" element={<StockSeasonality />} />

            <Route path="/analysis-window" element={<AssetAnalysisWindow />} />
            <Route path="/calculators" element={<Calculators />} />
            <Route path="/term-structure" element={<TermStructure />} />

            <Route path="/hmm" element={<HMMAnalysis />} />
            <Route path="/cycles" element={<Cycles />} />
            <Route path="/cot" element={<CotAnalysis />} />
            <Route path="/qnews" element={<QNews />} />
            <Route path="/currency" element={<CurrencyAnalysis />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/hidden-metrix" element={<LucidAlphaHome />} />
            <Route path="/lucid-alpha" element={<LucidAlphaHome />} />
          </Routes>
        </div>
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
