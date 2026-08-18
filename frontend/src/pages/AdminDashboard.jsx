import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listEvents } from '../lib/adminApi.js';
import AdminHeader from '../components/AdminHeader.jsx';

function formatEventDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminDashboard() {
  const [activeEvent, setActiveEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveEvent() {
      setLoading(true);
      try {
        const events = await listEvents();
        if (!cancelled) {
          setActiveEvent(events.find((e) => e.isActive) || null);
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load event data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActiveEvent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#1A1310] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AdminHeader subtitle="Dashboard" />

        {loading ? (
          <p className="text-center text-sm text-[#9C8F80]">Loading event…</p>
        ) : activeEvent ? (
          <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9C8F80]">Active Event</p>
            <p className="mt-2 text-lg font-semibold text-[#F0E3CC]">{activeEvent.name}</p>
            <div className="mt-1 flex flex-col gap-0.5 text-sm text-[#9C8F80]">
              {activeEvent.eventDate && <span>{formatEventDate(activeEvent.eventDate)}</span>}
              {activeEvent.venue && <span>{activeEvent.venue}</span>}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5 text-center text-sm text-[#9C8F80]">
            No active event configured.
          </div>
        )}

        <Link
          to="/admin/events"
          className="self-start rounded-full border border-[#6B5842] bg-[#453626] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f]"
        >
          Manage Events
        </Link>
      </div>
    </div>
  );
}
