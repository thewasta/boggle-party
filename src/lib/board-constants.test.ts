import { describe, it, expect } from "vitest";
import { computeBoardDimension } from "./board-constants";

describe("computeBoardDimension", () => {
  it("4×4 at max size", () => {
    // 4 * (70 + 8) - 8 = 304
    expect(computeBoardDimension(4, 70, 8)).toBe(304);
  });

  it("5×5 at max size", () => {
    // 5 * (70 + 8) - 8 = 382
    expect(computeBoardDimension(5, 70, 8)).toBe(382);
  });

  it("6×6 at max size", () => {
    // 6 * (70 + 8) - 8 = 460
    expect(computeBoardDimension(6, 70, 8)).toBe(460);
  });

  it("6×6 at min size", () => {
    // 6 * (44 + 4) - 4 = 284
    expect(computeBoardDimension(6, 44, 4)).toBe(284);
  });

  it("4×4 at min size", () => {
    // 4 * (44 + 4) - 4 = 188
    expect(computeBoardDimension(4, 44, 4)).toBe(188);
  });
});
