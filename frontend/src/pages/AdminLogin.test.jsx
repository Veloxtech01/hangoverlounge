import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from './AdminLogin.jsx';
import { login } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({ login: vi.fn() }));

describe('AdminLogin', () => {
  it('logs in with the entered password', async () => {
    login.mockResolvedValue({ token: 'abc' });
    render(<MemoryRouter><AdminLogin /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/admin password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('secret'));
  });
});
