/**
 * Form System — Reusable, theme-aware primitives
 *
 * These components use the shared CSS design tokens defined in index.css and
 * automatically honour both light and dark mode via the [data-theme] attribute.
 *
 * Usage:
 *   <FormCard>
 *     <FormSection>
 *       <FieldLabel required>Email</FieldLabel>
 *       <InputField type="email" placeholder="you@company.com" />
 *     </FormSection>
 *     <PrimaryButton>Submit</PrimaryButton>
 *   </FormCard>
 */

import React, { useState } from "react";
import { useTheme } from "@/components/theme-provider";

// ── FormCard ─────────────────────────────────────────────────────────────────
// Clean white card in light mode; glass-elevated in dark mode.
interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: number;
}
export function FormCard({ maxWidth = 480, style, children, ...props }: FormCardProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const baseStyle: React.CSSProperties = isLight ? {
    background: "#ffffff",
    border: "1px solid #dbe7f3",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    width: "100%",
    maxWidth,
  } : {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-xl)",
    padding: 32,
    boxShadow: "var(--shadow-lg)",
    width: "100%",
    maxWidth,
  };

  return (
    <div style={{ ...baseStyle, ...style }} {...props}>
      {children}
    </div>
  );
}

// ── FormSection ───────────────────────────────────────────────────────────────
// Vertical stack with consistent gap between fields.
export function FormSection({ gap = 18, style, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { gap?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }} {...props}>
      {children}
    </div>
  );
}

// ── FieldLabel ────────────────────────────────────────────────────────────────
// Uppercase tracking label. Renders * for required fields.
interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}
export function FieldLabel({ children, required, htmlFor }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="field-label"
      style={{ display: "block", marginBottom: 7 }}
    >
      {children}
      {required && <span className="req" style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
    </label>
  );
}

// ── InputField ────────────────────────────────────────────────────────────────
// Full-width text input with focus ring, theme-aware via CSS class.
export const InputField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input ref={ref} className="field-input" {...props} />
));
InputField.displayName = "InputField";

// ── TextareaField ─────────────────────────────────────────────────────────────
export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => (
  <textarea ref={ref} className="field-textarea" {...props} />
));
TextareaField.displayName = "TextareaField";

// ── PrimaryButton ─────────────────────────────────────────────────────────────
// Blue gradient CTA button. Disabled state included.
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}
export function PrimaryButton({ loading, loadingText = "Loading…", children, style, ...props }: PrimaryButtonProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`btn btn-primary ${props.className ?? ""}`}
      style={{
        width: "100%",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transform: hover && !loading ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 120ms ease, box-shadow 180ms ease",
        ...style,
      }}
      onMouseEnter={e => { setHover(true); props.onMouseEnter?.(e); }}
      onMouseLeave={e => { setHover(false); props.onMouseLeave?.(e); }}
    >
      {loading ? (
        <>
          <div style={{
            width: 15, height: 15,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#ffffff",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }} />
          {loadingText}
        </>
      ) : children}
    </button>
  );
}

// ── ModalContainer ────────────────────────────────────────────────────────────
// Backdrop + centred white card. Pair with modal-head / modal-body / modal-foot
// CSS classes on the children for structured layout.
interface ModalContainerProps {
  open: boolean;
  onClose: () => void;
  maxWidth?: number;
  children: React.ReactNode;
}
export function ModalContainer({ open, onClose, maxWidth = 500, children }: ModalContainerProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── FormFieldWrapper ──────────────────────────────────────────────────────────
// Wraps label + input + optional helper/error into a form-field block.
interface FormFieldWrapperProps {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  id?: string;
}
export function FormFieldWrapper({ label, required, helper, error, children, id }: FormFieldWrapperProps) {
  return (
    <div className="form-field" style={{ marginBottom: 0 }}>
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      {children}
      {error  && <span className="field-error">{error}</span>}
      {helper && !error && <span className="field-helper">{helper}</span>}
    </div>
  );
}
