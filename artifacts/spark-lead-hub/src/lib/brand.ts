const base = import.meta.env.BASE_URL;

export const BRAND = {
  appName: "SparkLead",
  tagline: "SparkLead — Team Access Only",
  accentColor: "#00AEEC",
  logos: {
    ort: `${base}assets/branding/ort-logo.png`,
  },
} as const;
