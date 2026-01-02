import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FocusTrap } from "../FocusTrap";

describe("FocusTrap", () => {
  it("focuses first element when activated", () => {
    render(
      <FocusTrap isActive={true}>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FocusTrap>
    );

    const firstButton = screen.getByText("First");
    expect(firstButton).toHaveFocus();
  });

  it("does not focus when inactive", () => {
    render(
      <FocusTrap isActive={false}>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FocusTrap>
    );

    const firstButton = screen.getByText("First");
    expect(firstButton).not.toHaveFocus();
  });

  it("renders children correctly", () => {
    render(
      <FocusTrap isActive={true}>
        <button type="button">Button 1</button>
        <button type="button">Button 2</button>
        <button type="button">Button 3</button>
      </FocusTrap>
    );

    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
    expect(screen.getByText("Button 3")).toBeInTheDocument();
  });
});
