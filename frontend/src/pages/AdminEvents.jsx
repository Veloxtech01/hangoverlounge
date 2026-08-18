import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listEvents, createEvent, activateEvent } from '../lib/adminApi.js';
import AdminHeader from '../components/AdminHeader.jsx';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await listEvents();
      setEvents(data);
    } catch {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await createEvent({
        name: values.name,
        tagline: values.tagline || undefined,
        eventDate: `${values.eventDate}:00+01:00`,
        venue: values.venue,
      });
      toast.success('Event created.');
      reset();
      await loadEvents();
    } catch {
      toast.error('Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivate(id) {
    setActivatingId(id);
    try {
      await activateEvent(id);
      await loadEvents();
    } catch {
      toast.error('Failed to activate event.');
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#1A1310] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AdminHeader subtitle="Manage Events" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 rounded-2xl border border-[#453626] bg-[#241A15] p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-name" className="sr-only">
                Event name
              </label>
              <input
                id="event-name"
                placeholder="Event name"
                disabled={submitting}
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-3.5 py-3 text-sm text-[#F0E3CC] outline-none transition-colors duration-200 placeholder:text-[#9C8F80] focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
                {...register('name', { required: true })}
              />
              {errors.name && <span className="text-[11px] text-[#C9A867]">Required</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-tagline" className="sr-only">
                Tagline
              </label>
              <input
                id="event-tagline"
                placeholder="Tagline (optional)"
                disabled={submitting}
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-3.5 py-3 text-sm text-[#F0E3CC] outline-none transition-colors duration-200 placeholder:text-[#9C8F80] focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
                {...register('tagline')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="event-date"
                className="text-[11px] uppercase tracking-[0.2em] text-[#9C8F80]"
              >
                Date &amp; time (WAT)
              </label>
              <input
                id="event-date"
                type="datetime-local"
                disabled={submitting}
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-3.5 py-3 text-sm text-[#F0E3CC] outline-none transition-colors duration-200 focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
                {...register('eventDate', { required: true })}
              />
              {errors.eventDate && <span className="text-[11px] text-[#C9A867]">Required</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-venue" className="sr-only">
                Venue
              </label>
              <input
                id="event-venue"
                placeholder="Venue"
                disabled={submitting}
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-3.5 py-3 text-sm text-[#F0E3CC] outline-none transition-colors duration-200 placeholder:text-[#9C8F80] focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
                {...register('venue', { required: true })}
              />
              {errors.venue && <span className="text-[11px] text-[#C9A867]">Required</span>}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer self-start rounded-full border border-[#6B5842] bg-[#453626] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create event'}
          </button>
        </form>

        {loading ? (
          <p className="text-center text-sm text-[#9C8F80]">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="text-center text-sm text-[#9C8F80]">No events yet — create one above.</p>
        ) : (
          <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5">
            <ul className="flex flex-col divide-y divide-[#453626]/60">
              {events.map((event) => (
                <li
                  key={event._id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="truncate text-sm font-medium text-[#F0E3CC]">
                    {event.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    {event.isActive ? (
                      <span className="rounded-full border border-[#6B5842] bg-[#453626] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#F0E3CC]">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivate(event._id)}
                        disabled={activatingId === event._id}
                        className="cursor-pointer text-xs font-medium uppercase tracking-[0.15em] text-[#9C8F80] transition-colors duration-200 hover:text-[#F0E3CC] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {activatingId === event._id ? 'Activating…' : 'Activate'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
