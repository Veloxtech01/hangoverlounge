import { Navigate, useLocation } from 'react-router-dom';

function formatEventDate(value) {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function GuestInvitation() {
  const { state } = useLocation();

  if (!state) {
    return <Navigate to="/" replace />;
  }

  const { event, seatNumber, drinks } = state;
  const seatLabel = String(seatNumber).padStart(3, '0');
  const formattedDate = formatEventDate(event.eventDate);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-[#1A1310] px-6 py-12">
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
            className="h-6 w-6 shrink-0 text-[#C9A867]"
          >
            <path d="M4 4h16" />
            <path d="M4 4l8 8 8-8" />
            <path d="M12 12v8" />
            <path d="M8 20h8" />
          </svg>
          <p className="text-lg font-semibold tracking-[0.2em] text-[#F0E3CC] [text-shadow:0_0_18px_rgba(240,227,204,0.35)]">
            HANGOVER LOUNGE
          </p>
        </div>
        <p className="mb-8 text-xs uppercase tracking-[0.35em] text-[#9C8F80]">
          Liquid Therapy
        </p>

        <div className="w-full overflow-hidden rounded-2xl border border-[#453626] bg-[#241A15] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col items-center gap-1.5 px-6 pt-7 pb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#9C8F80]">
              You&rsquo;re Invited To
            </p>
            <h1 className="text-2xl font-semibold text-[#F0E3CC] [text-shadow:0_0_16px_rgba(240,227,204,0.3)]">
              {event.name}
            </h1>
            {event.tagline && (
              <p className="text-xs italic text-[#9C8F80]">{event.tagline}</p>
            )}
            <div className="mt-3 flex flex-col gap-0.5 text-sm text-[#D9CBAF]">
              {formattedDate && <span>{formattedDate}</span>}
              {event.venue && <span>{event.venue}</span>}
            </div>
          </div>

          <div aria-hidden="true" className="relative flex items-center">
            <div className="-ml-3 h-6 w-6 shrink-0 rounded-full bg-[#1A1310]" />
            <div className="h-px flex-1 border-t border-dashed border-[#6B5842]" />
            <div className="-mr-3 h-6 w-6 shrink-0 rounded-full bg-[#1A1310]" />
          </div>

          <div className="flex flex-col items-center gap-1.5 px-6 py-7">
            <p className="text-xs uppercase tracking-[0.35em] text-[#9C8F80]">
              Your Seat
            </p>
            <p className="text-5xl font-bold tracking-widest text-[#F0E3CC] [text-shadow:0_0_30px_rgba(240,227,204,0.45)]">
              Seat {seatLabel}
            </p>
          </div>

          <div aria-hidden="true" className="relative flex items-center">
            <div className="-ml-3 h-6 w-6 shrink-0 rounded-full bg-[#1A1310]" />
            <div className="h-px flex-1 border-t border-dashed border-[#6B5842]" />
            <div className="-mr-3 h-6 w-6 shrink-0 rounded-full bg-[#1A1310]" />
          </div>

          <div className="flex flex-col gap-3 px-6 py-6 text-left">
            <p className="text-center text-xs uppercase tracking-[0.3em] text-[#9C8F80]">
              Drinks On The House
            </p>
            <ul className="flex flex-col gap-3">
              {drinks.map((drink) => (
                <li
                  key={drink.name}
                  className="flex items-center justify-between gap-3 border-b border-[#453626]/60 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col">
                    {drink.category && (
                      <span className="text-[10px] uppercase tracking-wide text-[#9C8F80]">
                        {drink.category}
                      </span>
                    )}
                    <span className="truncate text-sm font-medium text-[#F0E3CC]">
                      {drink.name}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#6B5842] bg-[#453626] px-3 py-1 text-xs font-semibold tracking-wide text-[#F0E3CC]">
                    ₦{drink.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 text-[11px] tracking-wide text-[#6B5842]">
          Screenshot this page and show it at the door.
        </p>
      </div>
    </div>
  );
}
