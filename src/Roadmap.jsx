import React, { useState, useEffect } from 'react';
import { Cpu, ArrowRight, FileText, Clock, ChevronDown, ChevronUp, Building2, Lightbulb } from 'lucide-react';
import { api } from './api';

export default function Roadmap({ onContinue }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [openCode, setOpenCode] = useState(null);

  useEffect(() => {
    api('/assistant/roadmap')
      .then((res) => {
        setData(res);
        setOpenCode(res.approvals[0]?.code || null);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-[#f4faf6] font-sans px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-6">
          <span className="inline-flex items-center gap-1.5 bg-emerald-800 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-700 mb-3">
            <Cpu className="size-3.5 text-emerald-300" /> AI Approval Assistant &middot; Step 2 of 2
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Approval Roadmap</h1>
          <p className="text-sm text-emerald-200/90 mt-2">
            Rules decide which approvals apply to you. The AI explains what each one is and which documents you need.
          </p>
        </div>

        {!data && !error && (
          <div className="bg-white rounded-2xl border border-emerald-900/10 p-8 text-center text-sm text-emerald-900/70">
            AI is analysing your business profile...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm p-6 mb-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="size-5 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-950 leading-relaxed">{data.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Approvals Needed</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">{data.total_approvals}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Estimated Time (parallel)</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">~{data.estimated_days} days</p>
                </div>
              </div>
              <p className="text-xs text-emerald-900/60 mt-4">
                Demo guidance based on sample rules. Estimates are not guaranteed approval dates.
              </p>
            </div>

            <div className="space-y-4">
              {data.approvals.map((a, idx) => {
                const open = openCode === a.code;
                return (
                  <div key={a.code} className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenCode(open ? null : a.code)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-emerald-50/40 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-800 font-bold text-sm">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-950">{a.name}</p>
                          <p className="text-xs text-emerald-900/60 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="size-3" /> {a.department}
                            <Clock className="size-3 ml-2" /> {a.sla_days} days
                          </p>
                        </div>
                      </div>
                      {open ? <ChevronUp className="size-5 text-emerald-700" /> : <ChevronDown className="size-5 text-emerald-700" />}
                    </button>

                    {open && (
                      <div className="px-6 pb-6 border-t border-emerald-900/5 pt-4 space-y-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">What is it?</p>
                          <p className="text-sm text-emerald-950 mt-1">{a.what}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Why you need it</p>
                          <p className="text-sm text-emerald-950 mt-1">{a.why_you}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">When to apply</p>
                          <p className="text-sm text-emerald-950 mt-1">{a.when}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">How</p>
                          <ol className="list-decimal list-inside text-sm text-emerald-950 mt-1 space-y-0.5">
                            {a.how.map((s, i) => <li key={i}>{s}</li>)}
                          </ol>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Documents required</p>
                          <div className="space-y-2">
                            {a.documents.map((d) => (
                              <div key={d.name} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <FileText className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-emerald-950">{d.name}</p>
                                  <p className="text-xs text-slate-600">{d.what}</p>
                                  <p className="text-xs text-emerald-800 mt-0.5">Tip: {d.tip}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={onContinue}
              className="w-full mt-6 h-12 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-900 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10"
            >
              Continue to Dashboard <ArrowRight className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}