import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getCodes } from '../lib/adminApi.js';
import { useActiveEvent } from '../hooks/useActiveEvent.js';
import AdminHeader from '../components/AdminHeader.jsx';

function downloadCodesCsv(codes) {
  const header = 'code,redeemed,seatNumber\n';
  const rows = codes
    .map((c) => `${c.code},${c.seatNumber ? 'yes' : 'no'},${c.seatNumber ?? ''}`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hangover-lounge-invitation-codes.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminCodes() {
  const { eventId, loading: eventLoading, error: eventError } = useActiveEvent();
  const [codes, setCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesError, setCodesError] = useState(false);
  const loading = eventLoading || codesLoading;

  useEffect(() => {
    if (eventError) {
      toast.error('Failed to load codes.');
    }
  }, [eventError]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function loadCodes() {
      setCodesLoading(true);
      setCodesError(false);
      try {
        const data = await getCodes(eventId);
        if (!cancelled) {
          setCodes(data);
        }
      } catch {
        if (!cancelled) {
          setCodesError(true);
          toast.error('Failed to load codes.');
        }
      } finally {
        if (!cancelled) {
          setCodesLoading(false);
        }
      }
    }

    loadCodes();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <div className="min-h-screen w-full bg-[#1A1310] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AdminHeader subtitle="Invitation Codes" />

        {loading ? (
          <p className="text-center text-sm text-[#9C8F80]">Loading codes…</p>
        ) : !eventId ? (
          <p className="text-center text-sm text-[#9C8F80]">
            {eventError ? 'Failed to load event data.' : 'No active event configured.'}
          </p>
        ) : codesError ? (
          <p className="text-center text-sm text-[#9C8F80]">Failed to load codes.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C8F80]">
                {codes.length} code{codes.length === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                onClick={() => downloadCodesCsv(codes)}
                disabled={codes.length === 0}
                className="cursor-pointer rounded-full border border-[#6B5842] bg-[#453626] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Download CSV
              </button>
            </div>

            <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5">
              {codes.length === 0 ? (
                <p className="text-center text-sm text-[#9C8F80]">No codes for this event.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[#453626]/60">
                  {codes.map((c) => (
                    <li
                      key={c.code}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="font-mono text-sm font-medium text-[#F0E3CC]">
                        {c.code}
                      </span>
                      <div className="flex shrink-0 items-center gap-3">
                        {c.seatNumber ? (
                          <span className="text-xs text-[#9C8F80]">
                            Seat {String(c.seatNumber).padStart(3, '0')}
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                            c.seatNumber
                              ? 'border-[#6B5842] bg-[#453626] text-[#F0E3CC]'
                              : 'border-[#453626] text-[#9C8F80]'
                          }`}
                        >
                          {c.seatNumber ? 'Redeemed' : 'Not redeemed'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
