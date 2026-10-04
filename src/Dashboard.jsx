import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, Search, Bell, FileText, Check, LogOut, XCircle, HelpCircle, X, ShieldCheck, Eye } from 'lucide-react';
import { api } from './api';

const slaColor = (state) => {
  if (state === 'red') return 'text-red-600 bg-red-50 border-red-200';
  if (state === 'yellow') return 'text-amber-600 bg-amber-50 border-amber-200';
  if (state === 'done') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
};

const statusBadge = (status) => {
  if (status === 'APPROVED') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'REJECTED') return 'text-red-700 bg-red-50 border-red-200';
  if (status === 'QUERY_RAISED') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-blue-700 bg-blue-50 border-blue-200';
};

export default function OfficerDashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Documents popup
  const [docView, setDocView] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

  const load = async () => {
    try {
      const [a, s] = await Promise.all([
        api('/officer/applications'),
        api('/officer/dashboard'),
      ]);
      setApplications(a.applications);
      setStats(s);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id, action) => {
    let remarks = '';
    if (action === 'reject' || action === 'query') {
      remarks = window.prompt(
        action === 'reject' ? 'Reason for rejection:' : 'Query for the applicant:'
      );
      if (remarks === null) return;
    }
    setBusyId(id);
    try {
      await api(`/officer/applications/${id}/${action}`, {
        method: 'POST',
        body: { remarks },
      });
      await load();
      setDocView(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const openDocuments = async (app) => {
    setDocView({ app, required: [], documents: [] });
    setDocLoading(true);
    setDocError('');
    try {
      const data = await api(`/officer/applications/${app.id}/documents`);
      setDocView({ app: data.application, required: data.required, documents: data.documents });
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDocLoading(false);
    }
  };

  // File token ke saath mangate hain aur naye tab mein kholte hain
  const openFile = async (docId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/officer/documents/${docId}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.detail === 'string' ? data.detail : `Could not open file (status ${res.status})`);
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const isOpen = (s) => s === 'SUBMITTED' || s === 'UNDER_REVIEW' || s === 'QUERY_RAISED';

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2 rounded-lg text-white">
                <Shield className="size-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Avyra &middot; Govt. Officer Portal</h1>
                <p className="text-xs text-slate-400 font-medium">{stats?.department || 'Department of Industries & Commerce'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-white transition"><Search className="size-5" /></button>
              <button className="relative text-slate-400 hover:text-white transition">
                <Bell className="size-5" />
                <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border border-slate-900"></span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-1.5 ml-4 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition">
                <LogOut className="size-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-sm font-semibold text-slate-500">New Applications</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.new_applications ?? 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
            <p className="text-sm font-semibold text-slate-500">SLA Nearing Expiry</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.sla_nearing ?? 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
            <p className="text-sm font-semibold text-slate-500">SLA Breached</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.sla_breached ?? 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-sm font-semibold text-slate-500">Approved</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.approved ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Inter-Departmental Application Queue (SLA Time-Bomb Node)</h3>
          </div>

          {loading && <p className="p-6 text-sm text-slate-500">Loading applications...</p>}
          {error && <p className="p-6 text-sm text-red-600">{error}</p>}
          {!loading && !error && applications.length === 0 && (
            <p className="p-6 text-sm text-slate-500">
              No submitted applications yet. Submit one from an Entrepreneur account.
            </p>
          )}

          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div key={app.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between hover:bg-slate-50 transition gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100"><FileText className="size-6 text-blue-600" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {app.business_name} <span className="text-xs font-normal text-slate-500 ml-2">ID: {app.ref}</span>
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{app.approval_name}</p>
                    {app.remarks && <p className="text-xs italic text-slate-500 mt-1">Remarks: {app.remarks}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded border ${statusBadge(app.status)}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${slaColor(app.sla_state)}`}>
                        {app.sla_state === 'done' ? <Check className="size-3" /> : <Clock className="size-3" />} SLA: {app.sla_label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openDocuments(app)}
                    className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <Eye className="size-4" /> View Documents
                  </button>
                  {isOpen(app.status) ? (
                    <>
                      <button
                        onClick={() => decide(app.id, 'query')}
                        disabled={busyId === app.id}
                        className="px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <HelpCircle className="size-4" /> Raise Query
                      </button>
                      <button
                        onClick={() => decide(app.id, 'reject')}
                        disabled={busyId === app.id}
                        className="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <XCircle className="size-4" /> Reject
                      </button>
                      <button
                        onClick={() => decide(app.id, 'approve')}
                        disabled={busyId === app.id}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-2 disabled:opacity-60"
                      >
                        <CheckCircle className="size-4" /> Approve
                      </button>
                    </>
                  ) : (
                    <span className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-lg border ${statusBadge(app.status)}`}>
                      {app.status === 'APPROVED' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                      {app.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Documents popup */}
      {docView && (
        <div className="fixed inset-0 z-[90] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setDocView(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Submitted Documents</h3>
                <p className="text-sm text-slate-600">
                  {docView.app.business_name} &bull; {docView.app.approval_name} &bull; {docView.app.ref}
                </p>
              </div>
              <button onClick={() => setDocView(null)} className="text-slate-500 hover:text-slate-900">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {docLoading && <p className="text-sm text-slate-500">Loading documents...</p>}
              {docError && <p className="text-sm text-red-600">{docError}</p>}

              {!docLoading && !docError && (
                <>
                  <p className={`text-xs font-bold px-3 py-2 rounded-lg border ${
                    docView.documents.length >= docView.required.length
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    Completeness: {docView.documents.length} of {docView.required.length} required documents received
                  </p>

                  {docView.required.map((name) => {
                    const d = docView.documents.find((x) => x.doc_name === name);
                    return (
                      <div
                        key={name}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${d ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {d ? <ShieldCheck className="size-5 text-emerald-600 shrink-0" /> : <XCircle className="size-5 text-red-500 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {d ? d.filename : 'Missing: not uploaded by applicant'}
                            </p>
                          </div>
                        </div>
                        {d && (
                          <button
                            onClick={() => openFile(d.id)}
                            className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition"
                          >
                            Open file
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isOpen(docView.app.status) && (
                    <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                      <button onClick={() => decide(docView.app.id, 'query')} className="px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition">
                        Raise Query
                      </button>
                      <button onClick={() => decide(docView.app.id, 'reject')} className="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
                        Reject
                      </button>
                      <button onClick={() => decide(docView.app.id, 'approve')} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                        Approve
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}