import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FloatingLetters } from '../FloatingLetters';

describe('FloatingLetters', () => {
  it('renders floating letters container', () => {
    render(<FloatingLetters />);
    const container = document.querySelector('.fixed.inset-0');
    expect(container).toBeInTheDocument();
  });

  it('renders all letters', () => {
    render(<FloatingLetters />);
    const letters = document.querySelectorAll('.text-4xl.font-bold.text-orange-200');
    expect(letters.length).toBe(11); // B O G G L E P A R T Y
  });
});
