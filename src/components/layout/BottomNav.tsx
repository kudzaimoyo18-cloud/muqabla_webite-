'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageSquare, User, Plus, Users, LayoutDashboard } from 'lucide-react';

const candidateNav = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/search', label: 'Discover', icon: Search },
  { href: '/messages', label: 'Inbox', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

const employerNav = [
  { href: '/employer/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/employer/post-job', label: 'Post', icon: Plus },
  { href: '/employer/candidates', label: 'Candidates', icon: Users },
  { href: '/messages', label: 'Inbox', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav({ variant = 'candidate' }: { variant?: 'candidate' | 'employer' }) {
  const pathname = usePathname();
  const items = variant === 'employer' ? employerNav : candidateNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <div className="w-1 h-1 bg-emerald-400 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
