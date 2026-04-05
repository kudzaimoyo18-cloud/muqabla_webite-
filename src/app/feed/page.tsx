'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, DollarSign, Briefcase, ChevronUp, ChevronDown,
  Bookmark, BookmarkCheck, Send, Check, Building2, Loader2, Volume2, VolumeX,
} from 'lucide-react';
import { useFeedStore } from '@/stores/feed-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSwipe } from '@/hooks/useSwipe';
import BottomNav from '@/components/layout/BottomNav';
import { getEmbedUrl } from '@/lib/cloudflare';

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  freelance: 'Freelance', internship: 'Internship',
};

function formatSalary(min?: number, max?: number, currency = 'AED') {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();
  if (min && max) return `${currency} ${fmt(min)} - ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return 'Competitive';
}

export default function FeedPage() {
  const router = useRouter();
  const { jobs, currentIndex, isLoading, fetchJobs, setCurrentIndex, applyToJob, saveJob, savedJobs, appliedJobs } = useFeedStore();
  const { user, profile, initialize, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [actionFeedback, setActionFeedback] = useState<{ type: 'applied' | 'saved' | null; index: number }>({ type: null, index: -1 });
  const [muted, setMuted] = useState(true);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) fetchJobs(true);
  }, [isAuthenticated, fetchJobs]);

  const currentJob = jobs[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      if (currentIndex >= jobs.length - 3) fetchJobs();
    }
  }, [currentIndex, jobs.length, setCurrentIndex, fetchJobs]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex, setCurrentIndex]);

  const handleApply = useCallback(async () => {
    if (!currentJob || !profile?.id || appliedJobs.has(currentJob.id)) return;
    const success = await applyToJob(currentJob.id, profile.id);
    if (success) {
      setActionFeedback({ type: 'applied', index: currentIndex });
      setTimeout(() => { setActionFeedback({ type: null, index: -1 }); goToNext(); }, 800);
    }
  }, [currentJob, profile, appliedJobs, applyToJob, currentIndex, goToNext]);

  const handleSave = useCallback(async () => {
    if (!currentJob || !profile?.id || savedJobs.has(currentJob.id)) return;
    const success = await saveJob(currentJob.id, profile.id);
    if (success) {
      setActionFeedback({ type: 'saved', index: currentIndex });
      setTimeout(() => setActionFeedback({ type: null, index: -1 }), 1200);
    }
  }, [currentJob, profile, savedJobs, saveJob, currentIndex]);

  const { swipeState, handlers } = useSwipe({
    onSwipeLeft: handleApply,
    onSwipeRight: handleSave,
    onSwipeUp: goToNext,
    onSwipeDown: goToPrev,
    threshold: 60,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') goToNext();
      if (e.key === 'ArrowUp' || e.key === 'k') goToPrev();
      if (e.key === 'ArrowLeft' || e.key === 'a') handleApply();
      if (e.key === 'ArrowRight' || e.key === 's') handleSave();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, handleApply, handleSave]);

  // Middleware already protects this route — show loading while auth initializes
  if ((isLoading || authLoading || !isAuthenticated) && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No jobs yet</h2>
          <p className="text-gray-400 text-sm">Check back soon for new opportunities</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="h-[calc(100vh-72px)] relative overflow-hidden" {...handlers}>
        {currentJob && (
          <div
            className="h-full relative flex flex-col"
            style={{
              transform: swipeState.isSwiping ? `translateX(${swipeState.deltaX * 0.3}px)` : undefined,
              transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {/* Video / Visual Area */}
            <div className="flex-1 relative bg-gradient-to-b from-gray-900 to-[#0a0a0a] overflow-hidden">
              {currentJob.video_id ? (
                <div className="absolute inset-0">
                  <iframe
                    src={`${getEmbedUrl(currentJob.video_id)}?muted=${muted}&autoplay=true&loop=true`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                  <div className="video-overlay absolute inset-0 pointer-events-none" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-emerald-400/50" />
                  </div>
                </div>
              )}

              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                <div className="text-sm text-gray-300 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                  {currentIndex + 1} / {jobs.length}
                </div>
                <button onClick={() => setMuted(!muted)} className="w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                  {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Side actions */}
              <div className="absolute right-4 bottom-8 flex flex-col gap-4 z-10">
                <button onClick={handleSave} className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                  {savedJobs.has(currentJob.id) ? <BookmarkCheck className="w-5 h-5 text-emerald-400" /> : <Bookmark className="w-5 h-5 text-white" />}
                </button>
                <button onClick={handleApply} disabled={appliedJobs.has(currentJob.id)} className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 rounded-full flex items-center justify-center transition-colors">
                  {appliedJobs.has(currentJob.id) ? <Check className="w-5 h-5 text-white" /> : <Send className="w-5 h-5 text-white" />}
                </button>
              </div>

              {/* Nav arrows (desktop) */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2 z-10">
                <button onClick={goToPrev} disabled={currentIndex === 0} className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-30">
                  <ChevronUp className="w-5 h-5 text-white" />
                </button>
                <button onClick={goToNext} disabled={currentIndex >= jobs.length - 1} className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-30">
                  <ChevronDown className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Job Info Card */}
            <div className="px-5 py-5 bg-[#0a0a0a] border-t border-white/[0.06]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white truncate">{currentJob.title}</h2>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{currentJob.company_name}</span>
                  </div>
                </div>
                {currentJob.company_logo && (
                  <img src={currentJob.company_logo} alt="" className="w-10 h-10 rounded-lg object-cover ml-3" />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111] border border-white/[0.06] rounded-md text-xs text-gray-300">
                  <MapPin className="w-3 h-3" />
                  {currentJob.city}{currentJob.country ? `, ${currentJob.country}` : ''}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111] border border-white/[0.06] rounded-md text-xs text-gray-300">
                  <DollarSign className="w-3 h-3" />
                  {formatSalary(currentJob.salary_min, currentJob.salary_max, currentJob.salary_currency)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111] border border-white/[0.06] rounded-md text-xs text-gray-300">
                  <Briefcase className="w-3 h-3" />
                  {JOB_TYPE_LABELS[currentJob.job_type] || currentJob.job_type}
                </span>
              </div>

              <p className="text-gray-400 text-sm line-clamp-2">{currentJob.description}</p>

              {/* Swipe hints (mobile) */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04] md:hidden">
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-emerald-400">&larr;</span> Swipe to apply
                </span>
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  Swipe to save <span className="text-blue-400">&rarr;</span>
                </span>
              </div>
            </div>

            {/* Action Feedback Overlay */}
            {actionFeedback.type && actionFeedback.index === currentIndex && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className={`px-8 py-4 rounded-2xl backdrop-blur-md animate-fadeIn ${
                  actionFeedback.type === 'applied' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-blue-500/20 border border-blue-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {actionFeedback.type === 'applied' ? (
                      <><Check className="w-6 h-6 text-emerald-400" /><span className="text-lg font-semibold text-emerald-400">Applied!</span></>
                    ) : (
                      <><BookmarkCheck className="w-6 h-6 text-blue-400" /><span className="text-lg font-semibold text-blue-400">Saved!</span></>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Swipe Direction Overlay */}
            {swipeState.isSwiping && Math.abs(swipeState.deltaX) > 30 && (
              <div className={`absolute inset-0 pointer-events-none z-10 transition-opacity ${
                swipeState.deltaX < -30 ? 'swipe-overlay-left' : 'swipe-overlay-right'
              }`} />
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
