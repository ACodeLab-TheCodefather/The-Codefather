export interface OfficialTheme {
  id: string;
  name: string;
  colors: readonly [string, string, string, string];
}

// Official 20 approved themes — exact names and HEX codes preserved without modification.
export const OFFICIAL_THEMES: readonly OfficialTheme[] = [
  { id: 'dark-techn',    name: 'Dark Techn',    colors: ['#2C2C2C', '#4A4A4A', '#7B2CBF', '#00A8FF'] },
  { id: 'neon-purple',   name: 'Neon Purple',   colors: ['#7B2CBF', '#9D4EDD', '#E02F9D', '#FF4DC4'] },
  { id: 'cyber-blue',    name: 'Cyber Blue',    colors: ['#00509E', '#00A8FF', '#00D2FF', '#00F0FF'] },
  { id: 'matrix-green',  name: 'Matrix Green',  colors: ['#0A5C36', '#10B981', '#00FF41', '#7FFF00'] },
  { id: 'crimson-red',   name: 'Crimson Red',   colors: ['#8B0000', '#DC143C', '#FF0000', '#FF7F50'] },
  { id: 'ocean-blue',    name: 'Ocean Blue',    colors: ['#003B5C', '#007BFF', '#00C4CC', '#40E0D0'] },
  { id: 'forest-green',  name: 'Forest Green',  colors: ['#1B4332', '#2D6A4F', '#40916C', '#52B788'] },
  { id: 'sunset-orange', name: 'Sunset Orange', colors: ['#C1121F', '#E85D04', '#F48C06', '#FFBA08'] },
  { id: 'royal-indigo',  name: 'Royal Indigo',  colors: ['#2B0B50', '#4B0082', '#673AB7', '#8C9EFF'] },
  { id: 'elegant-gold',  name: 'Elegant Gold',  colors: ['#D4AF37', '#C5A059', '#B89B72', '#F5F5DC'] },
  { id: 'minimal-light', name: 'Minimal Light', colors: ['#FFFFFF', '#D3D3D3', '#A9A9A9', '#C0C0C0'] },
  { id: 'minimal-dark',  name: 'Minimal Dark',  colors: ['#121212', '#2C2C2C', '#808080', '#F8F9FA'] },
  { id: 'pastel-pink',   name: 'Pastel Pink',   colors: ['#FFB6C1', '#FF69B4', '#FFC0CB', '#FFE4E1'] },
  { id: 'pastel-mint',   name: 'Pastel Mint',   colors: ['#98FF98', '#8FBC8F', '#B2FFDA', '#00FA9A'] },
  { id: 'pastel-blue',   name: 'Pastel Blue',   colors: ['#ADD8E6', '#87CEEB', '#B0E0E6', '#1E90FF'] },
  { id: 'nordic-gray',   name: 'Nordic Gray',   colors: ['#708090', '#B0C4DE', '#778899', '#D3D3D3'] },
  { id: 'teal-dream',    name: 'Teal Dream',    colors: ['#008080', '#20B2AA', '#00CED1', '#40E0D0'] },
  { id: 'violet-dream',  name: 'Violet Dream',  colors: ['#8A2BE2', '#B57EDC', '#DDA0DD', '#E6E6FA'] },
  { id: 'rose-gold',     name: 'Rose Gold',     colors: ['#B76E79', '#E8A2A2', '#C07C68', '#F7D8D5'] },
  { id: 'aqua-mint',     name: 'Aqua Mint',     colors: ['#006666', '#00B3B3', '#66CDAA', '#E0FFFF'] }
] as const;

export const DEFAULT_THEME_ID = 'dark-techn';

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickReadableText(bgHex: string): '#111111' | '#FFFFFF' {
  return contrastRatio(bgHex, '#FFFFFF') >= contrastRatio(bgHex, '#111111')
    ? '#FFFFFF'
    : '#111111';
}

export function mixHex(hexA: string, hexB: string, ratio: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * ratio);
  const g = Math.round(a[1] + (b[1] - a[1]) * ratio);
  const bl = Math.round(a[2] + (b[2] - a[2]) * ratio);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export interface ThemeTokens {
  theme: OfficialTheme;
  bg: string;
  bg2: string;
  accent: string;
  accent2: string;
  accentText: string;
  accent2Text: string;
  text: string;
  muted: string;
  surface: string;
  surface2: string;
  border: string;
  glass: string;
  bgRgb: string;
  textRgb: string;
  accentRgb: string;
  accent2Rgb: string;
  isDark: boolean;
}

export function computeThemeTokens(themeId: string): ThemeTokens {
  const theme = OFFICIAL_THEMES.find((t) => t.id === themeId) ?? OFFICIAL_THEMES[0];
  const [c1, c2, c3, c4] = theme.colors;
  const text = pickReadableText(c1);
  const isDark = text === '#FFFFFF';

  // Ensure secondary accent link/highlight text retains readable contrast against c1
  const readableAccent2 =
    contrastRatio(c1, c4) >= 3.2
      ? c4
      : contrastRatio(c1, c3) >= 3.2
        ? c3
        : isDark
          ? '#F8F9FA'
          : '#111111';

  // Ensure button accent has strong contrast for button label
  const buttonAccent =
    contrastRatio(c3, '#FFFFFF') >= 3.0 || contrastRatio(c3, '#111111') >= 3.0
      ? c3
      : c2;

  const rgbStr = (hex: string) => hexToRgb(hex).join(', ');

  return {
    theme,
    bg: c1,
    bg2: c2,
    accent: buttonAccent,
    accent2: readableAccent2,
    accentText: pickReadableText(buttonAccent),
    accent2Text: pickReadableText(readableAccent2),
    text,
    muted: mixHex(text, c1, 0.34),
    surface: mixHex(c1, text, isDark ? 0.065 : 0.045),
    surface2: mixHex(c1, text, isDark ? 0.12 : 0.09),
    border: mixHex(c1, text, isDark ? 0.19 : 0.16),
    glass: `rgba(${rgbStr(c1)}, 0.72)`,
    bgRgb: rgbStr(c1),
    textRgb: rgbStr(text),
    accentRgb: rgbStr(c3),
    accent2Rgb: rgbStr(c4),
    isDark
  };
}

export function applyThemeToDocument(themeId: string): ThemeTokens {
  const tokens = computeThemeTokens(themeId);
  if (typeof document !== 'undefined') {
    const st = document.documentElement.style;
    st.setProperty('--cf-bg', tokens.bg);
    st.setProperty('--cf-bg-2', tokens.bg2);
    st.setProperty('--cf-accent', tokens.accent);
    st.setProperty('--cf-accent-2', tokens.accent2);
    st.setProperty('--cf-accent-text', tokens.accentText);
    st.setProperty('--cf-accent-2-text', tokens.accent2Text);
    st.setProperty('--cf-text', tokens.text);
    st.setProperty('--cf-muted', tokens.muted);
    st.setProperty('--cf-surface', tokens.surface);
    st.setProperty('--cf-surface-2', tokens.surface2);
    st.setProperty('--cf-border', tokens.border);
    st.setProperty('--cf-glass', tokens.glass);
    st.setProperty('--cf-bg-rgb', tokens.bgRgb);
    st.setProperty('--cf-text-rgb', tokens.textRgb);
    st.setProperty('--cf-accent-rgb', tokens.accentRgb);
    st.setProperty('--cf-accent-2-rgb', tokens.accent2Rgb);
    st.colorScheme = tokens.isDark ? 'dark' : 'light';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tokens.bg);
  }
  return tokens;
}
