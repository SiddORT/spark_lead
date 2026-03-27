import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height = 16, borderRadius = "var(--radius-sm)", style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: width ?? "100%",
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--bg-subtle) 25%, var(--bg-muted) 50%, var(--bg-subtle) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ pointerEvents: "none" }}>
      <div className="stat-card-header">
        <Skeleton width={80} height={11} />
        <Skeleton width={32} height={32} borderRadius="var(--radius-sm)" />
      </div>
      <Skeleton width={64} height={38} borderRadius="var(--radius-sm)" style={{ marginTop: "var(--space-3)", marginBottom: "var(--space-2)" }} />
      <Skeleton width={100} height={11} />
    </div>
  );
}

export function TableRowSkeleton({ cols = 9 }: { cols?: number }) {
  const widths = [140, 70, 80, 90, 60, 100, 100, 70, 80];
  return (
    <tr style={{ cursor: "default", pointerEvents: "none" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "var(--space-3) var(--space-4)" }}>
          <Skeleton width={widths[i] ?? 80} height={13} />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div style={{
      height, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-end",
      gap: "var(--space-2)", padding: "0 var(--space-4) var(--space-4)",
    }}>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", width: "100%", height: "80%" }}>
        {[60, 40, 75, 55, 80, 45, 65, 70, 50, 85].map((h, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${h}%`}
            borderRadius="var(--radius-sm) var(--radius-sm) 0 0"
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}
