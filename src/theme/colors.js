// Theme tokens for Nadoda Rajput Connect Mobile App
export const COLORS = {
  bgDark: '#0B1120',
  bgSurface: '#0F172A',
  bgElevated: '#1E293B',
  bgCard: '#182235',
  bgGlass: 'rgba(255, 255, 255, 0.05)',

  // Brand Accents
  amber: '#F59E0B',
  amberDark: '#D97706',
  amberLight: '#FBBF24',
  amberGlow: 'rgba(245, 158, 11, 0.2)',

  // Semantic
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldBg: 'rgba(16, 185, 129, 0.15)',

  blue: '#3B82F6',
  blueLight: '#60A5FA',
  blueBg: 'rgba(59, 130, 246, 0.15)',

  rose: '#F43F5E',
  roseLight: '#FB7185',
  roseBg: 'rgba(244, 63, 94, 0.15)',

  purple: '#8B5CF6',
  purpleBg: 'rgba(139, 92, 246, 0.15)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderAmber: 'rgba(245, 158, 11, 0.4)',

  // Gradients
  goldGradient: ['#F59E0B', '#D97706'],
  maleGradient: ['#3B82F6', '#1D4ED8'],
  femaleGradient: ['#F43F5E', '#BE123C'],
  cardGradient: ['rgba(30, 41, 59, 0.85)', 'rgba(15, 23, 42, 0.95)'],
  instagramRing: ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6']
};

export const colors = {
  bgBase: COLORS.bgDark,
  bgSurface: COLORS.bgSurface,
  bgElevated: COLORS.bgElevated,
  bgCard: COLORS.bgCard,
  amberPrimary: COLORS.amber,
  amberLight: COLORS.amberLight,
  amberDark: COLORS.amberDark,
  emerald: COLORS.emerald,
  blue: COLORS.blue,
  rose: COLORS.rose,
  purple: COLORS.purple,
  textPrimary: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  textMuted: COLORS.textMuted,
  borderSubtle: COLORS.border,
  borderMedium: COLORS.borderAmber,
  ...COLORS
};

export default COLORS;
