import { LEAD_TYPE_CONFIG } from "@/lib/lead-type-config";

interface LeadTypeBadgeProps {
  type?: string | null;
  size?: number;
}

export function LeadTypeBadge({ type, size = 14 }: LeadTypeBadgeProps) {
  if (!type) return null;
  const cfg = LEAD_TYPE_CONFIG[type];
  if (!cfg) return null;
  const { icon: Icon, label, badgeClass } = cfg;
  return (
    <span className={`badge ${badgeClass}`} style={{ gap: 5 }}>
      <Icon size={size} style={{ flexShrink: 0 }} />
      <span>{label}</span>
    </span>
  );
}

export function LeadTypeIcon({ type, size = 16 }: { type?: string | null; size?: number }) {
  if (!type) return null;
  const cfg = LEAD_TYPE_CONFIG[type];
  if (!cfg) return null;
  const { icon: Icon } = cfg;
  return <Icon size={size} style={{ flexShrink: 0 }} />;
}
