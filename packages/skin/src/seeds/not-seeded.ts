// Design notes: ./README.md#not-seeded

export const NOT_SEEDED: Readonly<Record<string, string>> = {
  shadows:
    "in dark mode elevation is given by lightness, not by shadow: deriving from a seed would produce a shadow that shouldn't be there",
  translucency:
    "behaves differently on light and dark backgrounds; only the declared `alpha` row is derived, the rest is left to the person",
  fonts: "not a color: nothing is derived from a color seed for these",
  radii: "not a color",
  density: "not a color",
};
