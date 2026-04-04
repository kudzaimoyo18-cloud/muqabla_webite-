'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, BookmarkCheck, Send, Eye, TrendingUp, Loader2,
  ChevronRight, Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';
import BottomNav from '@/components/layout/BottomNav';

interface DashboardStats {
  totalApplications: number;
  savedJobs: number;
  profileViews: number;
  shortlisted: number;
}

interface RecentApplication {
  id: string;
  status: string;
  created_at: string;
  job: { title: string; city: string; company: { name: string } | null } | null;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  viewed: 'text-blue-400 bg-blue-400/10',
  shortlisted: 'text-emerald-400 bg-emerald-400/10',
  interviewing: 'text-cyan-400 bg-cyan-400/10',
  offered: 'text-purple-400 bg-purple-400/10',
  hired: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
};

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({ totalApplications: 0, savedJobs: 0, profileViews: 0, shortlisted: 0 });
  const [recentApps, setRecentApps] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    async function loadDashboard() {
      setLoading(true);

      const [appsResult, savedResult, candidateResult] = await Promise.all([
        supabase
          .from('applications')
          .select('id, status, created_at, job:jobs(title, city, company:companies(name))')
          .eq('candidate_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('saved_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('candidate_id', user!.id),
        supabase
          .from('candidates')
          .select('profile_views')
          .eq('id', user!.id)
          .single(),
      ]);

      const apps = appsResult.data || [];
      const shortlisted = apps.filter((a) => ['shortlisted', 'interviewing', 'offered', 'hired'].includes(a.status)).length;

      setStats({
        totalApplications: apps.length,
        savedJobs: savedResult.count || 0,
        profileViews: candidateResult.data?.profile_views || 0,
        shortlisted,
      });

      setRecentApps(apps.slice(0, 5) as RecentApplication[]);
      setLoading(false);
    }

    loadDashboard();
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated && !authLoading) {
    router.push('/auth/login?redirect=/dashboard');
    return null;
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm text-gray-500">Hello</p>
        <h1 className="text-xl font-bold text-white">{profile?.full_name || 'Dashboard'}</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Applications', value: stats.totalApplications, icon: Send, color: 'text-emerald-400 bg-emerald-400/10' },
            { label: 'Saved Jobs', value: stats.savedJobs, icon: BookmarkCheck, color: 'text-blue-400 bg-blue-400/10' },
            { label: 'Profile Views', value: stats.profileViews, icon: Eye, color: 'text-purple-400 bg-purple-400/10' },
            { label: 'Shortlisted', value: stats.shortlisted, icon: TrendingUp, color: 'text-orange-400 bg-orange-400/10' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111] border border-white/[0.06] rounded-xl p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/feed')}
            className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl p-4 transition-colors"
          >
            <Briefcase className="w-5 h-5 text-white" />
            <span className="text-sm font-medium text-white">Browse Jobs</span>
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-3 bg-[#111] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 transition-colors"
          >
            <Eye className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-white">My Profile</span>
          </button>
        </div>

        {/* Recent Applications */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-medium text-white">Recent Applications</h3>
          </div>

          {recentApps.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Send className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No applications yet</p>
              <button
                onClick={() => router.push('/feed')}
                className="text-xs text-emerald-400 hover:text-emerald-300 mt-2"
              >
                Start browsing jobs
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentApps.map((app) => {
                const job = app.job as { title: string; city: string; company: { name: string } | null } | null;
                return (
                  <div key={app.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{job?.title || 'Job'}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {(job?.company as { name: string } | null)?.name || 'Company'} &middot; {job?.city || ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[app.status] || 'text-gray-400 bg-gray-400/10'}`}>
                        {app.status}
                      </span>
                      <span className="text-[10px] text-gray-600">{timeAgo(app.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
