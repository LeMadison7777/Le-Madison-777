import ClothingRailHero from "@/components/ui/product-rail-gallery";
import type { RailGarment } from "@/components/ui/product-rail-gallery";
import { useLayoutEffect, useRef } from "react";

const BACKGROUND_GARMENTS: RailGarment[] = [
  { id: "background-tee", name: "T-shirt", kind: "tee", color: "#D8C9A4", trim: "#B9A477" },
  { id: "background-knit", name: "Maille", kind: "knit", color: "#78928A", trim: "#536D65" },
  { id: "background-hoodie", name: "Sweat", kind: "hoodie", color: "#B68D8F", trim: "#8B6668" },
  { id: "background-shirt", name: "Chemise", kind: "shirt", color: "#D7D8D2", trim: "#AEB1AA" },
  { id: "background-jacket", name: "Veste", kind: "jacket", color: "#7F7770", trim: "#5F5852" },
  { id: "background-coat", name: "Manteau", kind: "coat", color: "#C79A62", trim: "#987244" },
];

export default function FeaturedProductRail() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    backgroundRef.current?.setAttribute("inert", "");
  }, []);

  return (
    <div
      ref={backgroundRef}
      data-testid="featured-rail-background"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <ClothingRailHero
        items={BACKGROUND_GARMENTS}
        autoplay
        interval={3200}
        hanger="wood"
        className="!absolute !inset-0 !h-full !w-full !bg-transparent"
        style={{ height: "100%" }}
      />
    </div>
  );
}
