import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { redeemCode } from "../lib/guestApi.js";

export default function GuestEntry() {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const result = await redeemCode(code);
      navigate("/invitation", { state: result });
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#1A1310] px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-72 w-72 rounded-full bg-[#F0E3CC]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-2 flex items-center gap-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 shrink-0 text-[#C9A867]"
          >
            <path d="M4 4h16" />
            <path d="M4 4l8 8 8-8" />
            <path d="M12 12v8" />
            <path d="M8 20h8" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-[0.2em] text-[#F0E3CC] [text-shadow:0_0_18px_rgba(240,227,204,0.35)]">
            HANGOVER LOUNGE
          </h1>
        </div>
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-[#9C8F80]">
          Liquid Therapy
        </p>

        <div aria-hidden="true" className="mb-8 h-px w-16 bg-[#6B5842]" />

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2 text-left">
            <label
              htmlFor="invitation-code"
              className="text-xs uppercase tracking-[0.2em] text-[#9C8F80]"
            >
              Enter your invitation code
            </label>
            <input
              id="invitation-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              inputMode="numeric"
              maxLength={6}
              placeholder="e.g. 048213"
              className="w-full rounded-lg border border-[#453626] bg-[#241A15] px-4 py-3.5 text-base tracking-widest text-[#F0E3CC] outline-none transition-colors duration-200 placeholder:text-[#6B5842] focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full cursor-pointer rounded-full border border-[#6B5842] bg-[#453626] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Checking…" : "Enter"}
          </button>
        </form>

        {/* <Link
          to="/admin/login"
          className="mt-10 text-[10px] uppercase tracking-[0.3em] text-[#6B5842] transition-colors duration-200 hover:text-[#9C8F80]"
        >
          Admin
        </Link> */}
      </div>
    </div>
  );
}
