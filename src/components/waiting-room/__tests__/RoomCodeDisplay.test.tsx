import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomCodeDisplay } from '../RoomCodeDisplay';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('RoomCodeDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays room code', () => {
    render(<RoomCodeDisplay roomCode="ABC123" />);
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('copies code to clipboard on button click', async () => {
    render(<RoomCodeDisplay roomCode="ABC123" />);
    const button = screen.getByLabelText('Copiar código');

    await fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
  });

  it('has copy button with correct label', () => {
    render(<RoomCodeDisplay roomCode="ABC123" />);
    expect(screen.getByLabelText('Copiar código')).toBeInTheDocument();
  });
});
