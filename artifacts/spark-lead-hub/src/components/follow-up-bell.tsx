import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell, BellRing, BellOff, X, Briefcase, User, CalendarDays,
  CircleAlert, Clock, CalendarClock, ArrowRight, type LucideIcon,
} from "lucide-react";
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

const STATUS_CFG: Record<Status, { className: string; label: string; PillIcon: LucideIcon; iconClass: string }> = {
  OVERDUE:  { className: "bell-pill bell-pill--overdue",  label: "Overdue",  PillIcon: CircleAlert,   iconClass: "bell-item-icon--overdue"  },
  TODAY:    { className: "bell-pill bell-pill--today",    label: "Today",    PillIcon: Clock,         iconClass: "bell-item-icon--today"    },
  UPCOMING: { className: "bell-pill bell-pill--upcoming", label: "Upcoming", PillIcon: CalendarClock, iconClass: "bell-item-icon--upcoming" },
};

function StatusPill({ status }: { status: Status }) {
  const c = STATUS_CFG[status];
  const PillIcon = c.PillIcon;
  return (
    <span className={c.className}>
      <PillIcon size={11} strokeWidth={2.25} aria-hidden="true" />
      {c.label}
    </span>
  );
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

  // Note: intentionally no query options. The previous code passed options as a
  // (ignored) second argument, so no polling ever ran — keep behavior identical.
  const { data: raw = [] } = useGetLeads();
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
      <div className="bell-header">
        <span className="bell-header-title">
          <BellRing size={15} strokeWidth={2} aria-hidden="true" />
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
              aria-label="Close notifications"
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
      <div className="bell-list" style={{ maxHeight: isMobile ? "55svh" : 300 }} role="list" aria-label="Follow-up notifications">
        {displayItems.length === 0 ? (
          <div className="bell-empty">
            <span className="bell-empty-icon" aria-hidden="true">
              <BellOff size={20} strokeWidth={1.75} />
            </span>
            <span className="bell-empty-title">No notifications</span>
            <span className="bell-empty-sub">You're all caught up — no follow-ups pending.</span>
          </div>
        ) : displayItems.map((item: any) => {
          const status = item._status as Status;
          return (
            <button
              key={item.id}
              onClick={() => { onLeadClick(item.id); setOpen(false); }}
              className="bell-item"
              role="listitem"
              aria-label={`${item.leadName}, ${STATUS_CFG[status].label}${item.activeFollowUpDate ? `, due ${formatShortDate(item.activeFollowUpDate)}` : ""}`}
              type="button"
            >
              <span className={`bell-item-icon ${STATUS_CFG[status].iconClass}`} aria-hidden="true">
                <Briefcase size={15} strokeWidth={1.9} />
              </span>
              <span className="bell-item-body">
                <span className="bell-item-top">
                  <span className="bell-item-name" title={item.leadName}>{item.leadName}</span>
                  <StatusPill status={status} />
                </span>
                {item.dealHandler && (
                  <span className="bell-item-meta bell-item-meta--user">
                    <User size={12} strokeWidth={2} aria-hidden="true" />
                    <span>{resolveName(item.dealHandler)}</span>
                  </span>
                )}
                <span className="bell-item-meta">
                  <CalendarDays size={12} strokeWidth={2} aria-hidden="true" />
                  <span>{item.activeFollowUpDate ? formatShortDate(item.activeFollowUpDate) : "—"}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="bell-divider" />

      {/* Footer */}
      <div className="bell-footer">
        <button
          onClick={() => { setLocation("/follow-up"); setOpen(false); }}
          className="bell-cta"
          type="button"
        >
          View All Follow-Ups
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
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
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
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
