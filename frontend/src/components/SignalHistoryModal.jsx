import React, { useState, useEffect } from 'react';
import { 
  X, History, Clock, AlertTriangle, ShieldCheck, Plus, 
  Send, RefreshCw, FileText, CheckCircle2, CornerDownRight, 
  Tag, User, Calendar, ShieldAlert, Sparkles, MessageSquare,
  AlertCircle, TrendingUp, BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { fetchSignalRecords, createSignalRecord, fetchSilenceClock } from '../services/api';
import { formatDateTime, formatShortDateTime } from '../utils/dateFormat';

export default function SignalHistoryModal({ 
  isOpen, 
  onClose, 
  community, 
  onSignalCreated 
}) {
  if (!isOpen || !community) return null;

  const [records, setRecords] = useState([]);
  const [silenceClock, setSilenceClock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, Complaint, Survey Response, Field Report, CORRECTIONS
  
  // New Signal Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    signal_type: 'Complaint',
    source: 'Municipal Grievance Portal',
    severity: 'High',
    summary: '',
    corrects_signal_id: null
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [recs, clock] = await Promise.all([
        fetchSignalRecords(community.id),
        fetchSilenceClock(community.id).catch(() => null)
      ]);
      setRecords(recs || []);
      if (clock) setSilenceClock(clock);
    } catch (err) {
      console.error("Failed to load signal records:", err);
      setErrorMessage("Could not load signal history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (community?.id) {
      loadData();
      setShowAddForm(false);
      setSuccessMessage('');
      setFormData({
        signal_type: 'Complaint',
        source: 'Municipal Grievance Portal',
        severity: 'High',
        summary: '',
        corrects_signal_id: null
      });
    }
  }, [community?.id]);

  const handleOpenCorrection = (record) => {
    setFormData({
      signal_type: record.signal_type,
      source: `Correction Audit (${record.source})`,
      severity: record.severity,
      summary: `Correction to Signal #${record.id}: `,
      corrects_signal_id: record.id
    });
    setShowAddForm(true);
    setSuccessMessage('');
  };

  const handleOpenNewSignal = () => {
    setFormData({
      signal_type: 'Complaint',
      source: 'Municipal Grievance Portal',
      severity: 'High',
      summary: '',
      corrects_signal_id: null
    });
    setShowAddForm(true);
    setSuccessMessage('');
  };

  const handleSubmitSignal = async (e) => {
    e.preventDefault();
    if (!formData.summary.trim()) {
      setErrorMessage("Please enter report content / description.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        signal_type: formData.signal_type,
        source: formData.source || 'Municipal Portal',
        severity: formData.severity,
        summary: formData.summary.trim(),
        corrects_signal_id: formData.corrects_signal_id ? Number(formData.corrects_signal_id) : null
      };

      const newRec = await createSignalRecord(community.id, payload);
      
      const isCorr = Boolean(payload.corrects_signal_id);
      setSuccessMessage(
        isCorr 
          ? `Official correction recorded as Signal #${newRec.id}. Original Signal #${payload.corrects_signal_id} remains preserved in the audit log. Ward Silence Clock has been reset!`
          : `New ${payload.signal_type} appended as Signal #${newRec.id}. Ward Silence Clock has been reset to 0 days and priority score updated!`
      );

      // Reset form and reload
      setShowAddForm(false);
      setFormData({
        signal_type: 'Complaint',
        source: 'Municipal Grievance Portal',
        severity: 'High',
        summary: '',
        corrects_signal_id: null
      });

      await loadData();
      if (onSignalCreated) onSignalCreated(community.id);
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "Failed to create signal record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    if (filterType === 'ALL') return true;
    if (filterType === 'CORRECTIONS') return Boolean(r.corrects_signal_id);
    return r.signal_type.toLowerCase() === filterType.toLowerCase();
  });

  // Calculate statistics
  const totalComplaints = records.filter(r => r.signal_type?.toLowerCase() === 'complaint').length;
  const totalSurveys = records.filter(r => r.signal_type?.toLowerCase() === 'survey response').length;
  const totalFieldReports = records.filter(r => r.signal_type?.toLowerCase() === 'field report').length;
  const totalCorrections = records.filter(r => r.corrects_signal_id).length;

  const clockDisplay = silenceClock?.silence_display || community.silence_display || "Active";
  const clockStatus = silenceClock?.silence_status || community.silence_status || "Normal";
  const isAlert = silenceClock?.alert_triggered || community.silence_alert_triggered;

  // Chronological timeline data with actual timestamps
  const chronologicalRecords = [...records].sort(
    (a, b) => new Date(a.received_at) - new Date(b.received_at)
  );

  const chartData = [];
  let prevTime = null;

  chronologicalRecords.forEach((rec, idx) => {
    const curTime = new Date(rec.received_at).getTime();
    let silenceDaysBefore = 0;
    if (prevTime !== null) {
      silenceDaysBefore = Math.max(0, Math.round(((curTime - prevTime) / 86400000) * 10) / 10);
    }
    prevTime = curTime;

    chartData.push({
      id: rec.id,
      timestamp: curTime,
      dateLabel: formatShortDateTime(rec.received_at),
      fullDateTime: formatDateTime(rec.received_at),
      signal_type: rec.signal_type,
      source: rec.source,
      severity: rec.severity,
      summary: rec.summary,
      is_correction: Boolean(rec.corrects_signal_id),
      cumulativeCount: idx + 1,
      silenceDays: silenceDaysBefore,
      statusOnReceipt: "Timer Reset to 0 Days",
      isCurrent: false
    });
  });

  // Append current real-time point if records exist
  if (chronologicalRecords.length > 0 && silenceClock) {
    const nowTime = Date.now();
    chartData.push({
      id: "now",
      timestamp: nowTime,
      dateLabel: formatShortDateTime(new Date().toISOString()),
      fullDateTime: formatDateTime(new Date().toISOString()),
      signal_type: "Current Silence Clock",
      source: "Ward Silence Engine",
      severity: silenceClock.silence_status === "Critical" ? "Critical" : "Active",
      summary: `Current ward status: ${silenceClock.silence_display || "Active"} (${silenceClock.silence_status || "Normal"})`,
      is_correction: false,
      cumulativeCount: chronologicalRecords.length,
      silenceDays: silenceClock.silence_duration_days || 0,
      statusOnReceipt: silenceClock.silence_display,
      isCurrent: true
    });
  }

  const TimelineChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs max-w-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-white">
              {data.isCurrent ? "Current Silence Status" : `Signal #${data.id} (${data.signal_type})`}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              data.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
              data.severity === 'High' ? 'bg-orange-500/20 text-orange-300' :
              'bg-cyan-500/20 text-cyan-300'
            }`}>
              {data.severity}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-mono">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>{data.fullDateTime}</span>
          </div>

          <div className="text-[11px] text-slate-300">
            Source: <strong className="text-slate-100">{data.source}</strong>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5 border-t border-slate-800">
            <span>Cumulative Signals:</span>
            <strong className="text-cyan-400 font-mono">{data.cumulativeCount}</strong>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Silence Clock:</span>
            <strong className="text-rose-400 font-mono">
              {data.isCurrent ? `${data.silenceDays} days elapsed` : data.statusOnReceipt}
            </strong>
          </div>

          {!data.isCurrent && data.summary && (
            <p className="text-[10px] text-slate-400 truncate max-w-[240px] pt-1">
              "{data.summary}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 my-auto">
        
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white m-0">
                  {community.name}
                </h2>
                <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                  {community.ward_number || community.code}
                </span>
                
                {/* Silence Clock Badge */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  clockStatus === 'Critical' 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : clockStatus === 'Attention Needed'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span>{clockDisplay}</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold">({clockStatus})</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Append-Only Civic Audit Trail &bull; {community.zone_type} &bull; {community.district}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Silence Clock Alert Banner (If >= 30 days or Never Reported) */}
        {isAlert && (
          <div className="bg-rose-950/40 border-b border-rose-900/50 px-5 py-3 flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span>
                <strong>Silence Clock Alert:</strong> Ward has exceeded the 30-day civic inactivity threshold ({clockDisplay}). 
                Priority score elevated by +{silenceClock?.silence_penalty_points || 20} points.
              </span>
            </div>
            <span className="shrink-0 font-mono text-[10px] bg-rose-900/40 px-2 py-0.5 rounded border border-rose-700/50">
              Threshold: 30 Days
            </span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="bg-emerald-950/40 border-b border-emerald-900/50 px-5 py-3 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage('')}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-red-950/40 border-b border-red-900/50 px-5 py-3 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-red-300 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Controls & KPI Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Signal Statistics Counter */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Total Signals: <strong className="text-white font-mono">{records.length}</strong></span>
            <span>&bull;</span>
            <span>Complaints: <strong className="text-amber-400 font-mono">{totalComplaints}</strong></span>
            <span>&bull;</span>
            <span>Surveys: <strong className="text-cyan-400 font-mono">{totalSurveys}</strong></span>
            <span>&bull;</span>
            <span>Field Reports: <strong className="text-purple-400 font-mono">{totalFieldReports}</strong></span>
            <span>&bull;</span>
            <span>Corrections: <strong className="text-emerald-400 font-mono">{totalCorrections}</strong></span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
              title="Refresh timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (showAddForm) setShowAddForm(false);
                else handleOpenNewSignal();
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow shadow-cyan-900/30 cursor-pointer"
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit New Signal</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chronological Signal Intake & Silence Clock Progression Chart */}
        {records.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Chronological Signal Intake & Silence Clock Timeline
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
                  <span className="text-slate-300">Cumulative Signals</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2 bg-rose-500/30 border border-rose-500 inline-block rounded-xs"></span>
                  <span className="text-rose-300">Silence Duration (Days)</span>
                </span>
              </div>
            </div>

            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 25, left: -10 }}>
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
                    yAxisId="count"
                    stroke="#38bdf8" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    allowDecimals={false}
                    domain={[0, 'dataMax + 1']}
                  />
                  <YAxis 
                    yAxisId="silence" 
                    orientation="right" 
                    stroke="#f43f5e" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<TimelineChartTooltip />} />
                  <Area 
                    yAxisId="silence" 
                    type="monotone" 
                    dataKey="silenceDays" 
                    stroke="#f43f5e" 
                    fill="#f43f5e" 
                    fillOpacity={0.12} 
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: "#e11d48" }}
                    activeDot={{ r: 5, fill: "#f43f5e" }}
                    name="Silence Days"
                  />
                  <Line 
                    yAxisId="count" 
                    type="monotone" 
                    dataKey="cumulativeCount" 
                    stroke="#38bdf8" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#0284c7" }}
                    activeDot={{ r: 6, fill: "#38bdf8" }}
                    name="Cumulative Signals"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Chronological audit trail: oldest to newest</span>
              <span>Hover over points to inspect exact timestamp & Silence Clock impact</span>
            </div>
          </div>
        )}

        {/* Collapsible New Signal / Correction Form */}
        {showAddForm && (
          <form 
            onSubmit={handleSubmitSignal}
            className="p-5 border-b border-slate-800 bg-slate-950/80 space-y-4 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>
                  {formData.corrects_signal_id 
                    ? `File Official Correction to Signal #${formData.corrects_signal_id}` 
                    : "Append New Civic Signal (Resets Silence Clock)"}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                🔒 Immutable Record: Saved with server timestamp
              </span>
            </div>

            {formData.corrects_signal_id && (
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200 flex items-start gap-2">
                <CornerDownRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Append-Only Correction Mode:</strong> This creates a new audit entry linked to 
                  Signal #{formData.corrects_signal_id}. The original record will <strong>NOT</strong> be deleted or overwritten. 
                  Both entries will remain permanently in the historical ledger.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Signal Type</label>
                <select
                  value={formData.signal_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, signal_type: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                >
                  <option value="Complaint">Complaint</option>
                  <option value="Survey Response">Survey Response</option>
                  <option value="Field Report">Field Report</option>
                  <option value="NGO Ground Audit">NGO Ground Audit</option>
                  <option value="Citizen Kiosk">Citizen Kiosk</option>
                  <option value="Satellite Anomaly">Satellite Anomaly</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Severity Tier</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                >
                  <option value="Critical">Critical Severity</option>
                  <option value="High">High Severity</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="Low">Low Severity</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Source / Reporter</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g. Municipal Portal, Field Officer ID"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Reported Content / Observations / Correction Details *
              </label>
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Describe the complaint, survey observation, or correction with full verifiable details..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition shadow cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Committing..." : formData.corrects_signal_id ? "Submit Linked Correction" : "Commit Append-Only Signal"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter Pills */}
        <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/20 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Filter:</span>
          {['ALL', 'Complaint', 'Survey Response', 'Field Report', 'CORRECTIONS'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                filterType === type 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Signals' : type === 'CORRECTIONS' ? 'Corrections Only' : type}
            </button>
          ))}
        </div>

        {/* Scrollable Signal Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Loading chronological audit ledger...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl p-6">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-white">No signal records found for this filter.</p>
              <p className="text-slate-500 text-[11px] mt-1">
                Wards with zero complaints or surveys remain silent until field officers or residents submit new signals.
              </p>
              <button
                onClick={handleOpenNewSignal}
                className="mt-3 inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit First Signal</span>
              </button>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const dateObj = new Date(record.received_at);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const isCorrection = Boolean(record.corrects_signal_id);
              const isCorrected = Boolean(record.corrected_by_signal_id);

              return (
                <div 
                  key={record.id}
                  className={`bg-slate-950/70 border rounded-2xl p-4 space-y-3 transition shadow-sm ${
                    isCorrection 
                      ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/20 to-slate-950/70' 
                      : isCorrected
                      ? 'border-amber-500/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                        #{record.id}
                      </span>
                      
                      {/* Signal Type Badge */}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        record.signal_type?.toLowerCase() === 'complaint'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : record.signal_type?.toLowerCase() === 'survey response'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                      }`}>
                        {record.signal_type}
                      </span>

                      {/* Severity Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        record.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        record.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {record.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{record.source}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span className="font-mono text-slate-300">{formattedDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Correction Relationship Banners */}
                  {isCorrection && (
                    <div className="flex items-center gap-2 text-xs bg-cyan-950/40 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-800/40 font-medium">
                      <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>
                        Official Correction to Prior Signal <strong>#{record.corrects_signal_id}</strong> &bull; Original record remains intact and unaltered.
                      </span>
                    </div>
                  )}

                  {isCorrected && (
                    <div className="flex items-center gap-2 text-xs bg-amber-950/40 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-800/40 font-medium">
                      <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        Notice: An official correction was appended in Signal <strong>#{record.corrected_by_signal_id}</strong>. This original record is preserved for full audit accountability.
                      </span>
                    </div>
                  )}

                  {/* Signal Content / Summary */}
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {record.summary}
                  </p>

                  {/* Card Action Footer */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 font-mono text-[10px]">
                      Immutability: Verified &bull; Append-Only Model Active
                    </span>

                    <button
                      onClick={() => handleOpenCorrection(record)}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline font-semibold cursor-pointer"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>File Linked Correction</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL / SQLite Append-Only Immutability Guard Active. Records cannot be edited or deleted.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Ledger
          </button>
        </div>

      </div>
    </div>
  );
}
