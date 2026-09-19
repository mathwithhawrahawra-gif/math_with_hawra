/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#fff7fa",
      "foreground": "#351423",
      "border": "#f4d7e3",
      "card": "#ffffff",
      "cardForeground": "#351423",
      "popover": "#ffffff",
      "popoverForeground": "#351423",
      "primary": "#ff6b9d",
      "primaryForeground": "#ffffff",
      "secondary": "#ffd166",
      "secondaryForeground": "#4a2b00",
      "muted": "#fff0f5",
      "mutedForeground": "#8a6270",
      "accent": "#a855d6",
      "accentForeground": "#ffffff",
      "destructive": "#ef4444",
      "destructiveForeground": "#ffffff",
      "input": "#f4d7e3",
      "ring": "#ff6b9d",
      "chart1": "#ff6b9d",
      "chart2": "#ffd166",
      "chart3": "#a855d6",
      "chart4": "#60a5fa",
      "chart5": "#34c38f",
      "sidebar": "#fff0f5",
      "sidebarForeground": "#351423",
      "sidebarBorder": "#f4d7e3",
      "sidebarPrimary": "#ff6b9d",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#ffe4ee",
      "sidebarAccentForeground": "#351423",
      "sidebarRing": "#ff6b9d"
    },
    "dark": {
      "background": "#21131d",
      "foreground": "#fff4f8",
      "border": "#573146",
      "card": "#2d1a29",
      "cardForeground": "#fff4f8",
      "popover": "#2d1a29",
      "popoverForeground": "#fff4f8",
      "primary": "#ff78a6",
      "primaryForeground": "#351423",
      "secondary": "#ffd166",
      "secondaryForeground": "#4a2b00",
      "muted": "#3a2234",
      "mutedForeground": "#ddb9c9",
      "accent": "#c17be6",
      "accentForeground": "#351423",
      "destructive": "#f87171",
      "destructiveForeground": "#351423",
      "input": "#573146",
      "ring": "#ff78a6",
      "chart1": "#ff78a6",
      "chart2": "#ffd166",
      "chart3": "#c17be6",
      "chart4": "#7eb6ff",
      "chart5": "#55d5a5",
      "sidebar": "#2d1a29",
      "sidebarForeground": "#fff4f8",
      "sidebarBorder": "#573146",
      "sidebarPrimary": "#ff78a6",
      "sidebarPrimaryForeground": "#351423",
      "sidebarAccent": "#3a2234",
      "sidebarAccentForeground": "#fff4f8",
      "sidebarRing": "#ff78a6"
    }
  },
  "fontFamily": {
    "sans": [
      "Tajawal",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "Menlo",
      "monospace"
    ]
  },
  "radius": "1rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
