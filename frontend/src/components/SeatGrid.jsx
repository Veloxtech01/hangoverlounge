export default function SeatGrid({ seats }) {
  return (
    <div
      role="list"
      aria-label="Seat status grid"
      className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10"
    >
      {seats.map((seat) => {
        const isAssigned = seat.status === 'assigned';
        return (
          <div
            key={seat.seatNumber}
            data-status={seat.status}
            role="listitem"
            aria-label={`Seat ${String(seat.seatNumber).padStart(3, '0')} — ${seat.status}`}
            className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-[11px] font-semibold tabular-nums transition-colors duration-200 ${
              isAssigned
                ? 'border-[#C9A867] bg-[#453626] text-[#F0E3CC] shadow-[0_0_10px_-2px_rgba(201,168,103,0.6)]'
                : 'border-[#453626] bg-[#241A15] text-[#9C8F80]'
            }`}
          >
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
            {String(seat.seatNumber).padStart(3, '0')}
          </div>
        );
      })}
    </div>
  );
}
