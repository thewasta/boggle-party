import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayerList } from '../PlayerList';

const mockPlayers = [
  { id: '1', name: 'Alice', avatar: '🎮', isHost: false, score: 0, foundWords: [], createdAt: new Date() },
  { id: '2', name: 'Bob', avatar: '🎯', isHost: false, score: 0, foundWords: [], createdAt: new Date() },
];

describe('PlayerList', () => {
  it('renders all players', () => {
    render(<PlayerList players={mockPlayers} hostId="1" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows host badge for host player', () => {
    render(<PlayerList players={mockPlayers} hostId="1" />);
    expect(screen.getByText('Anfitrión')).toBeInTheDocument();
  });

  it('displays player count', () => {
    render(<PlayerList players={mockPlayers} hostId="1" />);
    expect(screen.getByText('2/8')).toBeInTheDocument();
  });

  it('shows empty state when no players', () => {
    render(<PlayerList players={[]} hostId="" />);
    expect(screen.getByText('Esperando jugadores...')).toBeInTheDocument();
  });
});
