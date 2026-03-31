import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

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
}

export function CustomSelect({
  value,
  options,
  placeholder = "Select…",
  onChange,
  disabled,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className={`cselect ${className} ${disabled ? "disabled" : ""}`}>
      <div
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

      {open && (
        <>
          <div className="cselect-backdrop" onClick={() => setOpen(false)} />
          <div className="cselect-panel">
            {options.map((option) => (
              <div
                key={option.value}
                className={`cselect-option ${value === option.value ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setOpen(false);
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
            {options.length === 0 && (
              <div className="cselect-empty">No options available</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
