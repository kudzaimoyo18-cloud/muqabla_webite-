'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Briefcase, CheckCircle, UserCheck, MessageSquare, Loader2, ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';
import BottomNav from '@/components/layout/BottomNav';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  application_received: Briefcase,
  application_accepted: CheckCircle,
  application_rejected: Briefcase,
  profile_viewed: UserCheck,
  new_message: MessageSquare,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    async function loadNotifications() {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications((data as unknown as Notification[]) || []);
      setLoading(false);

      // Mark all as read
      if (data && data.length > 0) {
        const unreadIds = data.filter((n) => !n.is_read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }
    }

    loadNotifications();
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated && !authLoading) {
    router.push('/auth/login?redirect=/notifications');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/[0.06]">
        <button onClick={() => router.back()} className="w-9 h-9 bg-[#111] border border-white/[0.06] rounded-lg flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Notifications</h1>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 px-6">
            <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white mb-1">No notifications</h3>
            <p className="text-xs text-gray-500">You&apos;re all caught up</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {notifications.map((notif) => {
              const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
              return (
                <div
                  key={notif.id}
                  className={`px-4 py-3.5 flex items-start gap-3 ${!notif.is_read ? 'bg-emerald-500/[0.03]' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    !notif.is_read ? 'bg-emerald-500/10' : 'bg-white/[0.04]'
                  }`}>
                    <Icon className={`w-4 h-4 ${!notif.is_read ? 'text-emerald-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold text-white' : 'font-medium text-gray-300'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-emerald-400 rounded-full shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav variant={profile?.type === 'employer' ? 'employer' : 'candidate'} />
    </div>
  );
}
