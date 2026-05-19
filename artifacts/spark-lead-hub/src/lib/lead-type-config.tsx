import { TrendingUp, SunMedium, Snowflake, UserX, type LucideIcon } from "lucide-react";

export interface LeadTypeEntry {
  icon: LucideIcon;
  label: string;
  badgeClass: string;
}

export const LEAD_TYPE_CONFIG: Record<string, LeadTypeEntry> = {
  hot:     { icon: TrendingUp, label: "Hot",     badgeClass: "badge-hot" },
  warm:    { icon: SunMedium,  label: "Warm",    badgeClass: "badge-warm" },
  cold:    { icon: Snowflake,  label: "Cold",    badgeClass: "badge-cold" },
  ghosted: { icon: UserX,      label: "Ghosted", badgeClass: "badge-ghosted" },
};

export const LEAD_TYPE_FILTER_OPTIONS = Object.entries(LEAD_TYPE_CONFIG).map(
  ([value, { label }]) => ({ value, label }),
);

export function leadTypeSelectOptions(iconSize = 14) {
  return Object.entries(LEAD_TYPE_CONFIG).map(([value, { icon: Icon, label }]) => ({
    value,
    label,
    prefix: <Icon size={iconSize} style={{ flexShrink: 0 }} />,
  }));
}
