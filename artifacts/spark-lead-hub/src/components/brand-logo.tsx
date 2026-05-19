import { BRAND } from "@/lib/brand";

interface BrandBlockProps {
  layout?: "horizontal" | "vertical";
  ortHeight?: number;
  nameSize?: number;
  gap?: number;
  /** @deprecated use nameSize */
  nameHeight?: number;
}

export function BrandBlock({
  layout = "horizontal",
  ortHeight = 28,
  nameSize,
  nameHeight,
  gap = 12,
}: BrandBlockProps) {
  const isVertical = layout === "vertical";
  const fontSize = nameSize ?? nameHeight ?? 18;

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
        src={BRAND.logos.ort}
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
      <span
        style={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: BRAND.accentColor,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {BRAND.appName}
      </span>
    </div>
  );
}

export { BrandBlock as BrandLogo };
