import { useEffect, useState } from 'react';
import { listEvents, getSeats } from '../lib/adminApi.js';
import SeatGrid from '../components/SeatGrid.jsx';

export default function AdminDashboard() {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEvents().then((events) => {
      const active = events.find((e) => e.isActive);
      if (!active) {
        setLoading(false);
        return;
      }
      getSeats(active._id).then((data) => {
        setSeats(data);
        setLoading(false);
      });
    });
  }, []);

  const assignedCount = seats.filter((s) => s.status === 'assigned').length;
  const totalCount = seats.length;
  const percentAssigned = totalCount ? Math.round((assignedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen w-full bg-[#1A1310] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#F0E3CC]">
            HANGOVER LOUNGE
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#9C8F80]">
            Seat Status
          </p>
        </div>

        <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-lg font-semibold text-[#F0E3CC]">
                {assignedCount} / {totalCount} seats assigned
              </p>
              <span className="text-xs font-medium tracking-wide text-[#9C8F80]">
                {percentAssigned}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#453626]">
              <div
                className="h-full rounded-full bg-[#C9A867] transition-[width] duration-300"
                style={{ width: `${percentAssigned}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-[#453626]/60 pt-4 text-[11px] text-[#9C8F80]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-[#453626] bg-[#241A15]" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-[#C9A867] bg-[#453626]" />
              Assigned
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-[#9C8F80]">Loading seats…</p>
        ) : (
          <SeatGrid seats={seats} />
        )}
      </div>
    </div>
  );
}
