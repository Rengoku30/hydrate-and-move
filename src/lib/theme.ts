export const palette = {
  wine: '#6E0D25',
  cream: '#FFFFB3',
  bronze: '#774E24',
  walnut: '#6A381F',
  sand: '#DCAB6B',
} as const;

export type PaletteKey = keyof typeof palette;
