import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, ChevronDown, CheckCircle2, 
  Sparkles, KeyRound, LogOut, MapPin, X, Check
} from 'lucide-react';

export const DEMO_ROLES = [
  {
    id: 'municipal',
    roleTitle: 'Municipal Authority',
    displayName: 'Commissioner Aarav Sharma',
    shortTitle: 'Commissioner',
    badge: 'MUNICIPAL',
    department: 'Urban Local Body & Municipal Directorate',
    jurisdiction: 'City-Wide Jurisdiction (All Wards)',
    icon: 'building',
    portalTarget: 'interventions',
    portalDesc: 'Access City-Wide Resource Allocation, Tanker Dispatch, and Municipal Intervention Pipeline.',
    privileges: ['City-Wide Budget Approval', 'Emergency Resource Dispatch', 'Cross-Ward Interventions']
  },
  {
    id: 'ngo',
    roleTitle: 'NGO Field Auditor',
    displayName: 'Priya Nair',
    shortTitle: 'Priya Nair',
    badge: 'NGO AUDITOR',
    department: 'Janhit Ground Verification & Community Relief',
    jurisdiction: 'High-Distress Slums & Informal Settlements',
    icon: 'handshake',
    portalTarget: 'audit',
    portalDesc: 'Submit Verified Ground Audits, validate offline silence alarms, and map water point vacuums.',
    privileges: ['Ground Signal Verification', 'Offline Grievance Intake', 'Community Needs Audit']
  },
  {
    id: 'citizen',
    roleTitle: 'Community Resident / Citizen',
    displayName: 'Rajesh Kumar',
    shortTitle: 'Citizen Rajesh',
    badge: 'CITIZEN',
    department: 'Ward 14 Grassroots Community Committee',
    jurisdiction: 'Informal Settlement Block C & D (Ward 14)',
    icon: 'home',
    portalTarget: 'chatbot',
    portalDesc: 'Report local water scarcity, track community silence clock, and converse via Multilingual Civic AI.',
    privileges: ['Direct Distress Reporting', 'Community Silence Tracking', 'Voice-to-Text Civic Grievances']
  },
  {
    id: 'researcher',
    roleTitle: 'Academic / Impact Researcher',
    displayName: 'Dr. Sunita Rao',
    shortTitle: 'Dr. Sunita',
    badge: 'RESEARCHER',
    department: 'Center for Urban Climate & Vulnerability Studies',
    jurisdiction: 'Geospatial Sensor Grid & OpenStreetMap Corridors',
    icon: 'microscope',
    portalTarget: 'matrix',
    portalDesc: 'Analyze Complaint Gap Matrix, ML distress correlation, and cartographic physical amenity vacuums.',
    privileges: ['Complaint Gap Matrix Access', 'ML Feature Importance Weights', 'Raw Anomaly Export']
  }
];

export default function RoleSwitcherDropdown({
  currentRole,
  onRoleChange,
  theme = 'dark',
  onNavigateTab,
  onOpenAddAudit
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Custom login state
  const [customName, setCustomName] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [customJurisdiction, setCustomJurisdiction] = useState('');
  const [customBadge, setCustomBadge] = useState('CUSTOM');

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeRoleData = DEMO_ROLES.find(r => r.id === currentRole?.id) || currentRole || DEMO_ROLES[0];

  const handleSelectRole = (role) => {
    onRoleChange(role);
    setIsOpen(false);
    showToast(`Switched persona to ${role.roleTitle} (${role.displayName})`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  const handleOpenDomainPortal = () => {
    setIsOpen(false);
    setShowPortalModal(true);
  };

  const handleSignOut = () => {
    // Revert to citizen / guest
    onRoleChange(DEMO_ROLES[2]);
    setIsOpen(false);
    showToast('Signed out of administrative role. Viewing as Community Resident.');
  };

  const handleCustomSignInSubmit = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const customRoleObj = {
      id: 'custom-' + Date.now(),
      roleTitle: customDept.trim() || 'Custom Stakeholder',
      displayName: customName.trim(),
      shortTitle: customName.trim().split(' ')[0],
      badge: (customBadge.trim() || 'VERIFIED').toUpperCase(),
      department: customDept.trim() || 'Civic Administrative Department',
      jurisdiction: customJurisdiction.trim() || 'Special Assigned Jurisdiction',
      icon: 'building',
      portalTarget: 'dashboard',
      portalDesc: 'Custom civic domain credentials active.',
      privileges: ['Full Analytical Telemetry', 'Civic Signal Monitoring', 'Role-Based Operational Access']
    };

    onRoleChange(customRoleObj);
    setShowSignInModal(false);
    setIsOpen(false);
    showToast(`Welcome, ${customRoleObj.displayName}! Role profile updated.`);
  };

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'handshake':
        return <span className="text-sm select-none">🤝</span>;
      case 'home':
        return <span className="text-sm select-none">🏡</span>;
      case 'microscope':
        return <span className="text-sm select-none">🔬</span>;
      case 'building':
      default:
        return <span className="text-sm select-none">🏛</span>;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* ── Trigger Button ──────────────────────────────────────────────── */}
      <button
        id="role-switcher-btn"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-sm select-none ${
          isOpen
            ? 'border-cyan-500/80 bg-slate-900 ring-2 ring-cyan-500/20'
            : theme === 'light'
              ? 'bg-white border-slate-300 hover:border-slate-400 text-slate-800'
              : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500 text-white'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Active Persona: ${activeRoleData.displayName}`}
      >
        <span className="text-sm flex items-center justify-center shrink-0">
          {renderIcon(activeRoleData.icon)}
        </span>
        
        <span className={`text-xs font-bold whitespace-nowrap ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          {activeRoleData.shortTitle}
        </span>

        <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase whitespace-nowrap">
          {activeRoleData.badge}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
          isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
        }`} />
      </button>

      {/* ── Dropdown Menu ───────────────────────────────────────────────── */}
      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-80 sm:w-84 rounded-2xl shadow-2xl z-50 p-3.5 transition-all transform origin-top-right border ${
            theme === 'light'
              ? 'bg-white border-slate-200 shadow-slate-400/30 text-slate-900'
              : 'bg-slate-950/98 backdrop-blur-2xl border-slate-800 shadow-black/80 ring-1 ring-cyan-500/20 text-slate-100'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Top Profile Card */}
          <div className="flex items-start gap-3 p-1">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900/90 border-slate-700/80 text-cyan-400 shadow-inner'
            }`}>
              <span className="text-xl select-none">
                {renderIcon(activeRoleData.icon)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {activeRoleData.displayName}
              </h4>
              <p className={`text-[11px] truncate leading-tight mt-0.5 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {activeRoleData.department}
              </p>
              <p className="text-[11px] font-semibold text-cyan-400 truncate leading-tight mt-1 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span>{activeRoleData.jurisdiction}</span>
              </p>
            </div>
          </div>

          {/* Section Divider & Switch Role Header */}
          <div className="border-t border-slate-800/80 my-2.5 pt-2.5 flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
              SWITCH ROLE (QUICK DEMO)
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>

          {/* Role List */}
          <div className="space-y-1">
            {DEMO_ROLES.map((role) => {
              const isSelected = activeRoleData.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`w-full text-left rounded-xl p-2.5 flex items-center justify-between text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border border-cyan-500/50 text-cyan-300 font-bold shadow-sm shadow-cyan-950/40'
                      : theme === 'light'
                        ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base select-none shrink-0">
                      {renderIcon(role.icon)}
                    </span>
                    <span className="truncate">{role.roleTitle}</span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Domain Portal Dashboard Button */}
          <button
            onClick={handleOpenDomainPortal}
            className="w-full mt-2.5 py-2 px-3 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Domain Portal Dashboard</span>
          </button>

          {/* Footer Actions */}
          <div className="border-t border-slate-800/80 mt-2.5 pt-2.5 px-1 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowSignInModal(true);
              }}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-semibold transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In / Custom</span>
            </button>

            <button
              onClick={handleSignOut}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-semibold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Notification ──────────────────────────────────────────── */}
      {typeof document !== 'undefined' && toastMessage && createPortal(
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900/95 border border-cyan-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}

      {/* ── Domain Portal Dashboard Modal ───────────────────────────────── */}
      {typeof document !== 'undefined' && showPortalModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPortalModal(false);
          }}
        >
          <div className={`max-w-md w-full rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto relative ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20' : 'bg-slate-950 border-slate-800 text-white shadow-black/80'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <span className="text-xl">{renderIcon(activeRoleData.icon)}</span>
                </div>
                <div>
                  <h3 className={`text-base font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{activeRoleData.roleTitle}</h3>
                  <p className="text-xs text-cyan-400 font-semibold">{activeRoleData.badge} PORTAL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPortalModal(false)}
                className={`p-1 rounded-lg transition ${
                  theme === 'light' ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <div className="flex justify-between items-center">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Designated Official:</span>
                <strong className={theme === 'light' ? 'text-slate-900' : 'text-white'}>{activeRoleData.displayName}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Department / Org:</span>
                <strong className={`text-right max-w-[200px] truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{activeRoleData.department}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Jurisdiction:</span>
                <strong className="text-cyan-500 font-semibold text-right max-w-[200px] truncate">{activeRoleData.jurisdiction}</strong>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              {activeRoleData.portalDesc}
            </p>

            <div className="space-y-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Authorized Privileges
              </span>
              <div className="space-y-1">
                {activeRoleData.privileges?.map((priv, idx) => (
                  <div key={idx} className={`flex items-center gap-2 text-xs ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>{priv}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPortalModal(false);
                  if (activeRoleData.portalTarget === 'interventions' && onNavigateTab) {
                    onNavigateTab('interventions');
                  } else if (activeRoleData.portalTarget === 'matrix' && onNavigateTab) {
                    onNavigateTab('matrix');
                  } else if (activeRoleData.portalTarget === 'audit' && onOpenAddAudit) {
                    onOpenAddAudit();
                  } else if (onNavigateTab) {
                    onNavigateTab('dashboard');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition shadow-md shadow-cyan-950/50 cursor-pointer"
              >
                Launch {activeRoleData.roleTitle.split(' ')[0]} Workspace
              </button>
              <button
                type="button"
                onClick={() => setShowPortalModal(false)}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Sign In / Custom Role Modal ─────────────────────────────────── */}
      {typeof document !== 'undefined' && showSignInModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignInModal(false);
          }}
        >
          <form 
            onSubmit={handleCustomSignInSubmit}
            className={`max-w-md w-full rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto relative transition-all ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-slate-950 border-slate-800 text-white shadow-black/80'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Custom Stakeholder Login</h3>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Authenticate custom identity or field credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className={`p-1 rounded-lg transition ${
                  theme === 'light' ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer Vikram Sen"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 outline-none transition ${
                    theme === 'light' 
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20' 
                      : 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Department / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. State Disaster Management Authority"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 outline-none transition ${
                    theme === 'light' 
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20' 
                      : 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Operational Jurisdiction</label>
                <input
                  type="text"
                  placeholder="e.g. Zone 4 South - Wards 19 to 24"
                  value={customJurisdiction}
                  onChange={(e) => setCustomJurisdiction(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 outline-none transition ${
                    theme === 'light' 
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20' 
                      : 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. INSPECTOR, DISASTER-LEAD, AUDITOR"
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 outline-none uppercase transition ${
                    theme === 'light' 
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20' 
                      : 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition shadow-md shadow-cyan-950/50 cursor-pointer"
              >
                Save & Sign In
              </button>
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
