import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameBoard } from '../GameBoard';

const mockBoard = [
  ['A', 'B'],
  ['C', 'D']
];

const mockSelection = {
  cells: [],
  word: ''
};

describe('GameBoard', () => {
  it('renders board grid', () => {
    render(
      <GameBoard
        board={mockBoard}
        selection={mockSelection}
        onSelectionStart={vi.fn()}
        onSelectionMove={vi.fn()}
        onSelectionEnd={vi.fn()}
        isLocked={false}
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders locked state', () => {
    const { container } = render(
      <GameBoard
        board={mockBoard}
        selection={mockSelection}
        onSelectionStart={vi.fn()}
        onSelectionMove={vi.fn()}
        onSelectionEnd={vi.fn()}
        isLocked={true}
      />
    );

    const lockedCells = container.querySelectorAll('.opacity-50');
    expect(lockedCells.length).toBeGreaterThan(0);
  });

  it('has grid container', () => {
    const { container } = render(
      <GameBoard
        board={mockBoard}
        selection={mockSelection}
        onSelectionStart={vi.fn()}
        onSelectionMove={vi.fn()}
        onSelectionEnd={vi.fn()}
        isLocked={false}
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
