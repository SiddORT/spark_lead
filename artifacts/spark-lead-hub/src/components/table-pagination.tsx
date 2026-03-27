import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function TablePagination({ page, totalPages, total, pageSize, onChange }: TablePaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--space-4) var(--space-5)",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--bg-overlay)",
      flexWrap: "wrap",
      gap: "var(--space-3)",
    }}>
      <span style={{
        fontSize: "var(--text-xs)",
        color: "var(--text-muted)",
        fontVariantNumeric: "tabular-nums",
      }}>
        Showing <strong style={{ color: "var(--text-secondary)" }}>{start}–{end}</strong> of{" "}
        <strong style={{ color: "var(--text-secondary)" }}>{total}</strong> results
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={{ opacity: page === 1 ? 0.35 : 1 }}
          title="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              style={{ padding: "0 4px", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className="btn btn-sm btn-icon"
              style={{
                minWidth: 32,
                fontVariantNumeric: "tabular-nums",
                fontSize: "var(--text-xs)",
                background: page === p ? "var(--teal-dim)" : "transparent",
                color: page === p ? "var(--teal)" : "var(--text-muted)",
                border: page === p ? "1px solid var(--teal)" : "1px solid transparent",
                fontWeight: page === p ? 700 : 400,
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          style={{ opacity: page === totalPages ? 0.35 : 1 }}
          title="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
