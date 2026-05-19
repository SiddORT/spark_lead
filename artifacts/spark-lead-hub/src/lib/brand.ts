const base = import.meta.env.BASE_URL;

export const BRAND = {
  appName: "SparkLead",
  tagline: "SparkLead — Team Access Only",
  accentColor: "#00AEEC",
  logos: {
    dark: {
      ort:       `${base}branding/ort-dark.png`,
      sparklead: `${base}branding/sparklead-dark.png`,
    },
    light: {
      ort:       `${base}branding/ort-light.png`,
      sparklead: `${base}branding/sparklead-light.png`,
    },
  },
} as const;
