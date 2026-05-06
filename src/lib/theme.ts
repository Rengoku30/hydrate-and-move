export const palette = {
  background: '#F8F9F4',
  card: '#FFFFFF',
  primary: '#2A9D8F',
  secondary: '#E9C46A',
  text: '#264653',
} as const;

export type PaletteKey = keyof typeof palette;
