import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WordReveal } from "../WordReveal";

const mockPlayer = { id: "1", name: "Alice", avatar: "🎮" };
const mockWord = {
  word: "HOLA",
  player: mockPlayer,
  score: 4,
  isUnique: false,
};

describe("WordReveal", () => {
  it("displays word and player info", () => {
    render(<WordReveal word={mockWord} delay={0} />);

    expect(screen.getByText("HOLA")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("+4")).toBeInTheDocument();
  });

  it("shows unique bonus for unique words", () => {
    const uniqueWord = { ...mockWord, isUnique: true, score: 8 };
    render(<WordReveal word={uniqueWord} delay={0} />);

    expect(screen.getByText("+8")).toBeInTheDocument();
    expect(screen.getByText("×2")).toBeInTheDocument();
  });

  it("renders player avatar", () => {
    render(<WordReveal word={mockWord} delay={0} />);

    expect(screen.getByText("🎮")).toBeInTheDocument();
  });
});
