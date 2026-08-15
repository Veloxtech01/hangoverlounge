import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listEvents, listDrinks, createDrink, deleteDrink } from '../lib/adminApi.js';

export default function AdminDrinks() {
  const [eventId, setEventId] = useState(null);
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    async function loadDrinks() {
      try {
        const events = await listEvents();
        const active = events.find((e) => e.isActive);
        if (!active) {
          return;
        }
        setEventId(active._id);
        const data = await listDrinks(active._id);
        setDrinks(data);
      } catch {
        toast.error('Failed to load drinks.');
      } finally {
        setLoading(false);
      }
    }
    loadDrinks();
  }, []);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const drink = await createDrink(eventId, {
        category: values.category,
        name: values.name,
        price: Number(values.price),
        order: drinks.length,
      });
      setDrinks((prev) => [...prev, drink]);
      reset();
      toast.success('Drink added.');
    } catch {
      toast.error('Failed to add drink.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await deleteDrink(id);
    setDrinks((prev) => prev.filter((d) => d._id !== id));
  }

  return (
    <div className="min-h-screen w-full bg-[#1A1310] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#F0E3CC]">
            HANGOVER LOUNGE
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#9C8F80]">
            Drinks Management
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-[#453626] bg-[#241A15] p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1.4fr_1fr_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="drink-category" className="sr-only">
                Category
              </label>
              <input
                id="drink-category"
                placeholder="Category"
                disabled={submitting}
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-3.5 py-3 text-sm text-[#F0E3CC] outline-none transition-colors duration-200 placeholder:text-[#9C8F80] focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
                {...register('category', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="drink-name" className="sr-only">
                Name
              </label>
              <input
                id="drink-name"
                placeholder="Name"
                disabled={submitting}
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-3.5 py-3 text-sm text-[#F0E3CC] outline-none transition-colors duration-200 placeholder:text-[#9C8F80] focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
                {...register('name', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="drink-price" className="sr-only">
                Price
              </label>
              <input
                id="drink-price"
                placeholder="Price"
                type="number"
                inputMode="numeric"
                min="0"
                disabled={submitting}
                className="w-full rounded-lg border border-[#453626] bg-[#1A1310] px-3.5 py-3 text-sm text-[#F0E3CC] outline-none transition-colors duration-200 placeholder:text-[#9C8F80] focus:border-[#6B5842] focus:ring-2 focus:ring-[#6B5842]/60 disabled:opacity-50"
                {...register('price', { required: true })}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-full border border-[#6B5842] bg-[#453626] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add drink'}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-center text-sm text-[#9C8F80]">Loading drinks…</p>
        ) : (
          <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5">
            {drinks.length === 0 ? (
              <p className="text-center text-sm text-[#9C8F80]">
                No drinks yet — add the first one above.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-[#453626]/60">
                {drinks.map((drink) => (
                  <li
                    key={drink._id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#9C8F80]">
                        {drink.category}
                      </span>
                      <span className="truncate text-sm font-medium text-[#F0E3CC]">
                        {drink.name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full border border-[#6B5842] bg-[#453626] px-3 py-1 text-xs font-semibold text-[#F0E3CC]">
                        ₦{drink.price.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(drink._id)}
                        className="cursor-pointer text-xs font-medium uppercase tracking-[0.15em] text-[#9C8F80] transition-colors duration-200 hover:text-[#F0E3CC]"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
