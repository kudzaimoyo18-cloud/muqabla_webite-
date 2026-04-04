'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Users, Eye, TrendingUp, Plus, ChevronRight, Loader2,
  Clock, CheckCircle, UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';
import { getEmployerProfile } from '@/lib/supabase/helpers';
import BottomNav from '@/components/layout/BottomNav';

interface DashboardStats {
  activeJobs: number;
  totalApplicants: number;
  newToday: number;
  totalViews: number;
}

interface RecentApplicant {
  id: string;
  candidate_id: string;
  status: string;
  created_at: string;
  job: { title: string } | null;
  candidate: { headline?: string; city?: string } | null;
  user: { full_name: string; avatar_url?: string } | null;
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({ activeJobs: 0, totalApplicants: 0, newToday: 0, totalViews: 0 });
  const [recentApplicants, setRecentApplicants] = useState<RecentApplicant[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    async function loadDashboard() {
      setLoading(true);

      // Get employer + company
      const { data: employer } = await getEmployerProfile(user!.id);
      const companyId = employer?.company_id;
      if (employer?.company) {
        setCompanyName((employer.company as { name: string }).name);
      }

      if (!companyId) { setLoading(false); return; }

      // Get stats
      const { count: activeJobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      const { data: companyJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', companyId);

      const jobIds = companyJobs?.map((j) => j.id) || [];

      let totalApplicants = 0;
      let newToday = 0;

      if (jobIds.length > 0) {
        const { count: appCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobIds);

        totalApplicants = appCount || 0;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count: todayCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobIds)
          .gte('created_at', todayStart.toISOString());

        newToday = todayCount || 0;

        // Recent applicants
        const { data: recent } = await supabase
          .from('applications')
          .select('id, candidate_id, status, created_at, job:jobs(title)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recent) {
          const enriched = await Promise.all(
            recent.map(async (app) => {
              const { data: candidateData } = await supabase
                .from('candidates')
                .select('headline, city')
                .eq('id', app.candidate_id)
                .single();
              const { data: userData } = await supabase
                .from('users')
                .select('full_name, avatar_url')
                .eq('id', app.candidate_id)
                .single();
              return { ...app, candidate: candidateData, user: userData } as unknown as RecentApplicant;
            })
          );
          setRecentApplicants(enriched);
        }
      }

      setStats({
        activeJobs: activeJobCount || 0,
        totalApplicants,
        newToday,
        totalViews: 0,
      });

      setLoading(false);
    }

    loadDashboard();
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated && !authLoading) {
    router.push('/auth/login?redirect=/employer/dashboard');
    return null;
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    viewed: 'text-blue-400 bg-blue-400/10',
    shortlisted: 'text-emerald-400 bg-emerald-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    hired: 'text-green-400 bg-green-400/10',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm text-gray-500">Welcome back</p>
        <h1 className="text-xl font-bold text-white">{companyName || profile?.full_name || 'Dashboard'}</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'text-emerald-400 bg-emerald-400/10' },
            { label: 'Total Applicants', value: stats.totalApplicants, icon: Users, color: 'text-blue-400 bg-blue-400/10' },
            { label: 'New Today', value: stats.newToday, icon: TrendingUp, color: 'text-orange-400 bg-orange-400/10' },
            { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-purple-400 bg-purple-400/10' },
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/employer/post-job')}
            className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl p-4 transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-sm font-medium text-white">Post a Job</span>
          </button>
          <button
            onClick={() => router.push('/employer/candidates')}
            className="flex items-center gap-3 bg-[#111] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 transition-colors"
          >
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-white">Candidates</span>
          </button>
        </div>

        {/* Recent Applicants */}
        <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-medium text-white">Recent Applicants</h3>
            <button onClick={() => router.push('/employer/candidates')} className="text-xs text-emerald-400 hover:text-emerald-300">
              View All
            </button>
          </div>

          {recentApplicants.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Users className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No applicants yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentApplicants.map((app) => (
                <div key={app.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{app.user?.full_name || 'Candidate'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {app.candidate?.headline || app.candidate?.city || 'Applied'} &middot; {(app.job as { title: string } | null)?.title || 'Job'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[app.status] || 'text-gray-400 bg-gray-400/10'}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav variant="employer" />
    </div>
  );
}
