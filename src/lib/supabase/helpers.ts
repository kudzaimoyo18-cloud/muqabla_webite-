import { supabase } from './client';

// ============ AUTH HELPERS ============

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithOtp(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

export async function verifyOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: 'email' });
}

export async function signInWithGoogle(redirectTo: string) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function signOut() {
  return supabase.auth.signOut();
}

// ============ USER HELPERS ============

export async function createUserProfile(
  userId: string,
  type: 'candidate' | 'employer',
  fullName: string,
  phone?: string | null,
  email?: string | null
) {
  return supabase
    .from('users')
    .insert({
      id: userId,
      type,
      full_name: fullName,
      phone,
      email,
      language: 'en',
      is_verified: false,
      is_active: true,
    })
    .select()
    .single();
}

export async function getUserProfile(userId: string) {
  return supabase.from('users').select('*').eq('id', userId).single();
}

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  return supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
}

// ============ CANDIDATE HELPERS ============

export async function createCandidateProfile(userId: string, profileData: Record<string, unknown>) {
  return supabase
    .from('candidates')
    .insert({
      id: userId,
      ...profileData,
      country: profileData.country || 'UAE',
      willing_relocate: false,
      desired_job_types: [],
      desired_industries: [],
      emirates_id_verified: false,
      linkedin_verified: false,
      profile_views: 0,
      applications_count: 0,
    })
    .select()
    .single();
}

export async function getCandidateProfile(userId: string) {
  return supabase.from('candidates').select('*').eq('id', userId).single();
}

export async function updateCandidateProfile(userId: string, updates: Record<string, unknown>) {
  return supabase.from('candidates').update(updates).eq('id', userId).select().single();
}

// ============ EMPLOYER HELPERS ============

export async function getEmployerProfile(userId: string) {
  return supabase
    .from('employers')
    .select('*, company:companies(*)')
    .eq('id', userId)
    .single();
}

export async function createCompany(companyData: Record<string, unknown>) {
  const slug = (companyData.name as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return supabase
    .from('companies')
    .insert({ ...companyData, slug, locations: [], is_verified: false, jobs_posted: 0, total_hires: 0 })
    .select()
    .single();
}

export async function createEmployerProfile(userId: string, companyId: string, profileData: Record<string, unknown>) {
  return supabase
    .from('employers')
    .insert({ id: userId, company_id: companyId, role: 'admin', can_post_jobs: true, can_manage_team: true, ...profileData })
    .select()
    .single();
}

// ============ JOB HELPERS ============

export async function getJobsFeed(cursor?: string, limit = 10) {
  let query = supabase
    .from('jobs')
    .select('*, company:companies(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  return query;
}

export async function searchJobs(filters: Record<string, unknown>, limit = 20) {
  let query = supabase
    .from('jobs')
    .select('*, company:companies(*)')
    .eq('status', 'active');

  if (filters.query) {
    query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
  }
  if (filters.city) query = query.ilike('city', `%${filters.city}%`);
  if (filters.job_type) query = query.eq('job_type', filters.job_type);
  if (filters.work_mode) query = query.eq('work_mode', filters.work_mode);

  return query.order('created_at', { ascending: false }).limit(limit);
}

// ============ APPLICATION HELPERS ============

export async function createApplication(data: { job_id: string; candidate_id: string; video_id?: string; cover_message?: string }) {
  return supabase.from('applications').insert({ ...data, status: 'pending' }).select().single();
}

// ============ SAVED JOBS ============

export async function saveJob(candidateId: string, jobId: string) {
  return supabase.from('saved_jobs').insert({ candidate_id: candidateId, job_id: jobId }).select().single();
}

export async function unsaveJob(candidateId: string, jobId: string) {
  return supabase.from('saved_jobs').delete().eq('candidate_id', candidateId).eq('job_id', jobId);
}

// ============ VIDEO HELPERS ============

export async function createVideoRecord(videoData: {
  owner_id: string;
  type: 'profile' | 'application' | 'job_post' | 'company_intro';
  duration: number;
}) {
  return supabase
    .from('videos')
    .insert({ ...videoData, status: 'processing', skills_detected: [], ai_analyzed: false })
    .select()
    .single();
}

export async function updateVideoRecord(videoId: string, updates: Record<string, unknown>) {
  return supabase.from('videos').update(updates).eq('id', videoId).select().single();
}
