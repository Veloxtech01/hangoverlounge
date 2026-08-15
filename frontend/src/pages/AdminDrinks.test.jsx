import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDrinks from './AdminDrinks.jsx';
import { listEvents, listDrinks, createDrink, deleteDrink } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({
  listEvents: vi.fn(), listDrinks: vi.fn(), createDrink: vi.fn(), deleteDrink: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }));

describe('AdminDrinks', () => {
  it('lists existing drinks for the active event', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    listDrinks.mockResolvedValue([{ _id: 'd1', category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }]);
    render(<AdminDrinks />);
    expect(await screen.findByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
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
