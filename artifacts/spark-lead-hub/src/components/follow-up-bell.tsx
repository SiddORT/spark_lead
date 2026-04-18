import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useGetLeads } from "@workspace/api-client-react";
import { useUserMap } from "@/hooks/use-user-map";
import { useLocation } from "wouter";
import { formatShortDate } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";

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

  const { data: raw = [] } = useGetLeads(undefined, {
    query: { refetchInterval: 60_000, refetchOnWindowFocus: true },
  });
  const leads = raw as any[];

  const enriched = leads
    .filter((l: any) => !!l.activeFollowUpDate)
    .map((l: any) => ({ ...l, _status: getStatus(l.activeFollowUpDate as string) }))
    .sort((a: any, b: any) => {
      const order: Record<Status, number> = { OVERDUE: 0, TODAY: 1, UPCOMING: 2 };
      if (order[a._status as Status] !== order[b._status as Status])
        return order[a._status as Status] - order[b._status as Status];
      return new Date(a.activeFollowUpDate).getTime() - new Date(b.activeFollowUpDate).getTime();
    });

  const badgeCount   = enriched.filter((l: any) => l._status === "OVERDUE" || l._status === "TODAY").length;
  const displayItems = enriched.slice(0, 5);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const badgeLabel = badgeCount > 9 ? "9+" : String(badgeCount);

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

      {/* ── Popover ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 9999,
          width: 320,
          background: "hsl(222, 25%, 8%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
              Follow-Ups
            </span>
            {badgeCount > 0 && (
              <span style={{
                background: "rgba(239,68,68,0.15)", color: "rgb(248,113,113)",
                borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600,
              }}>
                {badgeCount} urgent
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px" }} />

          {/* Items list */}
          <div style={{ padding: "8px 10px", maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
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
                padding: "8px 0", cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,212,191,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(45,212,191,0.07)")}
            >
              View All Follow-Ups →
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
