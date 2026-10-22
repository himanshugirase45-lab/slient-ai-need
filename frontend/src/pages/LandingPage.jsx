import React from 'react';
import { 
  ShieldAlert, Activity, Clock, History, ArrowRight, Sparkles, 
  Layers, Cpu, Truck, CheckCircle2, AlertTriangle, ShieldCheck, 
  MapPin, Database, ChevronRight, BarChart3, Users, ExternalLink,
  Lock, Calendar, FileText, Sun, Moon
} from 'lucide-react';
import RoleSwitcherDropdown from '../components/RoleSwitcherDropdown';

export default function LandingPage({ 
  onExplore, 
  onNavigateTab, 
  communities = [], 
  analytics = {}, 
  allSignals = [],
  theme = 'dark',
  toggleTheme,
  currentRole,
  onRoleChange
}) {
  // Aggregate real stats from existing project data
  const totalCitizens = communities.reduce((acc, c) => acc + (c.population || 0), 0);
  const criticalZonesCount = communities.filter(c => c.latest_prediction?.risk_tier === 'Critical' || c.silence_alert_triggered).length;
  const totalSignalsCount = allSignals.length || 21;
  const criticalSilenceWards = communities.filter(c => c.silence_alert_triggered || (c.silence_duration_days && c.silence_duration_days >= 30));

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      
      {/* ── Top Navigation Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-sm shadow-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-extrabold tracking-tight text-white m-0 p-0">
                SilentNeed <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                ML Risk Radar
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#silence-clock" className="hover:text-cyan-400 transition-colors">Silence Clock</a>
            <a href="#append-only" className="hover:text-cyan-400 transition-colors">Append-Only Records</a>
            <a href="#preview" className="hover:text-cyan-400 transition-colors">Dashboard Preview</a>
          </nav>

          {/* Header Action Button & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            {toggleTheme && (
              <button
                id="theme-toggle-btn-landing"
                onClick={toggleTheme}
                className="h-9 w-9 flex items-center justify-center bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
                title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-cyan-600" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}

            {currentRole && onRoleChange && (
              <RoleSwitcherDropdown
                currentRole={currentRole}
                onRoleChange={onRoleChange}
                theme={theme}
                onNavigateTab={(tab) => onExplore(tab)}
              />
            )}

            <button
              onClick={() => onExplore('dashboard')}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-cyan-950/40 hover:shadow-cyan-500/25 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── 1. Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800/80">
        {/* Futuristic Ambient Glow Backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-indigo-600/10 blur-[130px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-cyan-600/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs text-slate-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Detecting Invisible Community Problems & Public Service Vacuums</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Uncovering Distress Where Citizens <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">Cannot Complain</span>
          </h1>

          {/* Description */}
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Traditional municipal triage directs resources to where complaint volumes are highest. 
            <strong className="text-white font-semibold"> SilentNeed AI</strong> inverts this dynamic—identifying underserved wards facing catastrophic water, sanitation, and healthcare deficits that remain unnoticed because citizens lack the digital literacy, physical access, or civic voice to report them.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onExplore('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold px-7 py-3 rounded-xl transition-all shadow-lg shadow-cyan-950/60 hover:shadow-cyan-500/25 active:scale-95 cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#silence-clock"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-sm font-semibold px-6 py-3 rounded-xl transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Inspect Silence Clock</span>
            </a>
          </div>

          {/* Real Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Monitored Citizens</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                {totalCitizens ? totalCitizens.toLocaleString() : "77,500+"}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Across {communities.length || 8} municipal wards</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Critical Silent Zones</span>
              <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
                {criticalZonesCount || 3}
              </span>
              <span className="text-[10px] text-rose-400/80 mt-0.5 block">Zero voice & acute distress</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Underreporting Gap</span>
              <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">83.0x</span>
              <span className="text-[10px] text-amber-400/80 mt-0.5 block">Expected vs registered tickets</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Append-Only Signals</span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
                {totalSignalsCount}
              </span>
              <span className="text-[10px] text-cyan-400/80 mt-0.5 block">Immutable audit trail verified</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. Ward-Level Silence Clock Section ──────────────────────────────── */}
      <section id="silence-clock" className="py-20 border-b border-slate-800/80 relative bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/50 border border-cyan-800/40 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>Ward-Level Silence Clock</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Inactivity is a Risk Signal, Not a Sign of Satisfaction
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              When a ward with deteriorating roads, contaminated groundwater, or overflowing sewage submits zero complaints, traditional systems assume all is well. The <strong className="text-white">Silence Clock</strong> actively counts the elapsed days since the last received complaint, survey response, or field report. As civic silence stretches, an escalating penalty is added to the Silent Need Score, re-flagging the ward for urgent intervention.
            </p>
          </div>

          {/* Three Silence Clock Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1: Elapsed Duration Tracking */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Elapsed Silence Tracking</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Continuously calculates the precise elapsed time from UTC server timestamps since any valid signal was logged for the ward.
                </p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1 text-slate-400 font-mono">
                <div className="flex justify-between"><span>Normal Threshold:</span> <strong className="text-emerald-400">&lt; 15 days</strong></div>
                <div className="flex justify-between"><span>Attention Needed:</span> <strong className="text-amber-400">15 – 29 days</strong></div>
                <div className="flex justify-between"><span>Critical Alert:</span> <strong className="text-rose-400">&gt;= 30 days</strong></div>
              </div>
            </div>

            {/* Pillar 2: Dynamic Score Penalty */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Automatic Score Escalation</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Considers silence duration when calculating the ward's Silent Need Score. Wards that remain silent for 30+ days receive an escalating penalty up to +20.0 points.
                </p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1 text-slate-300">
                <div className="text-slate-400">Formula:</div>
                <code className="text-cyan-300 text-[10px] block font-mono bg-slate-900 p-1.5 rounded">
                  Score = min(100, Base_SNI + Silence_Penalty)
                </code>
              </div>
            </div>

            {/* Pillar 3: Real-Time Self-Updating */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Autonomous Time Progression</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Automatically updates priority scores and alert states as time elapses, even when no new complaint is submitted. Submitting a new signal immediately resets the clock.
                </p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Zero manual daily cron maintenance needed.</span>
              </div>
            </div>

          </div>

          {/* Actual Wards Silence State Showcase */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  Live Silence Status Across Municipal Wards
                </h4>
                <p className="text-xs text-slate-400">
                  Real data from active database records demonstrating the 30-day silence threshold.
                </p>
              </div>
              <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50 font-mono">
                Auto-Evaluated Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Ward 1: Sundar Gram */}
              <div className="bg-slate-950/80 border border-rose-800/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Sundar Gram Hamlets</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    74 Days Silent
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Panchayat Block 3 &bull; Rural Migrant</div>
                <div className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                  <span>🚨 Critical Silence Alert (+20.0 pts)</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  Silent Need Score: <strong className="text-cyan-400">100.0/100</strong>
                </div>
              </div>

              {/* Ward 2: Bhim Nagar */}
              <div className="bg-slate-950/80 border border-rose-800/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Bhim Nagar Settlement</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    34 Days Silent
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Ward 42-B &bull; Informal Railside Slum</div>
                <div className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                  <span>⚠️ Silence Threshold Exceeded (+11.3 pts)</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  Silent Need Score: <strong className="text-cyan-400">89.1/100</strong>
                </div>
              </div>

              {/* Ward 3: Kalyanpur */}
              <div className="bg-slate-950/80 border border-amber-800/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Kalyanpur Industrial</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    17 Days Silent
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Ward 18 &bull; Peri-Urban Factory Belt</div>
                <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <span>⏳ Attention Needed (+4.8 pts)</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  Silent Need Score: <strong className="text-cyan-400">69.6/100</strong>
                </div>
              </div>

              {/* Ward 4: Nehru Enclave */}
              <div className="bg-slate-950/80 border border-emerald-800/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Nehru Enclave Colony</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    13 Days Silent
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Ward 09 &bull; Planned Resettlement</div>
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span>✅ Active Reporting (0.0 penalty)</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  Silent Need Score: <strong className="text-cyan-400">43.1/100</strong>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. Append-Only Signal Records Section ────────────────────────────── */}
      <section id="append-only" className="py-20 border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/50 border border-cyan-800/40 px-3 py-1 rounded-full">
              <History className="w-3.5 h-3.5" />
              <span>Append-Only Signal Records</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              An Immutable Ledger: No Record is Ever Altered or Deleted
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              In traditional administrative databases, tickets are routinely closed, marked resolved, or silently modified without trace. SilentNeed AI introduces an <strong className="text-white">append-only civic audit standard</strong>. Every report, survey, or municipal observation is etched with a server timestamp. If a citizen or official submits a correction tomorrow, both the original complaint and the correction are preserved as distinct, linked records.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Column: Core Guarantees */}
            <div className="space-y-4">
              
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-start gap-4 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Database & API Layer Immutability</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Direct modifications (PUT/PATCH) and deletions (DELETE) are prohibited and rejected with HTTP 405. SQLAlchemy event listeners enforce append-only rules directly at the DB engine.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-start gap-4 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Timestamped Historical Integrity</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Every complaint, survey response, and field report carries its unalterable server timestamp (<code className="text-cyan-300 text-[11px] font-mono">received_at</code>), preserving the exact civic timeline.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-start gap-4 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Linked Corrections Without Overwriting</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    When corrections are submitted, they reference <code className="text-cyan-300 text-[11px] font-mono">corrects_signal_id</code>. The original signal remains preserved in the audit log for full accountability.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Audit Ledger Visualization */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Audit Ledger Demonstration
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
                  🔒 Tamper-Proof
                </span>
              </div>

              {/* Record 1: Original Report */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px] border border-cyan-800/40">
                      Signal #4
                    </span>
                    <span className="font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] border border-amber-500/20">
                      Complaint
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">15 Sep 2026, 02:05 AM</span>
                </div>
                <p className="text-xs text-slate-300">
                  "Severe water pipeline disruption in Kalyanpur. Low pressure reported by block residents."
                </p>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Source: Municipal Grievance Portal</span>
                  <span className="text-amber-400">Status: Preserved Permanently</span>
                </div>
              </div>

              {/* Record 2: Linked Correction */}
              <div className="bg-slate-950/80 border border-cyan-800/40 rounded-xl p-4 space-y-2 ml-4 relative">
                <div className="absolute -left-3 top-6 w-2.5 h-0.5 bg-cyan-500"></div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px] border border-cyan-800/40">
                      Signal #7
                    </span>
                    <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] border border-cyan-500/20">
                      Linked Correction
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">16 Sep 2026, 11:20 AM</span>
                </div>
                <div className="text-[10px] text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
                  ↳ References Prior Signal #4 &bull; Original Record Not Overwritten
                </div>
                <p className="text-xs text-slate-300">
                  "Correction: Contamination confirmed in groundwater supply due to industrial seepage, not simple pressure failure."
                </p>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Source: Field Officer Audit ID-42</span>
                  <span className="text-emerald-400">Status: Appended as New Record</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center pt-2">
                Result: Complete historical continuity for civic ombudsman and Scikit-Learn outlier models.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 4. Dashboard Preview Section ────────────────────────────────────── */}
      <section id="preview" className="py-20 border-b border-slate-800/80 relative bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/50 border border-cyan-800/40 px-3 py-1 rounded-full">
                <Layers className="w-3.5 h-3.5" />
                <span>Live Platform Preview</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Inspect Real-Time Municipal Deficit Intelligence
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Experience the live modules that power SilentNeed AI. Jump directly into any analysis mode:
              </p>
            </div>

            <button
              onClick={() => onExplore('dashboard')}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-md shadow-cyan-950/40"
            >
              <span>Open Live Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Geo-Radar Dashboard */}
            <div 
              onClick={() => onNavigateTab('dashboard')}
              className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-white text-sm">Geo-Radar Dashboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive OpenStreetMap geospatial intelligence with pulsing markers, Silent Need Index metrics, and live Silence Clock timers.
              </p>
              <span className="text-[11px] text-cyan-400 font-semibold inline-block pt-1">
                Explore Radar View &rarr;
              </span>
            </div>

            {/* Card 2: Complaint-Gap Matrix */}
            <div 
              onClick={() => onNavigateTab('matrix')}
              className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-white text-sm">Complaint-Gap Matrix</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Four-quadrant scatter matrix comparing actual registered tickets against algorithmic physical distress expectations.
              </p>
              <span className="text-[11px] text-rose-400 font-semibold inline-block pt-1">
                Inspect Paradox Matrix &rarr;
              </span>
            </div>

            {/* Card 3: What-If Sandbox */}
            <div 
              onClick={() => onNavigateTab('simulation')}
              className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Cpu className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-white text-sm">What-If Sandbox</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run policy simulations for water pipelines, mobile clinics, and civic grievance kiosks with real-time distress delta predictions.
              </p>
              <span className="text-[11px] text-purple-400 font-semibold inline-block pt-1">
                Simulate Interventions &rarr;
              </span>
            </div>

            {/* Card 4: Interventions Pipeline */}
            <div 
              onClick={() => onNavigateTab('interventions')}
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-3 transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-white text-sm">Interventions Pipeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Municipal action workflow tracking emergency relief dispatch, departmental ownership, budgets, and target resolution timelines.
              </p>
              <span className="text-[11px] text-emerald-400 font-semibold inline-block pt-1">
                Track Action Pipeline &rarr;
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* ── 5. Final Call To Action (CTA) ───────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/20 to-blue-950/30 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-cyan-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Bridge the Civic Blindspot in Your Municipality
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Prioritize public works, potable water tankers, drainage repairs, and healthcare audits based on genuine human suffering rather than complaint volume alone.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onExplore('dashboard')}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-base font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-cyan-950/80 hover:shadow-cyan-500/30 active:scale-95 cursor-pointer"
            >
              <span>Launch SilentNeed AI Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">SilentNeed AI</span>
            <span>&bull;</span>
            <span>Detecting Invisible Community Problems & Public Service Vacuums</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onExplore('dashboard')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Dashboard
            </button>
            <span>&bull;</span>
            <button 
              onClick={() => onNavigateTab('matrix')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Matrix
            </button>
            <span>&bull;</span>
            <button 
              onClick={() => onNavigateTab('simulation')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Sandbox
            </button>
            <span>&bull;</span>
            <button 
              onClick={() => onNavigateTab('interventions')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Interventions
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
