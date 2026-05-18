import { useTheme } from "./theme-provider";
import { BRAND } from "@/lib/brand";

interface BrandLogoProps {
  height?: number;
}

export function BrandLogo({ height = 24 }: BrandLogoProps) {
  const { theme } = useTheme();

  if (theme === "light") {
    return (
      <img
        src={BRAND.lightLogo}
        alt={BRAND.appName}
        style={{ height, width: "auto", display: "block", flexShrink: 0 }}
        draggable={false}
      />
    );
  }

  const fontSize = Math.round(height * 1.05);
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 0, flexShrink: 0 }}>
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize,
        fontWeight: 800,
        color: "#ffffff",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>{BRAND.appName}</span>
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize,
        fontWeight: 800,
        color: BRAND.accentColor,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>_</span>
    </span>
  );
}
