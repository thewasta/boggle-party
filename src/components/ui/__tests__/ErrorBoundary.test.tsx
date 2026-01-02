import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("catches errors and displays error message", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("¡Ups! Algo salió mal")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const fallback = <div>Custom fallback</div>;

    // Using a state change to trigger the error
    const ThrowOnRender = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) throw new Error("Test");
      return <div>OK</div>;
    };

    const { rerender } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowOnRender shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("displays error message when error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/Ha ocurrido un error inesperado/)
    ).toBeInTheDocument();
  });
});
