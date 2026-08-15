import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSeats } from '../lib/adminApi.js';
import { useActiveEvent } from '../hooks/useActiveEvent.js';
import SeatGrid from '../components/SeatGrid.jsx';
import AdminHeader from '../components/AdminHeader.jsx';

export default function AdminDashboard() {
  const { eventId, loading: eventLoading, error: eventError } = useActiveEvent();
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState(false);

  useEffect(() => {
    if (eventError) {
      toast.error('Failed to load seat status.');
    }
  }, [eventError]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function loadSeats() {
      setSeatsLoading(true);
      try {
        const data = await getSeats(eventId);
        if (!cancelled) {
          setSeats(data);
        }
      } catch {
        if (!cancelled) {
          setSeatsError(true);
          toast.error('Failed to load seat status.');
        }
      } finally {
        if (!cancelled) {
          setSeatsLoading(false);
        }
      }
    }

    loadSeats();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const loading = eventLoading || seatsLoading;
  const assignedCount = seats.filter((s) => s.status === 'assigned').length;
  const totalCount = seats.length;
  const percentAssigned = totalCount ? Math.round((assignedCount / totalCount) * 100) : 0;
  const hasActiveEvent = Boolean(eventId);

  return (
    <div className="min-h-screen w-full bg-[#1A1310] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AdminHeader subtitle="Seat Status" />

        {!eventLoading && !hasActiveEvent ? (
          <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5 text-center text-sm text-[#9C8F80]">
            {eventError ? 'Failed to load event data.' : 'No active event configured.'}
          </div>
        ) : (
          <>
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
            ) : seatsError ? (
              <p className="text-center text-sm text-[#9C8F80]">Failed to load seat status.</p>
            ) : (
              <SeatGrid seats={seats} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
