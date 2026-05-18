import { useTheme } from "./theme-provider";
import { BRAND } from "@/lib/brand";

interface BrandLogoProps {
  height?: number;
}

export function BrandLogo({ height = 32 }: BrandLogoProps) {
  const { theme } = useTheme();

  if (theme === "light") {
    return (
      <img
        src={BRAND.lightLogo}
        alt={BRAND.appName}
        style={{
          height,
          width: "auto",
          display: "block",
          flexShrink: 0,
          objectFit: "contain",
          maxWidth: "100%",
        }}
        draggable={false}
      />
    );
  }

  const fontSize = Math.round(height * 0.92);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        flexShrink: 0,
        height,
        lineHeight: `${height}px`,
      }}
    >
      <span style={{
        fontFamily: "'Syne', sans-serif",
        fontSize,
        fontWeight: 800,
        color: "#ffffff",
        letterSpacing: "-0.025em",
        lineHeight: 1,
        userSelect: "none",
      }}>
        {BRAND.appName}
      </span>
      <span style={{
        fontFamily: "'Syne', sans-serif",
        fontSize,
        fontWeight: 800,
        color: BRAND.accentColor,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        userSelect: "none",
      }}>
        _
      </span>
    </span>
  );
}
