'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Video, Camera, MapPin, Briefcase, Award, Edit3, Check, X, Plus,
  Loader2, ChevronRight, LogOut, Building2, Mail, Globe, Users, Calendar,
  FileText, Image,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  getCandidateProfile, updateCandidateProfile, updateUserProfile,
  getEmployerProfile, updateCompanyProfile,
} from '@/lib/supabase/helpers';
import { getEmbedUrl } from '@/lib/cloudflare';
import { cities, countries, industries, companySizes } from '@/constants';
import BottomNav from '@/components/layout/BottomNav';

// ======================== CANDIDATE PROFILE ========================

interface CandidateData {
  id: string;
  headline?: string;
  current_title?: string;
  current_company?: string;
  city?: string;
  country?: string;
  years_experience?: number;
  ai_extracted_skills?: string[];
  profile_video_id?: string;
  linkedin_url?: string;
}

function CandidateProfile({ user, profile, isSetup }: { user: any; profile: any; isSetup: boolean }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(isSetup);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [form, setForm] = useState({
    headline: '', current_title: '', current_company: '',
    city: '', country: 'UAE', years_experience: 0, linkedin_url: '', full_name: '',
  });

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await getCandidateProfile(user.id);
    if (data) {
      setCandidate(data as CandidateData);
      setForm({
        headline: data.headline || '', current_title: data.current_title || '',
        current_company: data.current_company || '', city: data.city || '',
        country: data.country || 'UAE', years_experience: data.years_experience || 0,
        linkedin_url: data.linkedin_url || '', full_name: profile?.full_name || '',
      });
      setSkills(data.ai_extracted_skills || []);
    }
    setLoading(false);
  }, [user?.id, profile?.full_name]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    if (form.full_name && form.full_name !== profile?.full_name) {
      await updateUserProfile(user.id, { full_name: form.full_name });
    }
    await updateCandidateProfile(user.id, {
      headline: form.headline, current_title: form.current_title,
      current_company: form.current_company, city: form.city, country: form.country,
      years_experience: form.years_experience, linkedin_url: form.linkedin_url,
      ai_extracted_skills: skills,
    });
    await loadProfile();
    setEditing(false);
    setSaving(false);
    if (isSetup) router.push('/feed');
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const formData = new FormData();
      formData.append('file', file);
      await fetch(data.uploadUrl, { method: 'POST', body: formData });
      await updateCandidateProfile(user.id, { profile_video_id: data.videoId });
      await loadProfile();
    } catch { /* silent */ } finally { setUploading(false); }
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && !skills.includes(skill)) { setSkills([...skills, skill]); setNewSkill(''); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">{isSetup ? 'Set Up Your Profile' : 'Profile'}</h1>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-white/[0.06] rounded-lg text-sm text-gray-300 hover:text-white transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isSetup && (
                <button onClick={() => { setEditing(false); loadProfile(); }} className="w-8 h-8 rounded-lg bg-[#111] border border-white/[0.06] flex items-center justify-center text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {isSetup ? 'Save & Continue' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Video */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
          {candidate?.profile_video_id ? (
            <div className="aspect-[9/16] max-h-[300px] relative">
              <iframe src={`${getEmbedUrl(candidate.profile_video_id)}?muted=true&autoplay=false`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
              {editing && (
                <label className="absolute bottom-3 right-3 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              )}
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center py-12 ${editing ? 'cursor-pointer hover:bg-white/[0.02]' : ''} transition-colors`}>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                {uploading ? <Loader2 className="w-7 h-7 animate-spin text-emerald-400" /> : <Video className="w-7 h-7 text-emerald-400" />}
              </div>
              <p className="text-sm font-medium text-white mb-1">{uploading ? 'Uploading...' : 'Add your video intro'}</p>
              <p className="text-xs text-gray-500">60 seconds to make an impression</p>
              {editing && !uploading && <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />}
            </label>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4 space-y-4">
          {editing ? (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Full Name</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Headline</label>
                <input type="text" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Senior React Developer" className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Current Title</label>
                  <input type="text" value={form.current_title} onChange={(e) => setForm({ ...form, current_title: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Current Company</label>
                  <input type="text" value={form.current_company} onChange={(e) => setForm({ ...form, current_company: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">City</label>
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="">Select city</option>
                    {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Country</label>
                  <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                    {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Years of Experience</label>
                <input type="number" min={0} max={50} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: parseInt(e.target.value) || 0 })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">LinkedIn URL</label>
                <input type="url" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-white">{profile?.full_name || 'Your Name'}</h2>
                {candidate?.headline && <p className="text-sm text-emerald-400 mt-0.5">{candidate.headline}</p>}
              </div>
              {(candidate?.current_title || candidate?.current_company) && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>{candidate.current_title}{candidate.current_title && candidate.current_company && ' at '}{candidate.current_company}</span>
                </div>
              )}
              {candidate?.city && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{candidate.city}{candidate.country ? `, ${candidate.country}` : ''}</span>
                </div>
              )}
              {candidate?.years_experience !== undefined && candidate.years_experience > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>{candidate.years_experience} years experience</span>
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{profile.email}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Skills */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-400">
                {skill}
                {editing && <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>}
              </span>
            ))}
            {skills.length === 0 && !editing && <p className="text-xs text-gray-600">No skills added yet</p>}
          </div>
          {editing && (
            <div className="flex items-center gap-2 mt-3">
              <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill" className="flex-1 bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
              <button onClick={addSkill} className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ======================== EMPLOYER / COMPANY PROFILE ========================

interface CompanyData {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  founded_year?: number;
  website?: string;
  description?: string;
  headquarters?: string;
  locations?: string[];
  logo_url?: string;
  cover_image_url?: string;
  intro_video_id?: string;
  trade_license?: string;
  is_verified: boolean;
  jobs_posted: number;
  total_hires: number;
}

interface EmployerData {
  id: string;
  company_id: string;
  role: string;
  company: CompanyData;
}

function EmployerProfile({ user, profile, isSetup }: { user: any; profile: any; isSetup: boolean }) {
  const router = useRouter();
  const [employer, setEmployer] = useState<EmployerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(isSetup);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    size: '',
    founded_year: '',
    website: '',
    description: '',
    headquarters: '',
    full_name: '',
  });

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await getEmployerProfile(user.id);
    if (data) {
      const emp = data as unknown as EmployerData;
      setEmployer(emp);
      setForm({
        company_name: emp.company?.name || '',
        industry: emp.company?.industry || '',
        size: emp.company?.size || '',
        founded_year: emp.company?.founded_year?.toString() || '',
        website: emp.company?.website || '',
        description: emp.company?.description || '',
        headquarters: emp.company?.headquarters || '',
        full_name: profile?.full_name || '',
      });
    }
    setLoading(false);
  }, [user?.id, profile?.full_name]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    if (!user?.id || !employer?.company_id) return;
    setSaving(true);

    if (form.full_name && form.full_name !== profile?.full_name) {
      await updateUserProfile(user.id, { full_name: form.full_name });
    }

    await updateCompanyProfile(employer.company_id, {
      name: form.company_name,
      industry: form.industry,
      size: form.size,
      founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      website: form.website,
      description: form.description,
      headquarters: form.headquarters,
    });

    await loadProfile();
    setEditing(false);
    setSaving(false);
    if (isSetup) router.push('/employer/dashboard');
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employer?.company_id) return;
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const formData = new FormData();
      formData.append('file', file);
      await fetch(data.uploadUrl, { method: 'POST', body: formData });
      await updateCompanyProfile(employer.company_id, { intro_video_id: data.videoId });
      await loadProfile();
    } catch { /* silent */ } finally { setUploading(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  const company = employer?.company;

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">{isSetup ? 'Set Up Company Profile' : 'Company Profile'}</h1>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-white/[0.06] rounded-lg text-sm text-gray-300 hover:text-white transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isSetup && (
                <button onClick={() => { setEditing(false); loadProfile(); }} className="w-8 h-8 rounded-lg bg-[#111] border border-white/[0.06] flex items-center justify-center text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {isSetup ? 'Save & Continue' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Company Intro Video */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
          {company?.intro_video_id ? (
            <div className="aspect-video relative">
              <iframe src={`${getEmbedUrl(company.intro_video_id)}?muted=true&autoplay=false`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
              {editing && (
                <label className="absolute bottom-3 right-3 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              )}
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center py-12 ${editing ? 'cursor-pointer hover:bg-white/[0.02]' : ''} transition-colors`}>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                {uploading ? <Loader2 className="w-7 h-7 animate-spin text-emerald-400" /> : <Building2 className="w-7 h-7 text-emerald-400" />}
              </div>
              <p className="text-sm font-medium text-white mb-1">{uploading ? 'Uploading...' : 'Add company intro video'}</p>
              <p className="text-xs text-gray-500">Show candidates what it&apos;s like to work here</p>
              {editing && !uploading && <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />}
            </label>
          )}
        </div>

        {/* Company Info */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4 space-y-4">
          {editing ? (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Your Name</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Company Name</label>
                <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Your company name" className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Industry</label>
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">Select industry</option>
                  {industries.map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Company Size</label>
                  <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="">Select size</option>
                    {companySizes.map((s) => <option key={s.size} value={s.size}>{s.size} employees</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Founded Year</label>
                  <input type="number" min={1900} max={2026} value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} placeholder="e.g. 2020" className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Headquarters</label>
                <select value={form.headquarters} onChange={(e) => setForm({ ...form, headquarters: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">Select city</option>
                  {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yourcompany.com" className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Company Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell candidates about your company, culture, and what makes you a great place to work..." rows={4} className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{company?.name || 'Company Name'}</h2>
                  {company?.industry && <p className="text-sm text-emerald-400">{company.industry}</p>}
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Managed by <span className="text-white">{profile?.full_name}</span>
              </div>

              {company?.description && (
                <div className="pt-2">
                  <p className="text-sm text-gray-400 leading-relaxed">{company.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                {company?.headquarters && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                    <span>{company.headquarters}</span>
                  </div>
                )}
                {company?.size && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                    <span>{company.size} employees</span>
                  </div>
                )}
                {company?.founded_year && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                    <span>Founded {company.founded_year}</span>
                  </div>
                )}
                {company?.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Globe className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 truncate">{company.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}
              </div>

              {profile?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-400 pt-1">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                  <span>{profile.email}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Company Stats */}
        {!editing && (
          <div className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Company Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{company?.jobs_posted || 0}</div>
                <div className="text-xs text-gray-500">Jobs Posted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{company?.total_hires || 0}</div>
                <div className="text-xs text-gray-500">Total Hires</div>
              </div>
            </div>
            {company?.is_verified ? (
              <div className="flex items-center gap-2 mt-4 text-sm text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Verified Company</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-4 text-sm text-yellow-500">
                <FileText className="w-4 h-4" />
                <span>Verification pending</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ======================== MAIN PROFILE PAGE ========================

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';

  const { user, profile, isAuthenticated, isLoading: authLoading, initialize, signOut } = useAuthStore();

  useEffect(() => { initialize(); }, [initialize]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  const isEmployer = profile?.type === 'employer';

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {isEmployer ? (
        <EmployerProfile user={user} profile={profile} isSetup={isSetup} />
      ) : (
        <CandidateProfile user={user} profile={profile} isSetup={isSetup} />
      )}

      {/* Sign Out — always visible in non-edit mode */}
      <div className="px-4 max-w-lg mx-auto mt-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#111] border border-white/[0.06] rounded-xl text-sm text-red-400 hover:border-red-500/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
