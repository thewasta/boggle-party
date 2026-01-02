import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FoundWordsList } from '../FoundWordsList';

const mockWords = [
  { word: 'HOLA', score: 4, timestamp: 1000 },
  { word: 'CASA', score: 8, timestamp: 2000 },
];

describe('FoundWordsList', () => {
  it('renders found words', () => {
    render(<FoundWordsList words={mockWords} />);

    expect(screen.getByText('HOLA')).toBeInTheDocument();
    expect(screen.getByText('CASA')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<FoundWordsList words={[]} />);

    expect(screen.getByText('Arrastra para formar palabras')).toBeInTheDocument();
    expect(screen.queryByText('HOLA')).not.toBeInTheDocument();
  });

  it('displays total score', () => {
    render(<FoundWordsList words={mockWords} />);

    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('has score elements', () => {
    const { container } = render(<FoundWordsList words={mockWords} />);

    const scores = container.querySelectorAll('.bg-gradient-to-br');
    expect(scores.length).toBeGreaterThan(0);
  });
});
