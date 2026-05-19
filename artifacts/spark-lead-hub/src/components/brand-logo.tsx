import { useTheme } from "./theme-provider";
import { BRAND } from "@/lib/brand";

interface BrandBlockProps {
  layout?: "horizontal" | "vertical";
  ortHeight?: number;
  nameHeight?: number;
  gap?: number;
}

export function BrandBlock({
  layout = "horizontal",
  ortHeight = 38,
  nameHeight = 26,
  gap = 14,
}: BrandBlockProps) {
  const { theme } = useTheme();
  const logos = BRAND.logos[theme as "dark" | "light"] ?? BRAND.logos.dark;

  const isVertical = layout === "vertical";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap,
      }}
    >
      <img
        src={logos.ort}
        alt="ort_"
        style={{
          height: ortHeight,
          width: "auto",
          maxWidth: "none",
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
        }}
        draggable={false}
      />
      <img
        src={logos.sparklead}
        alt={BRAND.appName}
        style={{
          height: nameHeight,
          width: "auto",
          maxWidth: "none",
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
        }}
        draggable={false}
      />
    </div>
  );
}

export { BrandBlock as BrandLogo };
