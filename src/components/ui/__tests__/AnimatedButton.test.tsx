import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnimatedButton } from '../AnimatedButton';

describe('AnimatedButton', () => {
  it('renders with default props', () => {
    render(<AnimatedButton>Test Button</AnimatedButton>);
    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-indigo-600');
  });

  it('applies variant classes correctly', () => {
    render(<AnimatedButton variant="secondary">Secondary</AnimatedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('applies size classes correctly', () => {
    render(<AnimatedButton size="lg">Large</AnimatedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });
});
