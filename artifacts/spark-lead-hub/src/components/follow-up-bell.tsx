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

const STATUS_CFG: Record<Status, { bg: string; color: string; label: string }> = {
  OVERDUE:  { bg: "rgba(239,68,68,0.15)",   color: "rgb(248,113,113)",  label: "Overdue"  },
  TODAY:    { bg: "rgba(34,197,94,0.15)",    color: "rgb(74,222,128)",   label: "Today"    },
  UPCOMING: { bg: "rgba(234,179,8,0.15)",    color: "rgb(250,204,21)",   label: "Upcoming" },
};

function StatusPill({ status }: { status: Status }) {
  const c = STATUS_CFG[status];
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 6, padding: "2px 8px",
      fontSize: 10, fontWeight: 700,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
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
        <span style={{ fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
          Follow-Ups
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {badgeCount > 0 && (
            <span style={{
              background: "rgba(239,68,68,0.15)", color: "rgb(248,113,113)",
              borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600,
            }}>
              {badgeCount} urgent
            </span>
          )}
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.65)",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px" }} />

      {/* Mobile handle bar */}
      {isMobile && (
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          width: 36, height: 4, borderRadius: 2,
          background: "rgba(255,255,255,0.2)",
        }} />
      )}

      {/* Items list */}
      <div style={{ padding: "8px 10px", maxHeight: isMobile ? "55svh" : 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {displayItems.length === 0 ? (
          <div style={{
            padding: "28px 12px", textAlign: "center",
            color: "rgba(255,255,255,0.35)", fontSize: 13,
          }}>
            🎉 No follow-ups pending
          </div>
        ) : displayItems.map((item: any) => (
          <button
            key={item.id}
            onClick={() => { onLeadClick(item.id); setOpen(false); }}
            style={{
              width: "100%", textAlign: "left",
              background: "transparent", border: "none",
              borderRadius: 12, padding: "10px 12px",
              cursor: "pointer", transition: "background 0.12s",
              minHeight: 44,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Row: name + badge */}
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: 8, marginBottom: 5,
            }}>
              <span style={{
                fontWeight: 600, fontSize: 13,
                color: "rgba(255,255,255,0.88)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                minWidth: 0, flex: 1,
              }}>
                {item.leadName}
              </span>
              <StatusPill status={item._status as Status} />
            </div>
            {/* Row: date + handler */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
                📅 {item.activeFollowUpDate ? formatShortDate(item.activeFollowUpDate) : "—"}
              </span>
              {item.dealHandler && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  👤 {resolveName(item.dealHandler)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px" }} />

      {/* Footer */}
      <div style={{ padding: "10px 12px 12px" }}>
        <button
          onClick={() => { setLocation("/follow-up"); setOpen(false); }}
          style={{
            width: "100%",
            background: "rgba(45,212,191,0.07)",
            border: "1px solid rgba(45,212,191,0.2)",
            borderRadius: 12,
            color: "rgb(45,212,191)", fontWeight: 600, fontSize: 13,
            padding: "10px 0", cursor: "pointer",
            transition: "background 0.15s",
            minHeight: 44,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,212,191,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(45,212,191,0.07)")}
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
        style={{
          position: "relative",
          background: open
            ? "rgba(255,255,255,0.08)"
            : "transparent",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 12,
          padding: "8px 10px",
          cursor: "pointer",
          color: badgeCount > 0 ? "rgb(248,113,113)" : "rgba(255,255,255,0.65)",
          display: "flex", alignItems: "center",
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
          minWidth: 44, minHeight: 44, justifyContent: "center",
        }}
        onMouseEnter={e => {
          if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = badgeCount > 0 ? "rgb(248,113,113)" : "rgba(255,255,255,0.9)";
        }}
        onMouseLeave={e => {
          if (!open) e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = badgeCount > 0 ? "rgb(248,113,113)" : "rgba(255,255,255,0.65)";
        }}
      >
        <Bell size={20} strokeWidth={1.75} />
        {badgeCount > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: "rgb(239,68,68)", color: "#fff",
            borderRadius: 999, padding: "0 5px",
            fontSize: 10, fontWeight: 700,
            minWidth: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
            boxShadow: "0 0 0 2px hsl(222 25% 9%)",
          }}>
            {badgeLabel}
          </span>
        )}
      </button>

      {/* ── Desktop popover ── */}
      {open && !isMobile && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 9999,
          width: 320,
          background: "hsl(222, 25%, 8%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
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
            style={{
              position: "fixed",
              inset: 0,
              background: "hsl(222 22% 3% / 0.65)",
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
              background: "hsl(222, 25%, 8%)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
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
