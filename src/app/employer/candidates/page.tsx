'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Users, Loader2, Play, MapPin, ArrowLeft,
  LayoutGrid, List, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getEmployerProfile } from '@/lib/supabase/helpers';
import { getEmbedUrl } from '@/lib/cloudflare';
import { supabase } from '@/lib/supabase/client';
import BottomNav from '@/components/layout/BottomNav';

interface CandidateApplication {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string;
  created_at: string;
  job_title: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  city?: string;
  country?: string;
  ai_extracted_skills?: string[];
  profile_video_id?: string;
}

const STATUS_OPTIONS = ['pending', 'viewed', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  viewed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  shortlisted: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  interviewing: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  offered: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  hired: 'text-green-400 bg-green-400/10 border-green-400/20',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function CandidatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();

  const [candidates, setCandidates] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [watchingVideo, setWatchingVideo] = useState<string | null>(null);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    async function loadCandidates() {
      setLoading(true);

      const { data: employer } = await getEmployerProfile(user!.id);
      if (!employer?.company_id) { setLoading(false); return; }

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('company_id', employer.company_id);

      if (!jobs || jobs.length === 0) { setLoading(false); return; }

      const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));
      const jobIds = jobs.map((j) => j.id);

      let query = supabase
        .from('applications')
        .select('id, candidate_id, job_id, status, created_at')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);

      const { data: applications } = await query;

      if (!applications) { setLoading(false); return; }

      const enriched = await Promise.all(
        applications.map(async (app) => {
          const { data: cand } = await supabase
            .from('candidates')
            .select('headline, city, country, ai_extracted_skills, profile_video_id')
            .eq('id', app.candidate_id)
            .single();
          const { data: userData } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', app.candidate_id)
            .single();

          return {
            ...app,
            job_title: jobMap[app.job_id] || 'Job',
            full_name: userData?.full_name || 'Candidate',
            avatar_url: userData?.avatar_url,
            headline: cand?.headline,
            city: cand?.city,
            country: cand?.country,
            ai_extracted_skills: cand?.ai_extracted_skills,
            profile_video_id: cand?.profile_video_id,
          } as unknown as CandidateApplication;
        })
      );

      setCandidates(enriched);
      setLoading(false);
    }

    loadCandidates();
  }, [isAuthenticated, user?.id, statusFilter]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    await supabase.from('applications').update({ status: newStatus }).eq('id', appId);
    setCandidates((prev) =>
      prev.map((c) => (c.id === appId ? { ...c, status: newStatus } : c))
    );
  };

  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.headline?.toLowerCase().includes(q)) ||
      (c.city?.toLowerCase().includes(q)) ||
      (c.ai_extracted_skills?.some((s) => s.toLowerCase().includes(q)))
    );
  });

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
        <h1 className="text-lg font-semibold text-white flex-1">Candidates</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('card')}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${viewMode === 'card' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-500'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${viewMode === 'list' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="w-full bg-[#111] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Video Modal */}
      {watchingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setWatchingVideo(null)}>
          <div className="w-full max-w-sm aspect-[9/16] rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`${getEmbedUrl(watchingVideo)}?autoplay=true`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No candidates found</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((c) => (
              <div key={c.id} className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-white truncate">{c.full_name}</h3>
                    {c.headline && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.headline}</p>}
                    <p className="text-[11px] text-gray-600 mt-1">Applied for: {c.job_title}</p>
                  </div>
                  {c.profile_video_id && (
                    <button
                      onClick={() => setWatchingVideo(c.profile_video_id!)}
                      className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center ml-3 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Play className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                </div>

                {c.city && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    {c.city}{c.country ? `, ${c.country}` : ''}
                  </div>
                )}

                {c.ai_extracted_skills && c.ai_extracted_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.ai_extracted_skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-white/[0.04] rounded text-[10px] text-gray-400">
                        {skill}
                      </span>
                    ))}
                    {c.ai_extracted_skills.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] text-gray-600">+{c.ai_extracted_skills.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border capitalize focus:outline-none ${STATUS_COLORS[c.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-600">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
            {filtered.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.full_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{c.headline || c.job_title}</p>
                </div>
                {c.profile_video_id && (
                  <button
                    onClick={() => setWatchingVideo(c.profile_video_id!)}
                    className="w-7 h-7 bg-emerald-500/10 rounded-full flex items-center justify-center"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                  </button>
                )}
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.id, e.target.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border capitalize focus:outline-none ${STATUS_COLORS[c.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav variant="employer" />
    </div>
  );
}
