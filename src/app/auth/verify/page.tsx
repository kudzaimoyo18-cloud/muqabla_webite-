'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, Loader2, Mail } from 'lucide-react';
import { verifyOtp, signInWithOtp } from '@/lib/supabase/helpers';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || '/feed';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const chars = value.slice(0, 6).split('');
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (newCode.every((c) => c !== '')) {
        submitCode(newCode.join(''));
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c !== '')) {
      submitCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const { error: verifyError } = await verifyOtp(email, token);
      if (verifyError) throw verifyError;
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await signInWithOtp(email);
      setResendCooldown(60);
    } catch {
      setError('Failed to resend code');
    }
  };

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="w-7 h-7 text-emerald-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Enter verification code</h1>
      <p className="text-gray-400 text-sm mb-8">
        We sent a code to <span className="text-white">{email}</span>
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      <div className="flex justify-center gap-3 mb-8">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-14 bg-[#111] border border-white/[0.06] rounded-lg text-center text-xl font-semibold text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
          />
        ))}
      </div>

      {loading && <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mx-auto mb-4" />}

      <button
        onClick={handleResend}
        disabled={resendCooldown > 0}
        className="text-sm text-gray-500 hover:text-emerald-400 disabled:text-gray-700 transition-colors"
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold text-white tracking-tight">Muqabla</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="text-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" /></div>}>
            <VerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
