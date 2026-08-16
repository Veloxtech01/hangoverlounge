export default function SeatGrid({ seats, onSeatClick, pendingSeatNumber }) {
  return (
    <div
      role="list"
      aria-label="Seat status grid"
      className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10"
    >
      {seats.map((seat) => {
        const isAssigned = seat.status === 'assigned';
        const isPending = seat.seatNumber === pendingSeatNumber;
        const label = String(seat.seatNumber).padStart(3, '0');
        const tileContent = (
          <>
            {isAssigned && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-2.5 w-2.5 text-[#C9A867]"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {label}
          </>
        );
        const tileClasses = `flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-md border text-[11px] font-semibold tabular-nums transition-colors duration-200 ${
          isAssigned
            ? 'border-[#C9A867] bg-[#453626] text-[#F0E3CC] shadow-[0_0_10px_-2px_rgba(201,168,103,0.6)]'
            : 'border-[#453626] bg-[#241A15] text-[#9C8F80]'
        }`;

        return (
          <div key={seat.seatNumber} data-status={seat.status} role="listitem">
            {isAssigned ? (
              <button
                type="button"
                onClick={() => onSeatClick?.(seat.seatNumber)}
                disabled={isPending}
                aria-label={`Seat ${label} — assigned. Tap to unassign.`}
                className={`${tileClasses} cursor-pointer hover:bg-[#54432f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A867]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1310] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100`}
              >
                {tileContent}
              </button>
            ) : (
              <div aria-label={`Seat ${label} — available`} className={tileClasses}>
                {tileContent}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
