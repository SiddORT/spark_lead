import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function TablePagination({ page, totalPages, total, pageSize, onChange }: TablePaginationProps) {
  // Defensive coercion — never trust upstream values can be undefined/null/NaN
  const safeTotal      = Number.isFinite(Number(total))      ? Math.max(0, Number(total))      : 0;
  const safePageSize   = Number.isFinite(Number(pageSize))   && Number(pageSize)   > 0 ? Number(pageSize)   : 10;
  const safeTotalPages = Number.isFinite(Number(totalPages)) && Number(totalPages) > 0
    ? Number(totalPages)
    : Math.max(1, Math.ceil(safeTotal / safePageSize));
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0
    ? Math.min(Number(page), safeTotalPages)
    : 1;

  if (safeTotal === 0) return null;

  const start = (safePage - 1) * safePageSize + 1;
  const end   = Math.min(safePage * safePageSize, safeTotal);

  const getPageNumbers = (): (number | "...")[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    if (safePage <= 4) return [1, 2, 3, 4, 5, "...", safeTotalPages];
    if (safePage >= safeTotalPages - 3) return [1, "...", safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", safeTotalPages];
  };

  return (
    <div className="table-pagination" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--space-3) var(--space-5)",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--bg-elevated)",
      flexWrap: "wrap",
      gap: "var(--space-3)",
    }}>
      <span className="table-pagination-info" style={{
        fontSize: "var(--text-xs)",
        color: "var(--text-muted)",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.01em",
      }}>
        Showing{" "}
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{start}–{end}</span>
        {" "}of{" "}
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{total}</span>
        {" "}results
      </span>

      <div className="table-pagination-controls" style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <NavButton
          onClick={() => onChange(safePage - 1)}
          disabled={safePage === 1}
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </NavButton>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`e-${i}`}
              style={{
                width: 30, textAlign: "center",
                fontSize: "var(--text-xs)", color: "var(--text-muted)",
                userSelect: "none",
              }}
            >
              …
            </span>
          ) : (
            <PageButton key={p} num={p as number} active={safePage === p} onClick={() => onChange(p as number)} />
          )
        )}

        <NavButton
          onClick={() => onChange(safePage + 1)}
          disabled={safePage >= safeTotalPages}
          title="Next page"
        >
          <ChevronRight size={14} />
        </NavButton>
      </div>
    </div>
  );
}

function PageButton({ num, active, onClick }: { num: number; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30, height: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--text-xs)",
        fontWeight: active ? 700 : 400,
        fontVariantNumeric: "tabular-nums",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        background: active
          ? "hsl(196 100% 46% / 0.1)"
          : hovered ? "var(--bg-subtle)" : "transparent",
        color: active ? "var(--teal)" : hovered ? "var(--text-primary)" : "var(--text-muted)",
        boxShadow: active ? "0 0 10px hsl(196 100% 46% / 0.18)" : "none",
        transition: "all 120ms ease",
        outline: "none",
        position: "relative",
      }}
    >
      {num}
      {active && (
        <span style={{
          position: "absolute",
          bottom: 2, left: "50%",
          transform: "translateX(-50%)",
          width: 12, height: 2,
          background: "var(--teal)",
          borderRadius: 2,
        }} />
      )}
    </button>
  );
}

function NavButton({ onClick, disabled, title, children }: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30, height: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        border: "none",
        background: hovered && !disabled ? "var(--bg-subtle)" : "transparent",
        color: disabled ? "var(--text-muted)" : hovered ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        transition: "all 120ms ease",
        outline: "none",
      }}
    >
      {children}
    </button>
  );
}
