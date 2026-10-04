import React, { useState } from 'react';
import { Building2, MapPin, Factory, Layers, ArrowRight, CheckCircle2, Users, IndianRupee, User, AlertTriangle } from 'lucide-react';
import { api } from './api';

const fieldClass =
  'w-full h-11 px-3 rounded-lg border border-emerald-900/15 text-sm bg-white focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none';
const labelClass = 'block text-sm font-semibold text-emerald-950 mb-1 flex items-center gap-1.5';

export default function Onboarding({ onComplete }) {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: localStorage.getItem('userName') || '',
    businessType: 'Private Limited Company',
    industry: 'Manufacturing & Chemical',
    location: 'Industrial Zone, Phase-2',
    projectSize: 'Medium Scale (5-20 Acres)',
    stage: 'Pre-Establishment (Planning)',
    numMembers: 25,
    investmentLakh: 150,
    usesHazardous: 'No',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api('/businesses', {
        method: 'POST',
        body: {
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          business_type: formData.businessType,
          industry: formData.industry,
          location: formData.location,
          project_size: formData.projectSize,
          stage: formData.stage,
          num_members: Number(formData.numMembers) || 0,
          investment_lakh: Number(formData.investmentLakh) || 0,
          uses_hazardous: formData.usesHazardous,
        },
      });
      localStorage.setItem('businessProfile', JSON.stringify(formData));
      localStorage.setItem('isOnboarded', 'true');
      localStorage.removeItem('roadmapSeen');
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4faf6] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-emerald-900/10 shadow-xl overflow-hidden">
        <div className="bg-emerald-900 text-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-800 p-2 rounded-lg">
              <Building2 className="size-6 text-emerald-300" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase bg-emerald-800/80 text-emerald-200 px-2.5 py-1 rounded-md">
              Step 1 of 2 &middot; Profile Setup
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configure Your Industrial Profile</h1>
          <p className="text-sm text-emerald-200/80 mt-1">
            Avyra uses this data to discover your required clearances and documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800">Business Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><Building2 className="size-4 text-emerald-700" /> Business / Enterprise Name</label>
              <input type="text" required value={formData.businessName} onChange={set('businessName')} placeholder="e.g. ABC Manufacturing Pvt. Ltd." className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}><User className="size-4 text-emerald-700" /> Owner / Director Name</label>
              <input type="text" required value={formData.ownerName} onChange={set('ownerName')} placeholder="Full name" className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Business Type</label>
              <select value={formData.businessType} onChange={set('businessType')} className={fieldClass}>
                <option>Proprietorship</option>
                <option>Partnership Firm</option>
                <option>LLP</option>
                <option>Private Limited Company</option>
                <option>Public Limited Company</option>
              </select>
            </div>
            <div>
              <label className={labelClass}><Factory className="size-4 text-emerald-700" /> Industry Sector</label>
              <select value={formData.industry} onChange={set('industry')} className={fieldClass}>
                <option>Manufacturing & Chemical</option>
                <option>Pharmaceuticals & Biotech</option>
                <option>Textiles & Apparel</option>
                <option>Electronics & Hardware</option>
                <option>Heavy Engineering & Steel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><Users className="size-4 text-emerald-700" /> Team Members (Employees)</label>
              <input type="number" min="0" required value={formData.numMembers} onChange={set('numMembers')} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}><IndianRupee className="size-4 text-emerald-700" /> Investment (in Lakh)</label>
              <input type="number" min="0" required value={formData.investmentLakh} onChange={set('investmentLakh')} className={fieldClass} />
            </div>
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 pt-2">Project Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><MapPin className="size-4 text-emerald-700" /> Location / Zone</label>
              <select value={formData.location} onChange={set('location')} className={fieldClass}>
                <option>Industrial Zone, Phase-2</option>
                <option>Special Economic Zone (SEZ)</option>
                <option>Rural Development Area</option>
                <option>Municipal Corporation Limits</option>
              </select>
            </div>
            <div>
              <label className={labelClass}><Layers className="size-4 text-emerald-700" /> Project Scale / Size</label>
              <select value={formData.projectSize} onChange={set('projectSize')} className={fieldClass}>
                <option>Micro / Small Scale (&lt; 5 Acres)</option>
                <option>Medium Scale (5-20 Acres)</option>
                <option>Large Scale Mega Project (20+ Acres)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Business Stage</label>
              <select value={formData.stage} onChange={set('stage')} className={fieldClass}>
                <option>Pre-Establishment (Planning)</option>
                <option>Under Construction</option>
                <option>Operational & Expansion</option>
              </select>
            </div>
            <div>
              <label className={labelClass}><AlertTriangle className="size-4 text-emerald-700" /> Uses Hazardous Material?</label>
              <select value={formData.usesHazardous} onChange={set('usesHazardous')} className={fieldClass}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              <strong>Approval Discovery:</strong> After you submit, Avyra generates your personalized approval checklist and the documents required for each approval.
            </p>
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-900 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Generate Personalized Approval Checklist'} <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}