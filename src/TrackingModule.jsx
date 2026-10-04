import React, { useState, useEffect } from 'react';
import { Search, Filter, Activity } from 'lucide-react';
import { api } from './api';

// Backend UTC time bhejta hai bina 'Z' ke, isliye khud lagate hain
const toDate = (iso) => (iso ? new Date(iso.endsWith('Z') ? iso : iso + 'Z') : null);

function describe(app) {
  const due = toDate(app.sla_due_at);
  const hoursLeft = due ? (due.getTime() - Date.now()) / 36e5 : null;

  const finished = app.status === 'APPROVED' || app.status === 'REJECTED';
  let sla = 'Not started';
  let slaState = 'none';
  if (finished) {
    sla = 'Completed';
    slaState = 'done';
  } else if (hoursLeft !== null) {
    if (hoursLeft < 0) {
      sla = `Breached ${Math.abs(Math.floor(hoursLeft))}h ago`;
      slaState = 'red';
    } else if (hoursLeft < 24) {
      sla = `${Math.floor(hoursLeft)}h left`;
      slaState = 'yellow';
    } else {
      sla = `${Math.floor(hoursLeft / 24)} days left`;
      slaState = 'green';
    }
  }

  const map = {
    DRAFT: { stage: 'Document Preparation', pending: 'You (applicant)', label: 'Draft' },
    SUBMITTED: { stage: 'Awaiting Officer Review', pending: `${app.department} Officer`, label: 'Submitted' },
    UNDER_REVIEW: { stage: 'Officer Verification', pending: `${app.department} Officer`, label: 'Under Review' },
    QUERY_RAISED: { stage: 'Query Raised', pending: 'You (respond to officer)', label: 'Query Raised' },
    APPROVED: { stage: 'Approval Issued', pending: 'None (issued)', label: 'Approved' },
    REJECTED: { stage: 'Rejected', pending: 'None', label: 'Rejected' },
  };
  const m = map[app.status] || map.SUBMITTED;

  let color = 'bg-amber-50 text-amber-700 border-amber-200';
  if (app.status === 'APPROVED') color = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (app.status === 'REJECTED') color = 'bg-red-50 text-red-700 border-red-200';
  else if (app.status === 'DRAFT') color = 'bg-slate-50 text-slate-600 border-slate-200';
  else if (slaState === 'red') color = 'bg-red-50 text-red-700 border-red-200';
  else if (slaState === 'green') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const statusText = slaState === 'red' && !finished ? 'Delayed / Bottleneck' : m.label;
  return { ...m, sla, slaState, color, statusText };
}

export default function TrackingModule() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  useEffect(() => {
    const load = () =>
      api('/applications')
        .then((d) => {
          setApps(d.applications);
          setError('');
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    load();
    const t = setInterval(load, 15000); // har 15 second mein refresh
    return () => clearInterval(t);
  }, []);

  const rows = apps.map((a) => ({ ...a, info: describe(a) }));
  const departments = [...new Set(apps.map((a) => a.department))];

  const filtered = rows.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = a.approval_name.toLowerCase().includes(q) || a.ref.toLowerCase().includes(q);
    const matchesFilter = filterDept === 'All' || a.department === filterDept;
    return matchesSearch && matchesFilter;
  });

  const active = rows.filter((a) => a.status !== 'DRAFT');
  const delayed = rows.filter((a) => a.info.slaState === 'red' && a.status !== 'APPROVED' && a.status !== 'REJECTED');
  const inProgress = rows.filter((a) => ['SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED'].includes(a.status));
  const approved = rows.filter((a) => a.status === 'APPROVED');
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Submitted Files</p>
          <h3 className="text-2xl font-black text-emerald-950 mt-1">{pad(active.length)} Applications</h3>
          <p className="text-xs text-emerald-700 mt-2 font-medium">{rows.length} total, {rows.length - active.length} still in draft</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Bottlenecks / Delayed</p>
          <h3 className="text-2xl font-black text-red-600 mt-1">{pad(delayed.length)} Files Stalled</h3>
          <p className="text-xs text-red-600/80 mt-2 font-medium">SLA deadline crossed</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">In Progress / Review</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{pad(inProgress.length)} Files</h3>
          <p className="text-xs text-amber-700 mt-2 font-medium">Moving through the workflow</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Successfully Approved</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{pad(approved.length)} Clearances</h3>
          <p className="text-xs text-emerald-700 mt-2 font-medium">Ready for operational use</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-900/40" />
          <input
            type="text"
            placeholder="Search by clearance name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-emerald-900/15 text-sm bg-[#f4faf6]/50 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="size-4 text-emerald-900/50" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full sm:w-64 h-10 px-3 rounded-xl border border-emerald-900/15 text-sm bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none font-medium text-emerald-950"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-900/10 bg-emerald-50/40 flex justify-between items-center">
          <h3 className="font-bold text-emerald-950 text-base flex items-center gap-2">
            <Activity className="size-5 text-emerald-700" /> Live Application Tracking & Delay Monitor
          </h3>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Auto-refresh every 15s
          </span>
        </div>

        {loading && <p className="p-6 text-sm text-slate-500">Loading applications...</p>}
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="p-6 text-sm text-slate-500">No applications found.</p>
        )}

        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-900/10 bg-slate-50 text-xs font-bold text-emerald-900/70 uppercase tracking-wider">
                  <th className="py-3 px-6">Clearance & ID</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Current Stage</th>
                  <th className="py-3 px-6">Pending With</th>
                  <th className="py-3 px-6">SLA Status</th>
                  <th className="py-3 px-6">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/5 text-sm">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-emerald-950">{app.approval_name}</p>
                      <p className="text-xs text-emerald-900/50 font-mono mt-0.5">
                        {app.ref} &bull; {app.submitted_at ? `Submitted: ${app.submitted_at.slice(0, 10)}` : 'Not submitted'}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-emerald-900/80 text-xs font-medium">{app.department}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        {app.info.stage}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 font-semibold">{app.info.pending}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${app.info.color}`}>
                        <span className="size-1.5 rounded-full bg-current animate-pulse"></span>
                        {app.info.statusText} ({app.info.sla})
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <p className="italic">{app.remarks || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}