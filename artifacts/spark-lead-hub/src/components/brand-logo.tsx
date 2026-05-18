import { useTheme } from "./theme-provider";
import { BRAND } from "@/lib/brand";

interface BrandLogoProps {
  height?: number;
}

export function BrandLogo({ height = 32 }: BrandLogoProps) {
  const { theme } = useTheme();
  const src = theme === "dark" ? BRAND.darkLogo : BRAND.lightLogo;

  return (
    <img
      src={src}
      alt={BRAND.appName}
      style={{
        height,
        width: "auto",
        maxWidth: "none",
        display: "block",
        flexShrink: 0,
        objectFit: "contain",
      }}
      draggable={false}
    />
  );
}
