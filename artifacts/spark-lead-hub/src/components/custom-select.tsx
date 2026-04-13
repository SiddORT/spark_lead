import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  prefix?: React.ReactNode;
  color?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | null;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export function CustomSelect({
  value,
  options,
  placeholder = "Select…",
  onChange,
  disabled,
  className = "",
  searchable = false,
}: CustomSelectProps) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef          = useRef<HTMLDivElement>(null);
  const triggerRef            = useRef<HTMLDivElement>(null);
  const searchRef             = useRef<HTMLInputElement>(null);
  const selected              = options.find((o) => o.value === value);

  const PANEL_MAX_HEIGHT = 240;
  const PANEL_MIN_WIDTH  = 160;

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < PANEL_MAX_HEIGHT + 8 && spaceAbove > spaceBelow;

    setPanelStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, PANEL_MIN_WIDTH),
      zIndex: 9999,
      ...(dropUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) calcPosition();
  }, [open, calcPosition]);

  useEffect(() => {
    if (!open) { setQuery(""); return; }

    const onScroll = () => setOpen(false);
    const onResize = () => calcPosition();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, calcPosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element)?.closest?.(".cselect-portal-panel")
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setQuery("");
  }, [open, searchable]);

  const filtered = searchable && query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const panel = (
    <div
      className="cselect-portal-panel"
      style={panelStyle}
      onMouseDown={e => e.stopPropagation()}
    >
      {searchable && (
        <div className="cselect-search-row">
          <Search size={12} className="cselect-search-icon" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="cselect-search-input"
            onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setQuery(""); } }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="cselect-search-clear"
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      <div className="cselect-options-scroll">
        {filtered.map((option) => (
          <div
            key={option.value}
            className={`cselect-option ${value === option.value ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
            onClick={() => {
              if (!option.disabled) {
                onChange(option.value);
                setOpen(false);
                setQuery("");
              }
            }}
            role="option"
            aria-selected={value === option.value}
          >
            {option.color && (
              <span className="cselect-dot" style={{ background: option.color }} />
            )}
            {option.prefix && (
              <span className="cselect-prefix">{option.prefix}</span>
            )}
            <span className="cselect-option-label">{option.label}</span>
            {value === option.value && (
              <Check size={13} className="cselect-check" />
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="cselect-empty">No results</div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`cselect ${className} ${disabled ? "disabled" : ""}`}>
      <div
        ref={triggerRef}
        className={`cselect-trigger ${open ? "open" : ""} ${!value ? "placeholder" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) setOpen((o) => !o);
          }
        }}
      >
        <span className="cselect-value">
          {selected ? (
            <>
              {selected.color && (
                <span className="cselect-dot" style={{ background: selected.color }} />
              )}
              {selected.prefix && (
                <span className="cselect-prefix">{selected.prefix}</span>
              )}
              {selected.label}
            </>
          ) : (
            <span className="cselect-placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className="cselect-chevron"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease",
          }}
        />
      </div>

      {open && createPortal(panel, document.body)}
    </div>
  );
}
