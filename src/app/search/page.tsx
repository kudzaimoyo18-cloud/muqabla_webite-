'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Briefcase, DollarSign, Building2, Bookmark, BookmarkCheck,
  Filter, X, Loader2, Clock,
} from 'lucide-react';
import { searchJobs } from '@/lib/supabase/helpers';
import { useAuthStore } from '@/stores/auth-store';
import { useFeedStore } from '@/stores/feed-store';
import { cities } from '@/constants';
import BottomNav from '@/components/layout/BottomNav';

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  freelance: 'Freelance', internship: 'Internship',
};

const WORK_MODE_LABELS: Record<string, string> = {
  on_site: 'On Site', remote: 'Remote', hybrid: 'Hybrid',
};

function formatSalary(min?: number, max?: number, currency = 'AED') {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();
  if (min && max) return `${currency} ${fmt(min)} - ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return 'Competitive';
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

interface JobResult {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  job_type: string;
  work_mode: string;
  created_at: string;
  company: { name: string; logo_url?: string } | null;
}

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, profile, isLoading: authLoading, initialize } = useAuthStore();
  const { savedJobs, saveJob, appliedJobs, applyToJob } = useFeedStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ job_type: string; work_mode: string; city: string }>({
    job_type: '', work_mode: '', city: '',
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { initialize(); }, [initialize]);

  const doSearch = useCallback(async (searchQuery: string, searchFilters: typeof filters) => {
    setLoading(true);
    const filterParams: Record<string, unknown> = {};
    if (searchQuery.trim()) filterParams.query = searchQuery.trim();
    if (searchFilters.job_type) filterParams.job_type = searchFilters.job_type;
    if (searchFilters.work_mode) filterParams.work_mode = searchFilters.work_mode;
    if (searchFilters.city) filterParams.city = searchFilters.city;

    const { data } = await searchJobs(filterParams);
    setResults((data as JobResult[]) || []);
    setLoading(false);
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim() || filters.job_type || filters.work_mode || filters.city) {
        doSearch(query, filters);
      } else {
        setResults([]);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filters, doSearch]);

  // Load initial results
  useEffect(() => {
    if (isAuthenticated) doSearch('', filters);
  }, [isAuthenticated, doSearch, filters]);

  const handleSave = async (jobId: string) => {
    if (!profile?.id || savedJobs.has(jobId)) return;
    await saveJob(jobId, profile.id);
  };

  const handleApply = async (jobId: string) => {
    if (!profile?.id || appliedJobs.has(jobId)) return;
    await applyToJob(jobId, profile.id);
  };

  const activeFilterCount = [filters.job_type, filters.work_mode, filters.city].filter(Boolean).length;

  if (!isAuthenticated && !authLoading) {
    router.push('/auth/login?redirect=/search');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 pt-4 pb-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs, companies..."
                className="w-full bg-[#111] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                showFilters || activeFilterCount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#111] text-gray-400 border border-white/[0.06]'
              }`}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-3 p-4 bg-[#111] border border-white/[0.06] rounded-lg space-y-3 animate-fadeIn">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Job Type</label>
                <select
                  value={filters.job_type}
                  onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">All Types</option>
                  {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Work Mode</label>
                <select
                  value={filters.work_mode}
                  onChange={(e) => setFilters({ ...filters, work_mode: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">All Modes</option>
                  {Object.entries(WORK_MODE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">City</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ job_type: '', work_mode: '', city: '' })}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {query.trim() ? 'No jobs found matching your search' : 'Search for jobs to get started'}
            </p>
          </div>
        ) : (
          results.map((job) => (
            <div
              key={job.id}
              className="bg-[#111] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-white truncate">{job.title}</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{job.company?.name || 'Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => handleSave(job.id)}
                    className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                  >
                    {savedJobs.has(job.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] rounded text-[11px] text-gray-400">
                  <MapPin className="w-2.5 h-2.5" />
                  {job.city}{job.country ? `, ${job.country}` : ''}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] rounded text-[11px] text-gray-400">
                  <DollarSign className="w-2.5 h-2.5" />
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] rounded text-[11px] text-gray-400">
                  <Briefcase className="w-2.5 h-2.5" />
                  {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                </span>
                {job.work_mode && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[11px] text-emerald-400">
                    {WORK_MODE_LABELS[job.work_mode] || job.work_mode}
                  </span>
                )}
              </div>

              <p className="text-gray-500 text-xs line-clamp-2 mb-3">{job.description}</p>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-gray-600">
                  <Clock className="w-3 h-3" />
                  {timeAgo(job.created_at)}
                </span>
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={appliedJobs.has(job.id)}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:text-emerald-400/50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {appliedJobs.has(job.id) ? 'Applied' : 'Quick Apply'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
