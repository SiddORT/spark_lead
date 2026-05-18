import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: FilterSelectOption[];
  placeholder: string;
  width?: number | string;
  searchable?: boolean;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  width = 160,
  searchable = true,
}: FilterSelectProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref               = useRef<HTMLDivElement>(null);
  const searchRef         = useRef<HTMLInputElement>(null);

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

  const isActive = value.length > 0;

  const triggerLabel = (() => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return options.find(o => o.value === value[0])?.label ?? placeholder;
    const first = options.find(o => o.value === value[0])?.label ?? "";
    return `${first} +${value.length - 1}`;
  })();

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  const allFiltered = filtered.map(o => o.value);
  const allSelected = allFiltered.every(v => value.includes(v));

  const toggleAll = () => {
    if (allSelected) {
      onChange(value.filter(v => !allFiltered.includes(v)));
    } else {
      const next = new Set([...value, ...allFiltered]);
      onChange([...next]);
    }
  };

  const clearAll = () => onChange([]);

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
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
          {triggerLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          {isActive && (
            <span
              title="Clear selection"
              onClick={e => { e.stopPropagation(); clearAll(); }}
              style={{
                display: "flex", alignItems: "center",
                color: "var(--teal)", opacity: 0.7,
                cursor: "pointer", padding: 2, borderRadius: 3,
              }}
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown
            size={13}
            style={{
              opacity: 0.55,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 180ms ease",
              color: isActive ? "var(--teal)" : "var(--text-muted)",
            }}
          />
        </div>
      </button>

      {open && (
        <div style={{
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
        }}>
          {searchable && (
            <div style={{
              display: "flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              borderBottom: "1px solid var(--border-subtle)",
            }}>
              <Search size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setQuery(""); } }}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "var(--text-primary)", fontSize: "var(--text-xs)", minWidth: 0,
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

          {options.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 2,
              padding: "4px var(--space-3)",
              borderBottom: "1px solid var(--border-subtle)",
            }}>
              <button
                type="button"
                onClick={toggleAll}
                style={{
                  fontSize: 11, fontWeight: 600,
                  color: allSelected ? "var(--text-muted)" : "var(--teal)",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "2px 4px", opacity: allSelected ? 0.5 : 1,
                }}
              >
                Select all
              </button>
              <span style={{ color: "var(--border-default)", lineHeight: "20px", fontSize: 13 }}>·</span>
              <button
                type="button"
                onClick={clearAll}
                style={{
                  fontSize: 11, fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "2px 4px", opacity: value.length === 0 ? 0.4 : 1,
                }}
              >
                Clear
              </button>
              {value.length > 0 && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: 10, fontWeight: 700,
                  color: "var(--teal)",
                  background: "hsl(172 75% 48% / 0.12)",
                  borderRadius: 100,
                  padding: "1px 7px",
                  lineHeight: 1.8,
                }}>
                  {value.length}
                </span>
              )}
            </div>
          )}

          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--text-faint)", textAlign: "center" }}>
                No results
              </div>
            ) : (
              filtered.map(opt => (
                <CheckboxItem
                  key={opt.value}
                  label={opt.label}
                  checked={value.includes(opt.value)}
                  onClick={() => toggle(opt.value)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckboxItem({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "var(--space-2) var(--space-3)",
        textAlign: "left",
        background: checked ? "var(--teal-dim)" : hovered ? "var(--bg-subtle)" : "transparent",
        color: checked ? "var(--teal)" : hovered ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: "var(--text-sm)", fontWeight: checked ? 600 : 400,
        border: "none", cursor: "pointer",
        transition: "background 120ms ease, color 120ms ease",
        outline: "none",
      }}
    >
      <span style={{
        width: 14, height: 14, flexShrink: 0,
        borderRadius: 3,
        border: `1.5px solid ${checked ? "var(--teal)" : "hsl(210, 14%, 40%)"}`,
        background: checked ? "var(--teal)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 120ms ease, border-color 120ms ease",
      }}>
        {checked && <Check size={9} strokeWidth={3} style={{ color: "#0a1628" }} />}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}
