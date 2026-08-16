import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { login } from '../lib/adminApi.js';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(password);
      navigate('/admin');
    } catch {
      toast.error('Incorrect password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#1A1310] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#F0E3CC]">
            HANGOVER LOUNGE
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[#9C8F80]">
            Admin
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-[#453626] bg-[#241A15] p-6"
        >
          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="admin-password"
              className="text-xs uppercase tracking-[0.2em] text-[#9C8F80]"
            >
              Admin password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-4 py-3.5 pr-12 text-base text-[#F0E3CC] outline-none transition-colors duration-200 focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={submitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#9C8F80] transition-colors duration-200 hover:text-[#F0E3CC] disabled:opacity-50"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full cursor-pointer rounded-full border border-[#6B5842] bg-[#453626] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
