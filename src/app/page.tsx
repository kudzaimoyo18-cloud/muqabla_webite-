import Link from 'next/link';
import { Video, ArrowRight, Zap, Shield, Globe, Play, Users, Briefcase, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">Muqabla</span>
        </div>
        <Link
          href="/auth/login"
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 max-w-4xl mx-auto text-center">
        <div className="relative inline-block mb-8">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-3xl" />
          <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
            The Future of{' '}
            <span className="text-emerald-400">Video Interviews</span>
            {' '}in the GCC
          </h1>
        </div>
        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Record once, apply everywhere. Your video is your resume. Connect with top employers
          across the UAE, Saudi Arabia, Qatar, and beyond.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors text-base"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white font-medium rounded-xl transition-colors text-base"
          >
            Sign In
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: '3x', label: 'Faster Hiring' },
            { value: '85%', label: 'Match Rate' },
            { value: 'Zero', label: 'CV Required' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">How It Works</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">Three simple steps to your next opportunity</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Video,
              step: '01',
              title: 'Record Your Video',
              desc: 'Create a 60-second video intro showcasing your personality and skills. One video for all applications.',
            },
            {
              icon: Globe,
              step: '02',
              title: 'Discover Jobs',
              desc: 'Swipe through job opportunities from top GCC employers. Watch their video intros to find the right fit.',
            },
            {
              icon: Zap,
              step: '03',
              title: 'Apply Instantly',
              desc: 'Swipe left to apply instantly with your video profile. No cover letters, no lengthy forms.',
            },
          ].map((card) => (
            <div
              key={card.step}
              className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-500/20 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <card.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-mono text-emerald-400/60">STEP {card.step}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Play, title: 'Video-First', desc: 'Show who you really are beyond a CV' },
            { icon: Shield, title: 'Verified Companies', desc: 'All employers verified with trade licenses' },
            { icon: Users, title: 'GCC Focused', desc: 'Built for UAE, Saudi, Qatar, Kuwait, Bahrain, Oman' },
            { icon: Briefcase, title: 'Instant Apply', desc: 'Swipe to apply — your video speaks for you' },
          ].map((feature) => (
            <div key={feature.title} className="bg-[#111] border border-white/[0.06] rounded-xl p-5 text-center">
              <feature.icon className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interview Preview */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-emerald-400 ml-1" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
              See How It Feels
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              A TikTok-style feed where every job posting comes alive with video.
              Swipe through opportunities like never before.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors text-sm"
            >
              Try It Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to Transform Your Job Search?
        </h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
          Join thousands of candidates and employers across the GCC who are hiring differently.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Muqabla</span>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Muqabla. Built for the GCC region.</p>
        </div>
      </footer>
    </div>
  );
}
