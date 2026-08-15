import { useEffect, useState } from 'react';
import { listEvents } from '../lib/adminApi.js';

/**
 * Loads the admin's list of events and resolves the active one.
 * Returns { eventId, loading, error } — eventId is null when there is no
 * active event OR the fetch failed; error is a boolean flag so callers can
 * distinguish "no active event" from "fetch succeeded with zero events".
 */
export function useActiveEvent() {
  const [eventId, setEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveEvent() {
      try {
        const events = await listEvents();
        const active = events.find((e) => e.isActive);
        if (!cancelled) {
          setEventId(active ? active._id : null);
        }
      } catch {
        if (!cancelled) {
          setError(true);
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

  return { eventId, loading, error };
}
