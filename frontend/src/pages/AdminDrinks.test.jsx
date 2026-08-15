import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDrinks from './AdminDrinks.jsx';
import { listEvents, listDrinks, createDrink, deleteDrink } from '../lib/adminApi.js';
import toast from 'react-hot-toast';

vi.mock('../lib/adminApi.js', () => ({
  listEvents: vi.fn(), listDrinks: vi.fn(), createDrink: vi.fn(), deleteDrink: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

describe('AdminDrinks', () => {
  it('lists existing drinks for the active event', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    listDrinks.mockResolvedValue([{ _id: 'd1', category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }]);
    render(<AdminDrinks />);
    expect(await screen.findByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
  });

  it('shows a toast and keeps the drink listed when deletion fails', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    listDrinks.mockResolvedValue([{ _id: 'd1', category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }]);
    deleteDrink.mockRejectedValue(new Error('network error'));
    render(<AdminDrinks />);
    expect(await screen.findByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => expect(deleteDrink).toHaveBeenCalledWith('d1'));
    expect(await screen.findByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to delete drink.');
  });

  it('disables the submit button until the active event is known', async () => {
    listEvents.mockResolvedValue([]);
    render(<AdminDrinks />);
    await waitFor(() => expect(screen.getByRole('button', { name: /add drink/i })).toBeDisabled());
    expect(await screen.findByText(/No active event configured/i)).toBeInTheDocument();
  });

  it('adds a drink via the form', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    listDrinks.mockResolvedValue([]);
    createDrink.mockResolvedValue({ _id: 'd2', category: 'Tequila', name: 'Azul', price: 800000, order: 0 });
    render(<AdminDrinks />);
    await waitFor(() => expect(listDrinks).toHaveBeenCalled());
    fireEvent.change(screen.getByPlaceholderText('Category'), { target: { value: 'Tequila' } });
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Azul' } });
    fireEvent.change(screen.getByPlaceholderText('Price'), { target: { value: '800000' } });
    fireEvent.click(screen.getByRole('button', { name: /add drink/i }));
    await waitFor(() => expect(createDrink).toHaveBeenCalledWith('evt1', { category: 'Tequila', name: 'Azul', price: 800000, order: 0 }));
  });
});
