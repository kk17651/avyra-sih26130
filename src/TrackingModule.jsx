import React, { useState } from 'react';
import { 
  FileText, Clock, AlertTriangle, CheckCircle2, 
  Search, Filter, Activity 
} from 'lucide-react';

export default function TrackingModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  const [trackedApplications] = useState([
    {
      id: 'AVR-9921',
      name: 'Fire Safety NOC',
      department: 'Fire & Safety Department',
      submittedDate: '2026-10-01',
      currentStage: 'Officer Manual Verification',
      status: 'Delayed / Bottleneck',
      statusColor: 'bg-red-50 text-red-700 border-red-200',
      slaCountdown: '2 Hours Left (Critical)',
      pendingWith: 'Joint Director (Zone-2)',
      remarks: 'Pending physical layout verification of emergency exits.'
    },
    {
      id: 'AVR-9922',
      name: 'State Pollution Control Board (SPCB) Consent',
      department: 'Ministry of Environment',
      submittedDate: '2026-10-02',
      currentStage: 'AI Pre-Validation & OCR',
      status: 'On Track',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      slaCountdown: '4 Days Remaining',
      pendingWith: 'Automated AI Compliance Engine',
      remarks: 'Water discharge data verified. Awaiting final officer sign-off.'
    },
    {
      id: 'AVR-9801',
      name: 'Factory License & Building Plan Approval',
      department: 'Directorate of Factories',
      submittedDate: '2026-09-28',
      currentStage: 'Final Digital Certificate Generation',
      status: 'Approved',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
      slaCountdown: 'Completed',
      pendingWith: 'None (Issued)',
      remarks: 'Digitally signed certificate dispatched to portal vault.'
    },
    {
      id: 'AVR-9754',
      name: 'Water & Power Setup Connection',
      department: 'Municipal Corporation',
      submittedDate: '2026-10-03',
      currentStage: 'Inter-Departmental Node Routing',
      status: 'In Progress',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      slaCountdown: '8 Days Remaining',
      pendingWith: 'Electrical Inspectorate',
      remarks: 'Load sanction report submitted by utility partner.'
    }
  ]);

  const filteredApps = trackedApplications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterDept === 'All' || app.department.includes(filterDept);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Total Active Files</p>
          <h3 className="text-2xl font-black text-emerald-950 mt-1">04 Applications</h3>
          <p className="text-xs text-emerald-700 mt-2 font-medium">Across 4 different departments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Bottlenecks / Delayed</p>
          <h3 className="text-2xl font-black text-red-600 mt-1">01 File Stalled</h3>
          <p className="text-xs text-red-600/80 mt-2 font-medium">SLA time-bomb threshold crossed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">In Progress / Review</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">02 Files</h3>
          <p className="text-xs text-amber-700 mt-2 font-medium">Moving through normal workflow</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-sm border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Successfully Approved</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">01 Clearance</h3>
          <p className="text-xs text-emerald-700 mt-2 font-medium">Ready for operational use</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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
            className="w-full sm:w-48 h-10 px-3 rounded-xl border border-emerald-900/15 text-sm bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none font-medium text-emerald-950"
          >
            <option value="All">All Departments</option>
            <option value="Fire">Fire & Safety</option>
            <option value="Environment">Environment / Pollution</option>
            <option value="Factories">Factories Directorate</option>
            <option value="Municipal">Municipal Corp.</option>
          </select>
        </div>
      </div>

      {/* Tracking Table */}
      <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-900/10 bg-emerald-50/40 flex justify-between items-center">
          <h3 className="font-bold text-emerald-950 text-base flex items-center gap-2">
            <Activity className="size-5 text-emerald-700" /> Live Application Tracking & Delay Monitor
          </h3>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Real-Time Node Sync
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-emerald-900/10 bg-slate-50 text-xs font-bold text-emerald-900/70 uppercase tracking-wider">
                <th className="py-3 px-6">Clearance & ID</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Current Stage</th>
                <th className="py-3 px-6">Pending With</th>
                <th className="py-3 px-6">SLA Status</th>
                <th className="py-3 px-6">Action / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/5 text-sm">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-emerald-50/30 transition">
                  <td className="py-4 px-6">
                    <p className="font-bold text-emerald-950">{app.name}</p>
                    <p className="text-xs text-emerald-900/50 font-mono mt-0.5">{app.id} &bull; Submitted: {app.submittedDate}</p>
                  </td>
                  <td className="py-4 px-6 text-emerald-900/80 text-xs font-medium">
                    {app.department}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-semibold text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {app.currentStage}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-700 font-semibold">
                    {app.pendingWith}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${app.statusColor}`}>
                      <span className="size-1.5 rounded-full bg-current animate-pulse"></span>
                      {app.status} ({app.slaCountdown})
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600">
                    <p className="italic">{app.remarks}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}