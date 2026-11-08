import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeaturedProducts from "@/components/FeaturedProducts";

const { useListingsMock } = vi.hoisted(() => ({ useListingsMock: vi.fn() }));

vi.mock("@/hooks/useListings", () => ({ useListings: useListingsMock }));
vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: {
      div: ({ children, ...props }: Record<string, unknown>) => {
        const { initial: _initial, whileInView: _whileInView, viewport: _viewport, ...domProps } = props;
        return React.createElement("div", domProps, children as React.ReactNode);
      },
    },
  };
});
vi.mock("@/components/ui/product-rail-gallery", () => ({
  default: ({ items }: { items: { id: string; image?: string; backImage?: string; sideImage?: string }[] }) => (
    <div
      data-slot="clothing-rail-hero"
      data-garment-count={items.length}
      data-has-photo={items.some((item) => item.image || item.backImage || item.sideImage) ? "true" : "false"}
    />
  ),
}));
vi.mock("@/components/ProductCard", () => ({
  default: ({ product }: { product: { id: string; name: string; img: string } }) => (
    <article data-testid="product-card" data-product-id={product.id}>
      <img src={product.img} alt={product.name} />
      {product.name}
    </article>
  ),
}));

const products = [
  {
    id: "listing-robe",
    name: "Robe traditionnelle",
    description: "Tissu wax, très bon état",
    brand: "Atelier local",
    size: "M",
    price: 18500,
    location: "Brazzaville",
    city: "Brazzaville",
    category: "Robes & Tenues",
    condition: "Très bon état" as const,
    img: "/test-media/robe.webp",
  },
  {
    id: "listing-sac",
    name: "Sac en cuir",
    description: "Pièce artisanale",
    brand: null,
    size: null,
    price: 24000,
    location: "Pointe-Noire",
    city: "Pointe-Noire",
    category: "Sacs & Maroquinerie",
    condition: "Bon état" as const,
    img: "/test-media/sac.webp",
  },
];

function renderFeatured() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FeaturedProducts />
    </MemoryRouter>,
  );
}

describe("animation de fond de la sélection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useListingsMock.mockReturnValue({ items: products, loading: false, error: "", retry: vi.fn() });
  });

  it("place le rail original derrière la sélection sans affecter les photos ni les cartes", () => {
    const { container } = renderFeatured();
    const background = container.querySelector('[data-testid="featured-rail-background"]');

    expect(background).toBeInTheDocument();
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveAttribute("inert");
    expect(background).toHaveClass("pointer-events-none");
    expect(background?.querySelector('[data-slot="clothing-rail-hero"]')).toBeInTheDocument();
    expect(background?.querySelector('[data-slot="clothing-rail-hero"]')).toHaveAttribute("data-has-photo", "false");
    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Robe traditionnelle" })).toHaveAttribute("src", products[0].img);
    expect(screen.getByRole("img", { name: "Sac en cuir" })).toHaveAttribute("src", products[1].img);
  });

  it("conserve le fond animé même lorsqu’aucune annonce n’est disponible", () => {
    useListingsMock.mockReturnValue({ items: [], loading: false, error: "", retry: vi.fn() });
    const { container } = renderFeatured();

    expect(container.querySelector('[data-testid="featured-rail-background"]')).toBeInTheDocument();
    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
    expect(screen.getByText("Aucune annonce publiée pour l'instant.")).toBeInTheDocument();
  });
});
