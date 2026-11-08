import { useLayoutEffect, useRef } from "react";
import ClothingRailHero from "@/components/ui/product-rail-gallery";
import type { RailGarment } from "@/components/ui/product-rail-gallery";

const HERO_GARMENTS: RailGarment[] = [
  { id: "hero-tee", name: "T-shirt", kind: "tee", color: "#9D4EDD", trim: "#6F35A8" },
  { id: "hero-hoodie", name: "Sweat", kind: "hoodie", color: "#38BDF8", trim: "#1688B8" },
  { id: "hero-jacket", name: "Veste", kind: "jacket", color: "#D9D9D9", trim: "#9A9A9A" },
];

export default function HeroGarmentDecoration() {
  const decorationRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    decorationRef.current?.setAttribute("inert", "");
  }, []);

  return (
    <div
      ref={decorationRef}
      data-testid="hero-garment-decoration"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-20 sm:opacity-30"
    >
      <ClothingRailHero
        items={HERO_GARMENTS}
        autoplay
        interval={4200}
        hanger="none"
        className="!absolute !inset-0 !h-full !w-full !bg-transparent"
        style={{ height: "100%" }}
      />
    </div>
  );
}
