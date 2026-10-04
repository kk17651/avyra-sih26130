import React, { useState, useEffect, useRef } from 'react';
import { Building2, CheckCircle2, Clock, UploadCloud, Bell, Search, ShieldCheck, Activity, LogOut, Cpu, FileText } from 'lucide-react';
import { getIndustryChecklist } from './approvalEngine';
import { api } from './api';
import TrackingModule from './TrackingModule';

export default function Dashboard() {
  const [profile, setProfile] = useState({
    businessName: 'Your Business',
    industry: 'Manufacturing & Chemical',
    location: 'Industrial Zone, Phase-2',
    projectSize: 'Medium Scale (5-20 Acres)',
    stage: 'Pre-Establishment'
  });

  const [checklist, setChecklist] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState('');
  const [applications, setApplications] = useState([]);
  const [submittingId, setSubmittingId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Upload state
  const [docsByApp, setDocsByApp] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const pendingDocRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('businessProfile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }

    api('/approvals/discover', { method: 'POST' })
      .then((data) => {
        const generated = data.approvals.map((a) => ({
          id: a.code,
          name: a.name,
          dept: a.department,
          sla: `${a.sla_days} Days`,
          why: a.why_needed,
          documents: a.documents,
        }));
        setChecklist(generated);
        setSelectedApproval(generated[0]?.name || '');
      })
      .catch((err) => {
        console.error('Approval discovery failed:', err.message);
        const fallback = getIndustryChecklist(
          saved ? JSON.parse(saved).industry : 'Manufacturing & Chemical'
        );
        setChecklist(fallback);
        setSelectedApproval(fallback[0]?.name || '');
      });
  }, []);

  const loadApplications = async () => {
    try {
      const data = await api('/applications/generate', { method: 'POST' });
      setApplications(data.applications);
      return data.applications;
    } catch (err) {
      console.error('Could not load applications:', err.message);
      return [];
    }
  };

  const loadDocuments = async (appId) => {
    try {
      const data = await api(`/applications/${appId}/documents`);
      setDocsByApp((prev) => ({ ...prev, [appId]: data }));
    } catch (err) {
      console.error('Could not load documents:', err.message);
    }
  };

  useEffect(() => {
    loadApplications().then((apps) => apps.forEach((a) => loadDocuments(a.id)));
  }, []);

  const handleSubmitApplication = async (appId) => {
    setSubmittingId(appId);
    try {
      await api(`/applications/${appId}/submit`, { method: 'POST' });
      await loadApplications();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const statusStyle = (status) => {
    if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'REJECTED') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'QUERY_RAISED') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'DRAFT') return 'bg-slate-50 text-slate-600 border-slate-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const selectedApp = applications.find((a) => a.approval_name === selectedApproval);
  const selectedDocs = selectedApp ? docsByApp[selectedApp.id] : null;

  const chooseFile = (docName) => {
    pendingDocRef.current = docName;
    setUploadError('');
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const docName = pendingDocRef.current;
    if (!file || !docName || !selectedApp) return;

    setUploadingDoc(docName);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('doc_name', docName);
      form.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/applications/${selectedApp.id}/documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : `Upload failed (status ${res.status})`);
      }
      await loadDocuments(selectedApp.id);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const initials = (localStorage.getItem('userName') || profile.businessName || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4faf6] font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChosen}
      />

      <nav className="bg-white border-b border-emerald-900/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-800 p-2 rounded-lg text-white">
                <Building2 className="size-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-emerald-950 leading-tight">Avyra &middot; Smart Portal</h1>
                <p className="text-xs text-emerald-900/60 font-medium">SIH26130 &middot; {profile.businessName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-emerald-900/60 hover:text-emerald-950 transition"><Search className="size-5" /></button>
              <button className="relative text-emerald-900/60 hover:text-emerald-950 transition">
                <Bell className="size-5" />
                <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <div className="h-9 w-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold ml-2">
                {initials}
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition">
                <LogOut className="size-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8 border-b border-emerald-900/10 pb-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${activeTab === 'dashboard' ? 'bg-emerald-800 text-white shadow-emerald-900/10' : 'bg-white text-emerald-900/70 border border-emerald-900/10 hover:bg-emerald-50'}`}
          >
            AI Approval Checklist & OCR
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm ${activeTab === 'tracking' ? 'bg-emerald-800 text-white shadow-emerald-900/10' : 'bg-white text-emerald-900/70 border border-emerald-900/10 hover:bg-emerald-50'}`}
          >
            <Clock className="size-4" /> Live Tracking & Bottlenecks Monitor
          </button>
        </div>

        {activeTab === 'tracking' ? (
          <TrackingModule />
        ) : (
          <>
            <div className="bg-emerald-900 text-white rounded-2xl p-6 md:p-8 mb-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-800 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-700 flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-emerald-300" /> AI Approval Discovery Engine Active
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome, {profile.businessName}</h2>
                <p className="text-emerald-200/90 text-sm mt-1">
                  Sector: <strong className="text-white">{profile.industry}</strong> &bull; Location: <strong className="text-white">{profile.location}</strong>
                </p>
              </div>
              <div className="bg-emerald-800/80 border border-emerald-700/60 p-4 rounded-xl text-right shrink-0">
                <p className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">Total Mandatory Approvals</p>
                <p className="text-2xl font-black text-white">{checklist.length} Clearances Required</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Upload card */}
                <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-semibold text-emerald-950 flex items-center gap-2">
                      <Activity className="size-5 text-emerald-600" />
                      Document Upload & AI Validation
                    </h3>
                    <div className="text-xs font-medium bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
                      Target: <strong className="text-emerald-950">{selectedApproval}</strong>
                    </div>
                  </div>

                  {!selectedApp && (
                    <p className="text-sm text-emerald-900/60">Select an approval from the checklist below.</p>
                  )}

                  {selectedApp && !selectedDocs && (
                    <p className="text-sm text-emerald-900/60">Loading documents...</p>
                  )}

                  {selectedApp && selectedDocs && (
                    <div className="space-y-2">
                      {selectedDocs.required.map((docName) => {
                        const uploaded = selectedDocs.documents.find((d) => d.doc_name === docName);
                        const busy = uploadingDoc === docName;
                        return (
                          <div
                            key={docName}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${uploaded ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {uploaded ? (
                                <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
                              ) : (
                                <FileText className="size-5 text-slate-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-emerald-950">{docName}</p>
                                <p className="text-xs text-slate-500 truncate">
                                  {uploaded ? `Uploaded: ${uploaded.filename}` : 'Not uploaded yet'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => chooseFile(docName)}
                              disabled={busy || selectedApp.status !== 'DRAFT'}
                              className="shrink-0 flex items-center gap-1.5 bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-900 transition disabled:opacity-50"
                            >
                              <UploadCloud className="size-3.5" />
                              {busy ? 'Uploading...' : uploaded ? 'Replace' : 'Upload'}
                            </button>
                          </div>
                        );
                      })}
                      <p className="text-xs text-emerald-900/60 pt-1">
                        {selectedDocs.documents.length} of {selectedDocs.required.length} documents uploaded. PDF, JPG, PNG or WEBP, max 5 MB.
                      </p>
                      {selectedApp.status !== 'DRAFT' && (
                        <p className="text-xs text-amber-700">This application is already submitted, so uploads are locked.</p>
                      )}
                    </div>
                  )}

                  {uploadError && (
                    <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {uploadError}
                    </p>
                  )}
                </div>

                {/* Checklist */}
                <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-emerald-900/10 flex justify-between items-center bg-emerald-50/30">
                    <h3 className="text-lg font-semibold text-emerald-950">Personalized Checklist & Live Tracker</h3>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                      {profile.industry}
                    </span>
                  </div>
                  <div className="divide-y divide-emerald-900/5">
                    {checklist.map((item, idx) => {
                      const app = applications.find((a) => a.approval_name === item.name);
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedApproval(item.name)}
                          className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between transition cursor-pointer gap-3 ${selectedApproval === item.name ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' : 'hover:bg-emerald-50/40'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-800 font-bold text-sm">
                              {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-950">{item.name}</p>
                              <p className="text-xs text-emerald-900/60">{item.dept} &bull; SLA: <span className="font-semibold text-emerald-800">{item.sla}</span></p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {app && (
                              <>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusStyle(app.status)}`}>
                                  {app.ref} &bull; {app.status.replace('_', ' ')}
                                </span>
                                {app.status === 'DRAFT' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubmitApplication(app.id);
                                    }}
                                    disabled={submittingId === app.id}
                                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition disabled:opacity-60"
                                  >
                                    {submittingId === app.id ? 'Submitting...' : 'Submit'}
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('tracking');
                              }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            >
                              <Clock className="size-3.5 text-emerald-600" /> View in Tracker
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm p-6">
                  <h3 className="text-base font-bold text-emerald-950 mb-3">AI Workflow Summary</h3>
                  <ul className="space-y-3 text-xs text-emerald-900/80 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Profile Locked:</strong> Business data securely saved.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Dynamic Discovery:</strong> Filtered {checklist.length} mandatory clearances for {profile.industry}.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Bottleneck Tracking:</strong> Switch to the tracking tab to monitor delays.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}