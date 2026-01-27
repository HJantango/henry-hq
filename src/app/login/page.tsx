'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) return;

    const newDigits = [...digits];
    newDigits[index] = value[value.length - 1];
    setDigits(newDigits);
    setError('');

    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (index === 3 || newDigits.every(d => d !== '')) {
      const pin = newDigits.join('');
      if (pin.length === 4) {
        submitPin(pin);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
      setError('');
    }
  };

  const submitPin = async (pin: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        // Hard redirect to ensure cookie is set before middleware checks
        window.location.href = '/';
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setError('Wrong PIN');
        setDigits(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px]" />
      </div>

      <div className={`relative animate-fade-in ${shake ? 'animate-shake' : ''}`}>
        <div className="glass-strong p-10 sm:p-12 w-full max-w-sm text-center space-y-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="text-5xl">🦉</div>
            <h1 className="text-2xl font-bold text-dark-100">Henry HQ</h1>
            <p className="text-dark-400 text-sm">Enter your PIN to continue</p>
          </div>

          {/* PIN inputs */}
          <div className="flex justify-center gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className={`
                  w-14 h-16 text-center text-2xl font-mono font-bold
                  bg-dark-900/80 border rounded-xl outline-none
                  transition-all duration-200
                  focus:border-accent focus:shadow-[0_0_15px_rgba(59,130,246,0.2)]
                  disabled:opacity-50
                  ${error
                    ? 'border-red-500/50 text-red-400'
                    : digit
                      ? 'border-accent/40 text-dark-100'
                      : 'border-white/[0.08] text-dark-100'
                  }
                `}
                autoComplete="off"
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm animate-fade-in">{error}</p>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Subtle gradient border effect */}
        <div className="absolute inset-0 rounded-2xl gradient-border pointer-events-none" />
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
