import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder: string;
  width?: number | string;
  searchable?: boolean;
}

export function FilterSelect({ value, onChange, options, placeholder, width = 160, searchable = true }: FilterSelectProps) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const ref                 = useRef<HTMLDivElement>(null);
  const searchRef           = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setQuery("");
  }, [open, searchable]);

  const filtered = searchable && query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selected  = options.find(o => o.value === value);
  const isActive  = !!value;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0, width }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%",
          height: 40,
          padding: "0 var(--space-3)",
          background: isActive ? "hsl(172 75% 48% / 0.06)" : "var(--bg-subtle)",
          border: open
            ? "1px solid var(--teal)"
            : isActive
            ? "1px solid hsl(172 75% 48% / 0.4)"
            : "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          color: isActive ? "var(--teal)" : "var(--text-muted)",
          fontSize: "var(--text-sm)",
          fontWeight: isActive ? 600 : 400,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
          boxShadow: open ? "0 0 0 3px hsl(172 75% 48% / 0.12), 0 0 8px hsl(172 75% 48% / 0.15)" : "none",
          transition: "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
          outline: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={13}
          style={{
            flexShrink: 0,
            opacity: 0.55,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 180ms ease",
            color: isActive ? "var(--teal)" : "var(--text-muted)",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            minWidth: "100%",
            background: "var(--bg-overlay)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            zIndex: 200,
            overflow: "hidden",
            boxShadow: "0 8px 32px hsl(222 22% 3% / 0.5), 0 0 0 1px hsl(172 75% 48% / 0.08)",
          }}
        >
          {searchable && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-3)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <Search size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setQuery(""); } }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-xs)",
                  minWidth: 0,
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-faint)", display: "flex" }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--text-faint)", textAlign: "center" }}>
                No results
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <DropdownItem
                    key={opt.value}
                    label={opt.label}
                    selected={isSelected}
                    onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "var(--space-2) var(--space-3)",
        textAlign: "left",
        background: selected
          ? "var(--teal-dim)"
          : hovered
          ? "var(--bg-subtle)"
          : "transparent",
        color: selected ? "var(--teal)" : hovered ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: "var(--text-sm)",
        fontWeight: selected ? 600 : 400,
        border: "none",
        cursor: "pointer",
        transition: "background 120ms ease, color 120ms ease",
        outline: "none",
      }}
    >
      <span>{label}</span>
      {selected && <Check size={13} style={{ flexShrink: 0, color: "var(--teal)" }} />}
    </button>
  );
}
