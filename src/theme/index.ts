// theme — the design system: colors, spacing, text sizes.
// Screens never write a color like '#4F46E5' directly; they use colors.primary.

export const colors = {
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  forgot: '#DC2626',
  forgotSoft: '#FEE2E2',
  hard: '#D97706',
  hardSoft: '#FEF3C7',
  easy: '#059669',
  easySoft: '#D1FAE5',
  exam: '#7C3AED',
  examSoft: '#F3E8FF',
  newCard: '#93C5FD',
  learning: '#4F46E5',
  mature: '#059669',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const font = {
  small: 13,
  body: 16,
  title: 18,
  heading: 22,
  big: 32,
} as const;
