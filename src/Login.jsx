import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Factory, Lock, Mail, KeyRound, Shield, User, RefreshCw, ShieldCheck } from 'lucide-react';
import { api, saveSession } from './api';

const CAPTCHA_LENGTH = 6;
const CAPTCHA_WIDTH = 168;
const CAPTCHA_HEIGHT = 44;

function generateCaptcha() {
  const values = new Uint32Array(CAPTCHA_LENGTH);
  window.crypto.getRandomValues(values);
  return Array.from(values, (v) => (v % 10).toString()).join('');
}

function drawCaptcha(canvas, code) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = CAPTCHA_WIDTH * ratio;
  canvas.height = CAPTCHA_HEIGHT * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);

  const ink = '#065f46';
  const noise = 'rgba(6, 95, 70, 0.35)';

  ctx.strokeStyle = noise;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * CAPTCHA_WIDTH, Math.random() * CAPTCHA_HEIGHT);
    ctx.bezierCurveTo(
      Math.random() * CAPTCHA_WIDTH, Math.random() * CAPTCHA_HEIGHT,
      Math.random() * CAPTCHA_WIDTH, Math.random() * CAPTCHA_HEIGHT,
      Math.random() * CAPTCHA_WIDTH, Math.random() * CAPTCHA_HEIGHT,
    );
    ctx.stroke();
  }

  ctx.fillStyle = noise;
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * CAPTCHA_WIDTH, Math.random() * CAPTCHA_HEIGHT, 1.5, 1.5);
  }

  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const step = (CAPTCHA_WIDTH - 24) / code.length;
  code.split('').forEach((digit, index) => {
    ctx.save();
    ctx.translate(12 + step * index + step / 2, CAPTCHA_HEIGHT / 2 + (Math.random() * 8 - 4));
    ctx.rotate((Math.random() - 0.5) * 0.6);
    ctx.font = `bold ${20 + Math.floor(Math.random() * 6)}px ui-monospace, monospace`;
    ctx.fillText(digit, 0, 0);
    ctx.restore();
  });
}

function NumberCaptcha({ code, value, onValueChange, onRefresh, invalid }) {
  const canvasRef = useRef(null);

  const redraw = useCallback(() => {
    if (canvasRef.current && code) drawCaptcha(canvasRef.current, code);
  }, [code]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="captcha" className="text-sm font-medium text-emerald-950">Security Check</label>
      <div className="flex items-center gap-2">
        <div className="flex h-11 min-w-0 items-center overflow-hidden rounded-lg border border-dashed border-emerald-800/40 bg-emerald-50 px-1">
          <canvas ref={canvasRef} role="img" aria-label="Numeric captcha" style={{ width: CAPTCHA_WIDTH, height: CAPTCHA_HEIGHT - 6 }} className="max-w-full select-none" />
        </div>
        <button type="button" onClick={onRefresh} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-900/15 text-emerald-900/60 transition-colors hover:bg-emerald-50 hover:text-emerald-800 bg-white">
          <RefreshCw className="size-4" />
        </button>
      </div>
      <div className="relative">
        <ShieldCheck className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-900/40" />
        <input
          id="captcha"
          inputMode="numeric"
          autoComplete="off"
          maxLength={CAPTCHA_LENGTH}
          placeholder={`Enter ${CAPTCHA_LENGTH} digits`}
          value={value}
          onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ''))}
          required
          className="h-11 w-full rounded-lg border border-emerald-900/15 bg-white pl-9 pr-3 text-sm text-emerald-950 placeholder:text-emerald-900/40 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none font-mono tracking-[0.2em]"
        />
      </div>
      {invalid && <p className="text-xs font-medium text-red-600">Incorrect security code. Please try again.</p>}
    </div>
  );
}

export default function Login() {
  const [role, setRole] = useState('entrepreneur');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaInvalid, setCaptchaInvalid] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCaptchaCode(generateCaptcha());
  }, []);

  function refreshCaptcha() {
    setCaptchaCode(generateCaptcha());
    setCaptchaValue('');
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (captchaValue !== captchaCode) {
      setCaptchaInvalid(true);
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      // Prototype mode: koi bhi email/password chalega
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password, role, name },
      });

      if (data.user.role !== role) {
        setError(
          role === 'officer'
            ? 'This email belongs to an Entrepreneur account. Use a different email for Officer login.'
            : 'This email belongs to an Officer account. Use a different email for Entrepreneur login.'
        );
        refreshCaptcha();
        return;
      }

      saveSession(data);

      if (data.user.role === 'entrepreneur') {
        // Pehle purana flag saaf karo
        localStorage.removeItem('isOnboarded');
        localStorage.removeItem('businessProfile');

        const res = await api('/businesses/me');
        if (res.business && !isRegister) {
            localStorage.setItem('roadmapSeen', 'true');
          const b = res.business;
          localStorage.setItem(
            'businessProfile',
            JSON.stringify({
              businessName: b.business_name,
              industry: b.industry,
              location: b.location,
              projectSize: b.project_size,
              stage: b.stage,
            })
          );
          localStorage.setItem('isOnboarded', 'true');
        }
      }

      window.location.reload();
    } catch (err) {
      setError(err.message);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-emerald-900/15 bg-white pl-9 pr-3 text-sm text-emerald-950 placeholder:text-emerald-900/40 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f4faf6] font-sans px-4 py-8">
      {/* Top Brand Header */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-800 text-white shadow-md">
          <Factory className="size-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-emerald-950">Avyra &middot; SIH26130</h1>
          <p className="text-xs text-emerald-900/60">Smart Industrial Approval Platform</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-xl shadow-emerald-900/5 mt-12 sm:mt-0">
        <div className="border-b border-emerald-900/10 px-6 pt-6 pb-5 bg-emerald-50/50">
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-emerald-800/10 text-emerald-800">
            <Lock className="size-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-emerald-950">
            {role === 'entrepreneur'
              ? isRegister ? 'Entrepreneur Registration' : 'Entrepreneur Sign In'
              : 'Govt. Officer Sign In'}
          </h2>
          <p className="text-sm text-emerald-900/60 mt-1">
            {role === 'entrepreneur'
              ? 'Apply for clearances, upload documents, and track status.'
              : 'Review applications, verify documents, and manage SLAs.'}
          </p>
        </div>

        <div className="p-6">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-emerald-50 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setRole('entrepreneur'); setError(''); }}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-all ${role === 'entrepreneur' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
            >
              <User className="size-4" /> Entrepreneur
            </button>
            <button
              type="button"
              onClick={() => { setRole('officer'); setIsRegister(false); setError(''); }}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-all ${role === 'officer' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
            >
              <Shield className="size-4" /> Govt Officer
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {isRegister && role === 'entrepreneur' && (
              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-900/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-emerald-950 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-900/40" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'entrepreneur' ? 'name@enterprise.com' : 'officer@industry.gov.in'}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-950 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-900/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Any password (demo)"
                  className={inputClass}
                />
              </div>
            </div>

            <NumberCaptcha
              code={captchaCode}
              value={captchaValue}
              onValueChange={(val) => { setCaptchaValue(val); if (captchaInvalid) setCaptchaInvalid(false); }}
              onRefresh={refreshCaptcha}
              invalid={captchaInvalid}
            />

            {error && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-lg bg-emerald-800 text-sm font-bold text-white transition hover:bg-emerald-900 shadow-md shadow-emerald-900/10 disabled:opacity-60"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Secure Login'}
            </button>

            {role === 'entrepreneur' && (
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="w-full text-center text-sm font-medium text-emerald-800 hover:underline"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </button>
            )}

            <p className="text-center text-xs text-emerald-900/60">
              Prototype mode: any email and password will work.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}