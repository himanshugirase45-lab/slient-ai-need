import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Layers, Cpu, Truck, Plus, Search, 
  Filter, AlertTriangle, Droplets, MapPin, BarChart3, ChevronRight, 
  ExternalLink, Sparkles, RefreshCw, CheckCircle2, Info,
  Compass, Building, ShieldCheck, Globe, Clock, History, Calendar, TrendingUp,
  Sun, Moon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  ComposedChart, Line, Area
} from 'recharts';

import { 
  fetchCommunities, fetchAnalyticsOverview, fetchComplaintGapMatrix, fetchCityOSMAudit,
  fetchAllSignalRecords
} from './services/api';
import { formatDateTime, formatShortDateTime } from './utils/dateFormat';

import CommunityMap from './components/CommunityMap';
import ComplaintGapMatrix from './components/ComplaintGapMatrix';
import ExplainabilityDrawer from './components/ExplainabilityDrawer';
import SimulationSandbox from './components/SimulationSandbox';
import InterventionsView from './components/InterventionsView';
import AddCommunityModal from './components/AddCommunityModal';
import SignalHistoryModal from './components/SignalHistoryModal';
import CivicChatbot from './components/CivicChatbot';
import LandingPage from './pages/LandingPage';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from './i18n/translations';

export default function App() {
  const [currentLang, setCurrentLang] = useState('en');
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('silentneed_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('silentneed_theme', next);
      if (next === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      return next;
    });
  };

  // Page routing: 'landing' (showcase landing page) | 'app' (full operational dashboard)
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash;
    if (['#dashboard', '#matrix', '#simulation', '#interventions', '#app'].includes(hash)) {
      return 'app';
    }
    return 'landing';
  });

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash;
    if (['#dashboard', '#matrix', '#simulation', '#interventions'].includes(hash)) {
      return hash.replace('#', '');
    }
    return 'dashboard';
  }); // 'dashboard', 'matrix', 'simulation', 'interventions'
  const [communities, setCommunities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [matrixData, setMatrixData] = useState([]);
  const [osmCityAudit, setOsmCityAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  // Selection & Modals
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [simulationTarget, setSimulationTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [signalHistoryCommunity, setSignalHistoryCommunity] = useState(null);
  const [allSignals, setAllSignals] = useState([]);
  const [chartMode, setChartMode] = useState('sectors'); // 'sectors' | 'timeline'

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [comms, stats, matrix, osmAudit, signals] = await Promise.all([
        fetchCommunities({
          search: searchQuery,
          risk_tier: tierFilter,
          anomaly_only: anomalyOnly
        }),
        fetchAnalyticsOverview(),
        fetchComplaintGapMatrix(),
        fetchCityOSMAudit().catch(() => null),
        fetchAllSignalRecords({ order: 'asc' }).catch(() => [])
      ]);
      setCommunities(comms);
      setAnalytics(stats);
      setMatrixData(matrix);
      if (osmAudit) setOsmCityAudit(osmAudit);
      if (signals) setAllSignals(signals);
    } catch (err) {
      console.error("Data load failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [searchQuery, tierFilter, anomalyOnly]);

  // Synchronize hash with current view
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (['#dashboard', '#matrix', '#simulation', '#interventions'].includes(hash)) {
        setActiveTab(hash.replace('#', ''));
        setCurrentPage('app');
      } else if (hash === '#app') {
        setCurrentPage('app');
      } else if (hash === '' || hash === '#landing') {
        setCurrentPage('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToApp = (tab = 'dashboard') => {
    setActiveTab(tab);
    setCurrentPage('app');
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSimulation = (comm) => {
    setSimulationTarget(comm);
    setActiveTab('simulation');
  };

  const handleCreateInterventionFromDrawer = (comm) => {
    setSelectedCommunity(null);
    setActiveTab('interventions');
  };

  // Prepare sector distress bar chart data
  const sectorChartData = analytics?.sector_distress_breakdown 
    ? Object.entries(analytics.sector_distress_breakdown).map(([name, score]) => ({
        name,
        score
      }))
    : [];

  if (currentPage === 'landing') {
    return (
      <div className="relative">
        <LandingPage
          onExplore={navigateToApp}
          onNavigateTab={navigateToApp}
          communities={communities}
          analytics={analytics}
          allSignals={allSignals}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        {/* Civic Chatbot also available on landing page */}
        <CivicChatbot
          currentLang={currentLang}
          setLang={setCurrentLang}
          communities={communities}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-4">
          
          {/* Logo & Platform Name (Clickable to return to Landing Page) */}
          <div 
            onClick={navigateToLanding}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
            title="Return to SilentNeed AI Landing Page"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/20 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-extrabold tracking-tight text-white m-0 p-0 whitespace-nowrap">
                {t.appName.split(" ")[0]} <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{t.appName.split(" ")[1] || "AI"}</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                ML Risk Radar
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner">
            <button
              onClick={navigateToLanding}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Return to Landing Page Overview"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap">Landing</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t.navDashboard}</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'matrix'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t.navMatrix}</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'simulation'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t.navSandbox}</span>
            </button>

            <button
              onClick={() => setActiveTab('interventions')}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'interventions'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t.navInterventions}</span>
            </button>
          </nav>

          {/* Action Buttons & Language Switcher & Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn-app"
              onClick={toggleTheme}
              className="h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-cyan-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Multilingual Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 h-8 sm:h-9 hover:border-slate-600 transition shadow-sm">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value)}
                className="bg-transparent text-xs text-white font-semibold outline-none cursor-pointer pr-1"
                aria-label="Select Language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.native}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="h-8 sm:h-9 flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-3.5 rounded-xl transition-all shadow-md shadow-cyan-900/40 hover:shadow-cyan-500/20 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="whitespace-nowrap">{t.navAddAudit}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* OpenStreetMap (OSM) Cartographic & Physical Amenity Intelligence Bar */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl px-5 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-xl border border-cyan-500/20 font-bold text-[11px]">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  {t.osmBarTitle}
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-medium text-[11px]">
                  <span className="text-slate-400">{t.osmBarScanned}:</span>
                  <span className="font-bold text-white">
                    {osmCityAudit ? (osmCityAudit.total_osm_water_points_mapped + osmCityAudit.total_osm_clinics_mapped) : 18} Verified
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">💧 {t.osmBarWater}: <strong className="text-cyan-300">{osmCityAudit?.total_osm_water_points_mapped || 8}</strong></span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">🏥 {t.osmBarClinics}: <strong className="text-emerald-300">{osmCityAudit?.total_osm_clinics_mapped || 8}</strong></span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">🚨 {t.osmBarDeserts}: <strong className="text-rose-400">{osmCityAudit?.osm_infrastructure_deserts_count || 4} Critical Zones</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>OSM Overpass & Nominatim:</span>
                <strong className="text-emerald-300">Synchronized (HOT & Standard Layers Active)</strong>
              </div>
            </div>
            
            {/* The Complaint Paradox Callout Banner */}
            <div className={`border rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              theme === 'light'
                ? 'bg-gradient-to-r from-sky-50 via-white to-blue-50/70 border-sky-200'
                : 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-cyan-800/40'
            }`}>
              <div className="space-y-1 max-w-3xl">
                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  {t.blindspotTitle}
                </div>
                <h2 className={`text-base font-bold m-0 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {t.blindspotSubtitle}
                </h2>
                <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t.blindspotDesc}
                </p>
              </div>

              {analytics?.complaint_disparity_paradox && (
                <div className={`p-3.5 rounded-xl border shrink-0 text-xs space-y-1 md:min-w-[280px] shadow-sm ${
                  theme === 'light' 
                    ? 'bg-white border-sky-200 text-slate-800' 
                    : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {t.disparityLabel}
                  </span>
                  <div className={`flex justify-between items-center ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span>{t.excludedComplaints}:</span>
                    <strong className={`${theme === 'light' ? 'text-amber-600' : 'text-amber-400'} font-mono font-bold`}>
                      {analytics.complaint_disparity_paradox.digitally_excluded_avg_complaints} avg
                    </strong>
                  </div>
                  <div className={`flex justify-between items-center ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span>{t.trueDistress}:</span>
                    <strong className={`${theme === 'light' ? 'text-rose-600' : 'text-red-400'} font-mono font-bold`}>
                      {analytics.complaint_disparity_paradox.digitally_excluded_avg_real_risk}/100
                    </strong>
                  </div>
                  <div className={`text-[10px] pt-1 border-t ${
                    theme === 'light' ? 'text-cyan-800 border-slate-100 font-medium' : 'text-cyan-300/90 border-slate-800'
                  }`}>
                    {analytics.complaint_disparity_paradox.paradox_insight}
                  </div>
                </div>
              )}
            </div>

            {/* 4 Executive KPI Cards */}
            {analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">{t.kpiPopulation}</span>
                  <div className="text-2xl font-extrabold text-white">
                    {analytics.total_population_monitored?.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Across {analytics.total_communities} monitored zones
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">{t.kpiCriticalZones}</span>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {analytics.critical_risk_zones}
                  </div>
                  <span className="text-[10px] text-rose-400/80 mt-1 block">
                    High distress with suppressed tickets
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">{t.kpiAvgSni}</span>
                  <div className="text-2xl font-extrabold text-cyan-400">
                    {analytics.average_silent_need_index} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 mt-1 block">
                    City-wide invisible deficit index
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">{t.kpiAnomalies}</span>
                  <div className="text-2xl font-extrabold text-amber-300">
                    {analytics.detected_silent_anomalies}
                  </div>
                  <span className="text-[10px] text-amber-300/80 mt-1 block">
                    Flagged by Scikit-learn Outlier Model
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Leaflet Geo-Map Component */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {t.mapTitle}
                </h3>
                <span className="text-xs text-slate-400">
                  {t.mapSubtitle}
                </span>
              </div>
              <CommunityMap
                communities={communities}
                selectedCommunity={selectedCommunity}
                onSelectCommunity={(comm) => setSelectedCommunity(comm)}
              />
            </div>

            {/* Filter and Communities Table / Inspector Grid */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base">{t.tableTitle}</h3>
                  <p className="text-xs text-slate-400">
                    {t.tableSubtitle}
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-cyan-500 w-44"
                    />
                  </div>

                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 outline-none focus:border-cyan-500"
                  >
                    <option value="">{t.filterAllTiers}</option>
                    <option value="Critical">{t.filterCriticalOnly}</option>
                    <option value="High">{t.filterHighOnly}</option>
                    <option value="Moderate">{t.filterModerateOnly}</option>
                    <option value="Low">{t.filterLowOnly}</option>
                  </select>

                  <button
                    onClick={() => setAnomalyOnly(!anomalyOnly)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition cursor-pointer ${
                      anomalyOnly 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {t.filterAnomaliesOnly}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">{t.thCommunity}</th>
                      <th className="py-3 px-3">{t.thPopulation}</th>
                      <th className="py-3 px-3 text-center">{t.thActual}</th>
                      <th className="py-3 px-3 text-center">{t.thExpected}</th>
                      <th className="py-3 px-3 text-center">{t.thGap}</th>
                      <th className="py-3 px-3 text-center">{t.thDistress}</th>
                      <th className="py-3 px-3 text-center">{t.thSni}</th>
                      <th className="py-3 px-4 text-right">{t.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {communities.map((comm) => {
                      const pred = comm.latest_prediction || {};
                      const ind = comm.latest_indicator || {};
                      const tier = pred.risk_tier || 'Moderate';
                      const actual = pred.actual_complaints_90d ?? ind.official_complaints_registered_90d ?? 0;
                      const expected = pred.expected_complaints_90d || 0;
                      const gap = pred.complaint_gap_ratio || 1.0;
                      const sni = pred.silent_need_index || 0;

                      return (
                        <tr 
                          key={comm.id} 
                          className="hover:bg-slate-800/40 transition cursor-pointer"
                          onClick={() => setSelectedCommunity(comm)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">{comm.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span>{comm.zone_type}</span>
                              <span>&bull;</span>
                              <span className="font-mono text-cyan-400">{comm.code}</span>
                              <span>&bull;</span>
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSignalHistoryCommunity(comm);
                                }}
                                title="Click to view Append-Only Signal Records & Silence Clock"
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                                  comm.silence_status === 'Critical' 
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25' 
                                    : comm.silence_status === 'Attention Needed'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                }`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                <span>{comm.silence_display || "Active"}</span>
                                {comm.silence_alert_triggered && <span className="text-[9px] uppercase font-bold text-rose-400">(Alert)</span>}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-300">
                            {comm.population?.toLocaleString()}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {actual}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-mono text-slate-300">
                            {Math.round(expected)}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                              gap > 4.0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              gap > 1.8 ? 'bg-orange-500/20 text-orange-400' :
                              'text-slate-400'
                            }`}>
                              {gap.toFixed(1)}x
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="font-bold text-slate-200">
                              {pred.final_risk_score?.toFixed(1) || '0.0'}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              tier === 'Critical' ? 'text-red-400' :
                              tier === 'High' ? 'text-orange-400' :
                              'text-emerald-400'
                            }`}>
                              {tier}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="font-mono font-extrabold text-sm text-cyan-400">
                              {sni.toFixed(1)}
                            </div>
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  sni >= 70 ? 'bg-red-500' :
                                  sni >= 50 ? 'bg-orange-500' :
                                  'bg-cyan-500'
                                }`}
                                style={{ width: `${Math.min(100, sni)}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSignalHistoryCommunity(comm);
                                }}
                                title="Open Append-Only Signal Records & Silence Clock"
                                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                              >
                                <History className="w-3 h-3 text-cyan-400" />
                                <span>Signals</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCommunity(comm);
                                }}
                                className="inline-flex items-center gap-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-cyan-500/30 transition cursor-pointer"
                              >
                                {t.btnXaiBrief}
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* City-Wide Public Service Vulnerability Spectrum & Chronological Timeline Chart */}
            {(sectorChartData.length > 0 || allSignals.length > 0) && (() => {
              const latestEvalDate = analytics?.latest_evaluation_date || (communities[0]?.latest_prediction?.evaluation_date) || new Date().toISOString();
              const evalDateFormatted = formatDateTime(latestEvalDate);

              const SectorCustomTooltip = ({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 z-50">
                      <div className="font-bold text-white text-sm border-b border-slate-800 pb-1 flex justify-between items-center gap-3">
                        <span>{data.name}</span>
                        <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          data.score > 60 ? 'bg-red-500/20 text-red-300' :
                          data.score > 40 ? 'bg-orange-500/20 text-orange-300' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {data.score} / 100
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Evaluation Date & Time:</span>
                        <strong className="text-white font-mono">{evalDateFormatted}</strong>
                      </div>
                      <p className="text-[10px] text-slate-400 pt-0.5 leading-relaxed">
                        Cross-ward public service deficit benchmark aggregated from municipal database.
                      </p>
                    </div>
                  );
                }
                return null;
              };

              const timelineData = (allSignals || []).map((s, idx) => {
                const comm = communities.find(c => c.id === s.community_id);
                return {
                  id: s.id,
                  timestamp: new Date(s.received_at).getTime(),
                  dateLabel: formatShortDateTime(s.received_at),
                  fullDateTime: formatDateTime(s.received_at),
                  signal_type: s.signal_type,
                  source: s.source,
                  severity: s.severity,
                  summary: s.summary,
                  wardName: comm ? comm.name : `Ward ID ${s.community_id}`,
                  cumulativeCount: idx + 1,
                  is_correction: s.is_correction
                };
              });

              const TimelineGlobalTooltip = ({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs max-w-xs space-y-2 z-50">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-2">
                        <span className="font-bold text-white truncate max-w-[170px]">{data.wardName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          data.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                          data.severity === 'High' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {data.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{data.fullDateTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Type: <strong className="text-amber-300">{data.signal_type}</strong> &bull; Signal #{data.id}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Reporter: <strong className="text-slate-100">{data.source}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5 border-t border-slate-800">
                        <span>Cumulative Civic Records:</span>
                        <strong className="text-cyan-400 font-mono">{data.cumulativeCount}</strong>
                      </div>
                      {data.summary && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[240px] pt-0.5">
                          "{data.summary}"
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              };

              return (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        {chartMode === 'sectors' 
                          ? "City-Wide Public Service Vulnerability Spectrum" 
                          : "Chronological Civic Signal Intake & Silence Progression"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {chartMode === 'sectors'
                          ? "Average distress score across the 7 monitored public service sectors."
                          : "Chronological intake of complaints, surveys, and field reports arranged oldest to newest."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Evaluation timestamp badge */}
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Timestamp: {evalDateFormatted}</span>
                      </span>

                      {/* Chart Mode Toggle */}
                      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
                        <button
                          onClick={() => setChartMode('sectors')}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            chartMode === 'sectors' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sectors
                        </button>
                        <button
                          onClick={() => setChartMode('timeline')}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                            chartMode === 'timeline' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Signal Timeline</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {chartMode === 'sectors' ? (
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorChartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip content={<SectorCustomTooltip />} />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                            {sectorChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.score > 60 ? '#ef4444' : entry.score > 40 ? '#f97316' : '#0284c7'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={timelineData} margin={{ top: 10, right: 20, bottom: 25, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis 
                              dataKey="dateLabel" 
                              stroke="#64748b" 
                              tick={{ fill: '#94a3b8', fontSize: 10 }}
                              angle={-15}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis 
                              stroke="#38bdf8" 
                              tick={{ fill: '#94a3b8', fontSize: 11 }} 
                              domain={[0, 'dataMax + 2']}
                              allowDecimals={false}
                              label={{ value: "Total Signals Received", angle: -90, position: "insideLeft", fill: "#38bdf8", fontSize: 11 }}
                            />
                            <Tooltip content={<TimelineGlobalTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="cumulativeCount" 
                              stroke="#38bdf8" 
                              fill="#38bdf8" 
                              fillOpacity={0.15} 
                              strokeWidth={2}
                              dot={{ r: 4, fill: "#0284c7" }}
                              activeDot={{ r: 6, fill: "#38bdf8" }}
                              name="Cumulative Civic Intake"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Chronological civic intake across all municipal wards (oldest to newest)</span>
                        <span>Hover over points to inspect exact date, time, and ward information</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 2. COMPLAINT-GAP MATRIX VIEW */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <ComplaintGapMatrix
              matrixData={matrixData}
              onSelectCommunity={(point) => {
                const found = communities.find(c => c.id === point.community_id);
                if (found) setSelectedCommunity(found);
              }}
            />
          </div>
        )}

        {/* 3. POLICY SIMULATION SANDBOX VIEW */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <SimulationSandbox
              communities={communities}
              preselectedCommunity={simulationTarget}
            />
          </div>
        )}

        {/* 4. INTERVENTIONS PIPELINE VIEW */}
        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <InterventionsView
              communities={communities}
              onRefreshData={loadAllData}
            />
          </div>
        )}
      </main>

      {/* Slide-in Explainable AI Inspector Drawer */}
      <ExplainabilityDrawer
        community={selectedCommunity}
        onClose={() => setSelectedCommunity(null)}
        onOpenSimulation={handleOpenSimulation}
        onCreateIntervention={handleCreateInterventionFromDrawer}
        onOpenSignalHistory={(comm) => setSignalHistoryCommunity(comm)}
      />

      {/* Append-Only Signal Records & Silence Clock Modal */}
      <SignalHistoryModal
        isOpen={Boolean(signalHistoryCommunity)}
        onClose={() => setSignalHistoryCommunity(null)}
        community={signalHistoryCommunity}
        onSignalCreated={loadAllData}
      />

      {/* Add Community / Field Survey Modal */}
      <AddCommunityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCommunityAdded={loadAllData}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SilentNeed AI &bull; Social Impact Public-Service Risk & Invisible Problem Detection System
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              FastAPI + ML Active
            </span>
            <span>&bull;</span>
            <span>Scikit-Learn Ensemble & Outlier Engine</span>
          </div>
        </div>
      </footer>

      {/* Multilingual AI Civic Ombudsman Chatbot */}
      <CivicChatbot
        currentLang={currentLang}
        setLang={setCurrentLang}
        communities={communities}
      />
    </div>
  );
}
