import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-[#1A1310] px-6 py-12 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-[#F0E3CC]">
        HANGOVER LOUNGE
      </p>
      <p className="text-xs uppercase tracking-[0.35em] text-[#9C8F80]">
        Page not found
      </p>
      <Link
        to="/"
        className="mt-4 rounded-full border border-[#6B5842] bg-[#453626] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f]"
      >
        Back to entry
      </Link>
    </div>
  );
}
