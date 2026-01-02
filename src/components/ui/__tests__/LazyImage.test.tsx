import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LazyImage } from "../LazyImage";

describe("LazyImage", () => {
  it("renders image element with correct attributes", () => {
    render(<LazyImage src="/test.jpg" alt="Test image" />);

    const img = screen.getByAltText("Test image");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("shows loading skeleton initially", () => {
    const { container } = render(<LazyImage src="/test.jpg" alt="Test image" />);

    const skeleton = container.querySelector(".bg-gray-200");
    expect(skeleton).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <LazyImage src="/test.jpg" alt="Test image" className="custom-class" />
    );

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("passes through width and height props", () => {
    render(<LazyImage src="/test.jpg" alt="Test image" width={100} height={200} />);

    const img = screen.getByAltText("Test image");
    expect(img).toHaveAttribute("width", "100");
    expect(img).toHaveAttribute("height", "200");
  });

  it("image has initial opacity 0", () => {
    render(<LazyImage src="/test.jpg" alt="Test image" />);

    const img = screen.getByAltText("Test image");
    expect(img).toHaveClass("opacity-0");
  });
});
