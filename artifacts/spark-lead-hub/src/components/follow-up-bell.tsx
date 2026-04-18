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

const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string; label: string }> = {
  OVERDUE:  { bg: "hsl(0 80% 50% / 0.12)",   color: "hsl(0 80% 62%)",    border: "hsl(0 80% 50% / 0.28)",   label: "Overdue"  },
  TODAY:    { bg: "hsl(150 65% 42% / 0.12)", color: "hsl(150 65% 52%)",  border: "hsl(150 65% 42% / 0.28)", label: "Today"    },
  UPCOMING: { bg: "hsl(45 90% 50% / 0.12)",  color: "hsl(45 90% 62%)",   border: "hsl(45 90% 50% / 0.28)",  label: "Upcoming" },
};

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 5, padding: "1px 7px",
      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      ● {s.label}
    </span>
  );
}

interface Props {
  onLeadClick: (id: string) => void;
}

export function FollowUpBell({ onLeadClick }: Props) {
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const [, setLocation]   = useLocation();
  const { resolveName }   = useUserMap();

  const { data: raw = [] } = useGetLeads(undefined, {
    query: { refetchInterval: 60_000, refetchOnWindowFocus: true },
  });
  const leads = raw as any[];

  const enriched = leads
    .filter((l: any) => !!l.activeFollowUpDate)
    .map((l: any) => ({ ...l, status: getStatus(l.activeFollowUpDate as string) }))
    .sort((a: any, b: any) => {
      const order: Record<Status, number> = { OVERDUE: 0, TODAY: 1, UPCOMING: 2 };
      if (order[a.status as Status] !== order[b.status as Status])
        return order[a.status as Status] - order[b.status as Status];
      return new Date(a.activeFollowUpDate).getTime() - new Date(b.activeFollowUpDate).getTime();
    });

  const badgeCount   = enriched.filter((l: any) => l.status === "OVERDUE" || l.status === "TODAY").length;
  const displayItems = enriched.slice(0, 5);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Follow-up notifications"
        style={{
          position: "relative",
          background: open ? "var(--bg-hover, hsl(222 18% 14%))" : "transparent",
          border: `1px solid ${badgeCount > 0 ? "hsl(0 80% 50% / 0.35)" : "var(--border)"}`,
          borderRadius: "var(--radius-md)",
          padding: "6px 10px",
          cursor: "pointer",
          color: badgeCount > 0 ? "hsl(0 80% 62%)" : "var(--text-secondary)",
          display: "flex", alignItems: "center",
          transition: "all 0.15s",
        }}
      >
        <Bell size={16} />
        {badgeCount > 0 && (
          <span style={{
            position: "absolute", top: -7, right: -7,
            background: "hsl(0 80% 55%)", color: "#fff",
            borderRadius: 999, padding: "0 5px",
            fontSize: 10, fontWeight: 700,
            minWidth: 17, height: 17,
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, boxShadow: "0 0 0 2px var(--bg-base)",
          }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown popover */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 9999,
          width: 310,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", boxShadow: "0 16px 48px hsl(222 40% 4% / 0.6)",
          overflow: "hidden",
        }}>
          {/* Popover header */}
          <div style={{
            padding: "11px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
              Follow-Ups
            </span>
            {badgeCount > 0 && (
              <span style={{
                background: "hsl(0 80% 55% / 0.12)", color: "hsl(0 80% 62%)",
                border: "1px solid hsl(0 80% 55% / 0.25)",
                borderRadius: 999, padding: "1px 9px", fontSize: 11, fontWeight: 600,
              }}>
                {badgeCount} urgent
              </span>
            )}
          </div>

          {/* Items list */}
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {displayItems.length === 0 ? (
              <div style={{
                padding: "28px 16px", textAlign: "center",
                color: "var(--text-muted)", fontSize: 13,
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
                  borderBottom: "1px solid var(--border)",
                  padding: "10px 16px", cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover, hsl(222 18% 14%))")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 8, marginBottom: 4,
                }}>
                  <span style={{
                    fontWeight: 600, fontSize: 13, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    minWidth: 0, flex: 1,
                  }}>
                    {item.leadName}
                  </span>
                  <StatusBadge status={item.status as Status} />
                </div>
                <div style={{
                  fontSize: 11, color: "var(--text-muted)",
                  display: "flex", flexDirection: "column", gap: 2,
                }}>
                  <span>📅 {item.activeFollowUpDate ? formatShortDate(item.activeFollowUpDate) : "—"}</span>
                  {item.dealHandler && (
                    <span>👤 {resolveName(item.dealHandler)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => { setLocation("/follow-up"); setOpen(false); }}
              style={{
                width: "100%",
                background: "hsl(180 70% 40% / 0.08)",
                border: "1px solid hsl(180 70% 40% / 0.22)",
                borderRadius: "var(--radius-md)",
                color: "var(--teal)", fontWeight: 600, fontSize: 13,
                padding: "7px 0", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "hsl(180 70% 40% / 0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "hsl(180 70% 40% / 0.08)")}
            >
              View All Follow-Ups →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
