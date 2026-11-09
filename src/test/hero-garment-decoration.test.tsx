import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import HeroSection from "@/components/HeroSection";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const passThrough = ({ children, ...props }: Record<string, unknown>) => {
    const {
      initial: _initial,
      animate: _animate,
      transition: _transition,
      style: _style,
      ...domProps
    } = props;
    return React.createElement("div", domProps, children as React.ReactNode);
  };
  const motionImg = (props: Record<string, unknown>) => {
    const { style: _style, ...domProps } = props;
    return React.createElement("img", domProps);
  };
  return {
    motion: { div: passThrough, img: motionImg },
    useReducedMotion: () => false,
    useScroll: () => ({ scrollY: 0, scrollYProgress: 0 }),
    useTransform: () => 0,
    useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((result, part, index) => `${result}${part}${values[index] ?? ""}`, ""),
  };
});

describe("hero scroll vêtements", () => {
  it("remplace le rail animé par un hero scroll et des photos de vêtements", () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-testid="hero-garment-decoration"]')).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "La mode reprend vie." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorer la boutique" })).toHaveAttribute("href", "/boutique");
    expect(screen.getByRole("link", { name: "Vendre un article" })).toHaveAttribute("href", "/vendre");
    expect(screen.getByRole("img", { name: "Sélection de vêtements d'occasion" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rayon de vêtements d'occasion" })).toHaveAttribute(
      "src",
      expect.stringContaining("images.unsplash.com"),
    );
    expect(screen.getByRole("img", { name: "Jean porté, prêt à trouver un nouvel usage" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Veste de saison" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Robe mise en avant dans le catalogue" })).toBeInTheDocument();
  });
});
