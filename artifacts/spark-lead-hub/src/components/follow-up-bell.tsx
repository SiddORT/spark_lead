import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { useGetLeads } from "@workspace/api-client-react";
import { useUserMap } from "@/hooks/use-user-map";
import { useLocation } from "wouter";
import { formatShortDate } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

type Status = "OVERDUE" | "TODAY" | "UPCOMING";

function getStatus(dateStr: string): Status {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(d, today);
  if (diff < 0) return "OVERDUE";
  if (diff === 0) return "TODAY";
  return "UPCOMING";
}

const STATUS_CFG: Record<Status, { className: string; label: string }> = {
  OVERDUE:  { className: "bell-pill bell-pill--overdue",  label: "Overdue"  },
  TODAY:    { className: "bell-pill bell-pill--today",    label: "Today"    },
  UPCOMING: { className: "bell-pill bell-pill--upcoming", label: "Upcoming" },
};

function StatusPill({ status }: { status: Status }) {
  const c = STATUS_CFG[status];
  return <span className={c.className}>{c.label}</span>;
}

interface Props {
  onLeadClick: (id: string) => void;
}

export function FollowUpBell({ onLeadClick }: Props) {
  const [open, setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);
  const [, setLocation]  = useLocation();
  const { resolveName }  = useUserMap();
  const isMobile         = useIsMobile();

  const { data: raw = [] } = useGetLeads(undefined, {
    query: { refetchInterval: 60_000, refetchOnWindowFocus: true },
  });
  const leads = raw as any[];

  const enriched = leads
    .filter((l: any) => !!l.activeFollowUpDate && !l.statusIsWon && !l.statusIsLost)
    .map((l: any) => ({ ...l, _status: getStatus(l.activeFollowUpDate as string) }))
    .sort((a: any, b: any) => {
      const order: Record<Status, number> = { OVERDUE: 0, TODAY: 1, UPCOMING: 2 };
      if (order[a._status as Status] !== order[b._status as Status])
        return order[a._status as Status] - order[b._status as Status];
      return new Date(b.activeFollowUpDate).getTime() - new Date(a.activeFollowUpDate).getTime();
    });

  const badgeCount   = enriched.filter((l: any) => l._status === "OVERDUE" || l._status === "TODAY").length;
  const displayItems = enriched.slice(0, 5);

  useEffect(() => {
    if (!open) return;
    // On mobile the sheet is portaled to body, so an outside-click handler
    // bound to `ref` would close it immediately. The overlay click already
    // handles dismissal on mobile; only run outside-click logic on desktop.
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  // ESC closes; lock body scroll while open on mobile
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (isMobile) document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  const badgeLabel = badgeCount > 9 ? "9+" : String(badgeCount);

  const panelContent = (
    <>
      {/* Header */}
      <div style={{
        padding: "14px 16px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Follow-Ups
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {badgeCount > 0 && (
            <span className="bell-pill bell-pill--overdue" style={{ borderRadius: 999, padding: "2px 10px", fontSize: 11 }}>
              {badgeCount} urgent
            </span>
          )}
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              className="bell-icon-btn"
              aria-label="Close"
              style={{
                borderRadius: 8, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="bell-divider" />

      {/* Mobile handle bar */}
      {isMobile && (
        <div className="bell-handle" />
      )}

      {/* Items list */}
      <div style={{ padding: "8px 10px", maxHeight: isMobile ? "55svh" : 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {displayItems.length === 0 ? (
          <div style={{
            padding: "28px 12px", textAlign: "center",
            color: "var(--text-muted)", fontSize: 13,
          }}>
            🎉 No follow-ups pending
          </div>
        ) : displayItems.map((item: any) => (
          <button
            key={item.id}
            onClick={() => { onLeadClick(item.id); setOpen(false); }}
            className="bell-row"
            style={{
              width: "100%", textAlign: "left",
              border: "none",
              borderRadius: 12, padding: "10px 12px",
              cursor: "pointer", transition: "background 0.12s",
              minHeight: 44,
            }}
          >
            {/* Row: name + badge */}
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: 8, marginBottom: 5,
            }}>
              <span style={{
                fontWeight: 600, fontSize: 13,
                color: "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                minWidth: 0, flex: 1,
              }}>
                {item.leadName}
              </span>
              <StatusPill status={item._status as Status} />
            </div>
            {/* Row: date + handler */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                📅 {item.activeFollowUpDate ? formatShortDate(item.activeFollowUpDate) : "—"}
              </span>
              {item.dealHandler && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  👤 {resolveName(item.dealHandler)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="bell-divider" />

      {/* Footer */}
      <div style={{ padding: "10px 12px 12px" }}>
        <button
          onClick={() => { setLocation("/follow-up"); setOpen(false); }}
          className="bell-cta"
          style={{
            width: "100%",
            borderRadius: 12,
            fontWeight: 600, fontSize: 13,
            padding: "10px 0", cursor: "pointer",
            transition: "background 0.15s",
            minHeight: 44,
          }}
        >
          View All Follow-Ups →
        </button>
      </div>
    </>
  );

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>

      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Follow-up notifications"
        className={`bell-trigger${open ? " bell-trigger--open" : ""}${badgeCount > 0 ? " bell-trigger--alert" : ""}`}
        style={{
          position: "relative",
          borderRadius: 12,
          padding: "8px 10px",
          cursor: "pointer",
          display: "flex", alignItems: "center",
          minWidth: 44, minHeight: 44, justifyContent: "center",
        }}
      >
        <Bell size={20} strokeWidth={1.75} />
        {badgeCount > 0 && (
          <span className="bell-count">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* ── Desktop popover ── */}
      {open && !isMobile && (
        <div className="bell-panel" style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 9999,
          width: 320,
          borderRadius: 18,
          overflow: "hidden",
        }}>
          {panelContent}
        </div>
      )}

      {/* ── Mobile bottom sheet (portaled to body to escape any ancestor
              stacking-context / transform / overflow:hidden) ── */}
      {open && isMobile && typeof document !== "undefined" && createPortal(
        <>
          <div
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="bell-sheet-overlay-portal"
            style={{
              position: "fixed",
              inset: 0,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 100000,
              animation: "fade-in 180ms ease both",
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Follow-up notifications"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              maxHeight: "80svh",
              background: "var(--bg-elevated)",
              borderTop: "1px solid var(--border-subtle)",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.35), 0 0 0 1px var(--border-subtle)",
              overflowY: "auto",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
              zIndex: 100001,
              animation: "sheet-up 220ms ease both",
            }}
          >
            {panelContent}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
