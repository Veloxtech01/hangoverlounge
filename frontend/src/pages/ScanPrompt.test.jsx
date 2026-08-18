import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScanPrompt from './ScanPrompt.jsx';

describe('ScanPrompt', () => {
  it('tells the guest to scan the QR on their invitation card', () => {
    render(<ScanPrompt />);
    expect(screen.getByText(/scan the qr code on your invitation card/i)).toBeInTheDocument();
  });
});
