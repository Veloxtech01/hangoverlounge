import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getTableInvitation } from "../lib/guestApi.js";

const MotionCard = motion.div;

function formatEventDate(value) {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  if (isDateOnly) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  });
}

function HoldingScreen({ message }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-gold [text-shadow:0_0_18px_rgba(250,208,100,0.4)]">
        HANGOVER LOUNGE
      </p>
      <p className="max-w-xs text-sm text-text-muted">{message}</p>
    </div>
  );
}

export default function GuestInvitation() {
  const { tableNumber } = useParams();
  const [status, setStatus] = useState("loading");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getTableInvitation(tableNumber)
      .then((data) => {
        if (cancelled) return;
        if (data.active) {
          setPayload(data);
          setStatus("ready");
        } else {
          setStatus("inactive");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [tableNumber]);

  if (status === "loading") {
    return <HoldingScreen message="Loading your invitation…" />;
  }
  if (status === "invalid") {
    return <HoldingScreen message="This table number isn't recognized." />;
  }
  if (status === "inactive") {
    return <HoldingScreen message="No event right now — check back soon." />;
  }

  const { event, tableNumber: table, drinks } = payload;
  const tableLabel = String(table).padStart(3, "0");
  const formattedDate = formatEventDate(event.eventDate);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-black px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-72 w-72 rounded-full bg-bg-primary/50 blur-3xl" />
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
            className="h-6 w-6 shrink-0 text-gold"
          >
            <path d="M4 4h16" />
            <path d="M4 4l8 8 8-8" />
            <path d="M12 12v8" />
            <path d="M8 20h8" />
          </svg>
          <p className="text-lg font-semibold tracking-[0.2em] text-gold [text-shadow:0_0_18px_rgba(250,208,100,0.4)]">
            HANGOVER LOUNGE
          </p>
        </div>
        <p className="mb-8 text-xs uppercase tracking-[0.35em] text-text-muted">
          Liquid Therapy
        </p>

        <MotionCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full overflow-hidden rounded-2xl border border-bg-warm bg-bg-dark shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
        >
          <div className="flex flex-col items-center gap-1.5 px-6 pt-7 pb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted">
              You&rsquo;re Invited To
            </p>
            <h1 className="text-2xl font-semibold text-text-cream [text-shadow:0_0_16px_rgba(250,232,191,0.3)]">
              {event.name}
            </h1>
            {event.tagline && (
              <p className="text-xs italic text-text-muted">{event.tagline}</p>
            )}
            <div className="mt-3 flex flex-col gap-0.5 text-sm text-text-primary/90">
              {formattedDate && <span>{formattedDate}</span>}
              {event.venue && <span>{event.venue}</span>}
            </div>
          </div>

          <div aria-hidden="true" className="relative flex items-center">
            <div className="-ml-3 h-6 w-6 shrink-0 rounded-full bg-black" />
            <div className="h-px flex-1 border-t border-dashed border-bg-warm" />
            <div className="-mr-3 h-6 w-6 shrink-0 rounded-full bg-black" />
          </div>

          <div className="flex flex-col items-center gap-1.5 px-6 py-7">
            <p className="text-xs uppercase tracking-[0.35em] text-text-muted">
              Your Table
            </p>
            <p className="text-5xl font-bold tracking-widest text-pink [text-shadow:0_0_30px_rgba(253,46,134,0.5)]">
              Table {tableLabel}
            </p>
          </div>

          <div aria-hidden="true" className="relative flex items-center">
            <div className="-ml-3 h-6 w-6 shrink-0 rounded-full bg-black" />
            <div className="h-px flex-1 border-t border-dashed border-bg-warm" />
            <div className="-mr-3 h-6 w-6 shrink-0 rounded-full bg-black" />
          </div>

          <div className="flex flex-col gap-3 px-6 py-6 text-left">
            <p className="text-center text-xs uppercase tracking-[0.3em] text-text-muted">
              Drinks On The Menu
            </p>
            <ul className="flex flex-col gap-3">
              {drinks.map((drink, index) => (
                <li
                  key={`${drink.category ?? ""}-${drink.name}-${drink.price}-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-bg-warm/60 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col">
                    {drink.category && (
                      <span className="text-[10px] uppercase tracking-wide text-text-muted">
                        {drink.category}
                      </span>
                    )}
                    <span className="truncate text-sm font-medium text-text-cream">
                      {drink.name}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border border-gold/60 bg-bg-warm px-3 py-1 text-xs font-semibold tracking-wide text-gold">
                    ₦{drink.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </MotionCard>

        <p className="mt-6 text-[11px] tracking-wide text-gray-400">
          Screenshot this page and show it at the door.
        </p>
      </div>
    </div>
  );
}
