'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video, Upload, Loader2, ArrowLeft, Camera,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getEmployerProfile } from '@/lib/supabase/helpers';
import { supabase } from '@/lib/supabase/client';
import { cities, countries, jobTypes, workModes } from '@/constants';
import BottomNav from '@/components/layout/BottomNav';

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  freelance: 'Freelance', internship: 'Internship',
};

const WORK_MODE_LABELS: Record<string, string> = {
  on_site: 'On Site', remote: 'Remote', hybrid: 'Hybrid',
};

const SENIORITY_OPTIONS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

export default function PostJobPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    city: 'Dubai',
    country: 'United Arab Emirates',
    job_type: 'full_time',
    work_mode: 'on_site',
    seniority: 'mid',
    salary_min: '',
    salary_max: '',
    salary_currency: 'AED',
    show_salary: true,
    requirements: '',
  });

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    getEmployerProfile(user.id).then(({ data }) => {
      if (data?.company_id) setCompanyId(data.company_id);
    });
  }, [isAuthenticated, user?.id]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const { uploadUrl, videoId: vid } = data;

      const formData = new FormData();
      formData.append('file', file);
      await fetch(uploadUrl, { method: 'POST', body: formData });

      setVideoId(vid);
    } catch {
      setError('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !companyId) {
      setError('Company profile not found. Please complete your employer setup first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requirements = form.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: form.title,
          description: form.description,
          city: form.city,
          country: form.country,
          job_type: form.job_type,
          work_mode: form.work_mode,
          seniority: form.seniority,
          salary_min: form.salary_min ? parseInt(form.salary_min) : null,
          salary_max: form.salary_max ? parseInt(form.salary_max) : null,
          salary_currency: form.salary_currency,
          show_salary: form.show_salary,
          requirements,
          posted_by: user.id,
          company_id: companyId,
          video_id: videoId,
          status: 'active',
          views_count: 0,
          applications_count: 0,
        });

      if (insertError) throw insertError;
      router.push('/employer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/[0.06]">
        <button onClick={() => router.back()} className="w-9 h-9 bg-[#111] border border-white/[0.06] rounded-lg flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Post a Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        {/* Video Upload */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
          <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              ) : videoId ? (
                <Camera className="w-6 h-6 text-emerald-400" />
              ) : (
                <Video className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {uploading ? 'Uploading...' : videoId ? 'Video uploaded' : 'Add job video'}
            </p>
            <p className="text-xs text-gray-500">
              {videoId ? 'Click to replace' : 'Optional: up to 5 minutes'}
            </p>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* Job Details */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Job Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Frontend Developer"
              required
              className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              required
              rows={4}
              className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">City</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Country</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Job Type</label>
              <select
                value={form.job_type}
                onChange={(e) => setForm({ ...form, job_type: e.target.value })}
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                {jobTypes.map((t) => (
                  <option key={t} value={t}>{JOB_TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Work Mode</label>
              <select
                value={form.work_mode}
                onChange={(e) => setForm({ ...form, work_mode: e.target.value })}
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                {workModes.map((m) => (
                  <option key={m} value={m}>{WORK_MODE_LABELS[m] || m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Seniority Level</label>
            <select
              value={form.seniority}
              onChange={(e) => setForm({ ...form, seniority: e.target.value })}
              className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              {SENIORITY_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Min Salary</label>
              <input
                type="number"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                placeholder="5000"
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Max Salary</label>
              <input
                type="number"
                value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                placeholder="15000"
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Currency</label>
              <select
                value={form.salary_currency}
                onChange={(e) => setForm({ ...form, salary_currency: e.target.value })}
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="QAR">QAR</option>
                <option value="KWD">KWD</option>
                <option value="BHD">BHD</option>
                <option value="OMR">OMR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Requirements (one per line)</label>
            <textarea
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="3+ years React experience&#10;Strong TypeScript skills&#10;GCC work permit"
              rows={3}
              className="w-full bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.title || !form.description}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>

      <BottomNav variant="employer" />
    </div>
  );
}
