import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import HeroSection from "@/components/HeroSection";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const motionDiv = ({ children, ...props }: Record<string, unknown>) => {
    const { initial: _initial, animate: _animate, transition: _transition, ...domProps } = props;
    return React.createElement("div", domProps, children as React.ReactNode);
  };
  return { motion: { div: motionDiv }, useReducedMotion: () => false };
});

vi.mock("@/components/ui/product-rail-gallery", () => ({
  default: ({ items, autoplay }: { items: { image?: string; backImage?: string; sideImage?: string }[]; autoplay?: boolean }) => (
    <div
      data-testid="hero-garment-rail"
      data-garment-count={items.length}
      data-autoplay={autoplay ? "true" : "false"}
      data-has-remote-media={items.some((item) => item.image || item.backImage || item.sideImage) ? "true" : "false"}
    />
  ),
}));

describe("décor de vêtements du hero", () => {
  it("ajoute un rail local non interactif sans changer le contenu ni l’image du hero", () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    const decoration = container.querySelector('[data-testid="hero-garment-decoration"]');
    expect(decoration).toBeInTheDocument();
    expect(decoration).toHaveAttribute("aria-hidden", "true");
    expect(decoration).toHaveAttribute("inert");
    expect(decoration).toHaveClass("pointer-events-none");

    const rail = screen.getByTestId("hero-garment-rail");
    expect(Number(rail.getAttribute("data-garment-count"))).toBeGreaterThanOrEqual(3);
    expect(rail).toHaveAttribute("data-autoplay", "true");
    expect(rail).toHaveAttribute("data-has-remote-media", "false");

    const heroImage = screen.getByRole("img", { name: "Pièce de mode à découvrir sur Madclothes" });
    expect(heroImage).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByRole("heading", { level: 1, name: "La mode reprend vie." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorer la boutique" })).toHaveAttribute("href", "/boutique");
    expect(screen.getByRole("link", { name: "Vendre un article" })).toHaveAttribute("href", "/vendre");
    expect(heroImage).toBeInTheDocument();
  });
});
