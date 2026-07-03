const base = import.meta.env.BASE_URL;

export const BRAND = {
  appName: "SparkLead",
  tagline: "SparkLead — Team Access",
  accentColor: "#00AEEC",
  logos: {
    ortLight: `${base}assets/branding/ort-logo-light.png`,
    ortDark:  `${base}assets/branding/ort-logo-dark.png`,
  },
} as const;
