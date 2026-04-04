'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Loader2, MapPin, ArrowLeft, UserPlus, Check,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';
import BottomNav from '@/components/layout/BottomNav';

interface Connection {
  id: string;
  connected_user_id: string;
  full_name: string;
  headline?: string;
  city?: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    async function loadConnections() {
      setLoading(true);

      const { data: conns } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${user!.id},connected_user_id.eq.${user!.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (conns) {
        const enriched = await Promise.all(
          conns.map(async (conn) => {
            const otherId = conn.user_id === user!.id ? conn.connected_user_id : conn.user_id;
            const { data: userData } = await supabase
              .from('users')
              .select('full_name, avatar_url')
              .eq('id', otherId)
              .single();
            const { data: candData } = await supabase
              .from('candidates')
              .select('headline, city')
              .eq('id', otherId)
              .single();

            return {
              id: conn.id,
              connected_user_id: otherId,
              full_name: userData?.full_name || 'User',
              headline: candData?.headline,
              city: candData?.city,
              avatar_url: userData?.avatar_url,
              status: conn.status,
              created_at: conn.created_at,
            } as unknown as Connection;
          })
        );
        setConnections(enriched);
      }

      setLoading(false);
    }

    loadConnections();
  }, [isAuthenticated, user?.id]);

  const filtered = connections.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || (c.headline?.toLowerCase().includes(q));
  });

  if (!isAuthenticated && !authLoading) {
    router.push('/auth/login?redirect=/connections');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-[#111] border border-white/[0.06] rounded-lg flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Connections</h1>
          <span className="text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
            {connections.length}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..."
            className="w-full bg-[#111] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-6">
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white mb-1">No connections yet</h3>
            <p className="text-xs text-gray-500">Start building your professional network</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((conn) => (
              <div key={conn.id} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{conn.full_name}</p>
                  {conn.headline && (
                    <p className="text-xs text-gray-500 truncate">{conn.headline}</p>
                  )}
                  {conn.city && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-600 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {conn.city}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  Connected
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav variant={profile?.type === 'employer' ? 'employer' : 'candidate'} />
    </div>
  );
}
