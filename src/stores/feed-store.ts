'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface JobFeedItem {
  id: string;
  title: string;
  description: string;
  company_name: string;
  company_logo?: string;
  city: string;
  country: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  job_type: string;
  work_mode: string;
  seniority: string;
  requirements: string[];
  video_id?: string;
  created_at: string;
}

interface FeedState {
  jobs: JobFeedItem[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  savedJobs: Set<string>;
  appliedJobs: Set<string>;
  fetchJobs: (reset?: boolean) => Promise<void>;
  setCurrentIndex: (index: number) => void;
  applyToJob: (jobId: string, candidateId: string) => Promise<boolean>;
  saveJob: (jobId: string, candidateId: string) => Promise<boolean>;
  unsaveJob: (jobId: string, candidateId: string) => Promise<boolean>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  jobs: [],
  currentIndex: 0,
  isLoading: false,
  hasMore: true,
  savedJobs: new Set<string>(),
  appliedJobs: new Set<string>(),

  fetchJobs: async (reset = false) => {
    const state = get();
    if (state.isLoading || (!state.hasMore && !reset)) return;

    set({ isLoading: true });
    try {
      const offset = reset ? 0 : state.jobs.length;
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, title, description, city, country, salary_min, salary_max, salary_currency,
          job_type, work_mode, seniority, requirements, video_id, created_at,
          companies:company_id (name, logo_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + 9);

      if (error) throw error;

      const formattedJobs: JobFeedItem[] = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        company_name: job.companies?.name || 'Unknown Company',
        company_logo: job.companies?.logo_url,
        city: job.city,
        country: job.country,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency || 'AED',
        job_type: job.job_type,
        work_mode: job.work_mode,
        seniority: job.seniority,
        requirements: job.requirements || [],
        video_id: job.video_id,
        created_at: job.created_at,
      }));

      set({
        jobs: reset ? formattedJobs : [...state.jobs, ...formattedJobs],
        hasMore: formattedJobs.length === 10,
        isLoading: false,
        currentIndex: reset ? 0 : state.currentIndex,
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      set({ isLoading: false });
    }
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  applyToJob: async (jobId, candidateId) => {
    try {
      const { error } = await supabase.from('applications').insert({
        job_id: jobId,
        candidate_id: candidateId,
        status: 'pending',
      });
      if (error) throw error;

      set((state) => {
        const newApplied = new Set(state.appliedJobs);
        newApplied.add(jobId);
        return { appliedJobs: newApplied };
      });
      return true;
    } catch (error) {
      console.error('Error applying to job:', error);
      return false;
    }
  },

  saveJob: async (jobId, candidateId) => {
    try {
      const { error } = await supabase.from('saved_jobs').insert({
        job_id: jobId,
        candidate_id: candidateId,
      });
      if (error) throw error;

      set((state) => {
        const newSaved = new Set(state.savedJobs);
        newSaved.add(jobId);
        return { savedJobs: newSaved };
      });
      return true;
    } catch (error) {
      console.error('Error saving job:', error);
      return false;
    }
  },

  unsaveJob: async (jobId, candidateId) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('job_id', jobId)
        .eq('candidate_id', candidateId);
      if (error) throw error;

      set((state) => {
        const newSaved = new Set(state.savedJobs);
        newSaved.delete(jobId);
        return { savedJobs: newSaved };
      });
      return true;
    } catch (error) {
      console.error('Error unsaving job:', error);
      return false;
    }
  },
}));
