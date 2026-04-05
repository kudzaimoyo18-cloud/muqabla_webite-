'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Search, Loader2, Briefcase, Clock, ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';
import BottomNav from '@/components/layout/BottomNav';

interface Conversation {
  id: string;
  application_id: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  other_party_name: string;
  job_title: string;
  unread: boolean;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !profile) return;

    async function loadConversations() {
      setLoading(true);

      if (profile!.type === 'candidate') {
        // Get conversations via applications the candidate made
        const { data: apps } = await supabase
          .from('applications')
          .select('id, job_id, created_at, job:jobs(title, company_id)')
          .eq('candidate_id', user!.id)
          .in('status', ['viewed', 'shortlisted', 'interviewing', 'offered', 'hired'])
          .order('updated_at', { ascending: false });

        if (apps) {
          const convos: Conversation[] = await Promise.all(
            apps.map(async (app) => {
              const job = app.job as { title: string; company_id: string } | null;
              let companyName = 'Company';
              if (job?.company_id) {
                const { data: company } = await supabase
                  .from('companies')
                  .select('name')
                  .eq('id', job.company_id)
                  .single();
                if (company) companyName = company.name;
              }
              return {
                id: app.id,
                application_id: app.id,
                created_at: app.created_at,
                other_party_name: companyName,
                job_title: job?.title || 'Job',
                unread: false,
              };
            })
          );
          setConversations(convos);
        }
      } else {
        // Employer: get conversations from applications to their jobs
        const { data: employer } = await supabase
          .from('employers')
          .select('company_id')
          .eq('id', user!.id)
          .single();

        if (employer?.company_id) {
          const { data: jobs } = await supabase
            .from('jobs')
            .select('id, title')
            .eq('company_id', employer.company_id);

          if (jobs && jobs.length > 0) {
            const jobIds = jobs.map((j) => j.id);
            const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));

            const { data: apps } = await supabase
              .from('applications')
              .select('id, candidate_id, job_id, created_at')
              .in('job_id', jobIds)
              .in('status', ['viewed', 'shortlisted', 'interviewing', 'offered', 'hired'])
              .order('created_at', { ascending: false });

            if (apps) {
              const convos: Conversation[] = await Promise.all(
                apps.map(async (app) => {
                  const { data: userData } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', app.candidate_id)
                    .single();
                  return {
                    id: app.id,
                    application_id: app.id,
                    created_at: app.created_at,
                    other_party_name: userData?.full_name || 'Candidate',
                    job_title: jobMap[app.job_id] || 'Job',
                    unread: false,
                  };
                })
              );
              setConversations(convos);
            }
          }
        }
      }

      setLoading(false);
    }

    loadConversations();
  }, [isAuthenticated, user?.id, profile]);

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.other_party_name.toLowerCase().includes(q) || c.job_title.toLowerCase().includes(q);
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
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <h1 className="text-lg font-semibold text-white mb-3">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#111] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-6">
            <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white mb-1">No messages yet</h3>
            <p className="text-xs text-gray-500">
              {profile?.type === 'candidate'
                ? 'Messages will appear when employers respond to your applications'
                : 'Messages will appear when you engage with candidates'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((convo) => (
              <div
                key={convo.id}
                className="px-4 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${convo.unread ? 'font-semibold text-white' : 'font-medium text-gray-300'}`}>
                      {convo.other_party_name}
                    </p>
                    <span className="text-[10px] text-gray-600 ml-2 shrink-0">
                      {timeAgo(convo.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {convo.job_title}
                  </p>
                </div>
                {convo.unread && (
                  <div className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav variant={profile?.type === 'employer' ? 'employer' : 'candidate'} />
    </div>
  );
}
