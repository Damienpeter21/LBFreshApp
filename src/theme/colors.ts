import { ThemeColors } from './types';

// Palette Tokens:
// Deep Forest: #063B00
// Leaf Green:  #266210
// Fresh Lime:  #90B800
// Citrus Gold: #E1E100

export const lightColors: ThemeColors = {
  // Brand / Primary
  primary: '#266210',
  primaryVariant: '#063B00',
  onPrimary: '#FFFFFF',
  secondary: '#90B800',
  secondaryVariant: '#6F8E00',
  onSecondary: '#063B00',

  // Background & Surfaces
  background: '#F7FAF5',
  onBackground: '#063B00',
  surface: '#FFFFFF',
  onSurface: '#063B00',
  surfaceVariant: '#EDF5E8',
  onSurfaceVariant: '#35532B',
  card: '#FFFFFF',
  onCard: '#063B00',

  // Typography
  textPrimary: '#063B00',
  textSecondary: '#4A6940',
  textTertiary: '#8FA885',
  textDisabled: '#C2D4BC',
  textInverse: '#F7FAF5',

  // Borders & Dividers
  border: '#DFECE8',
  borderFocus: '#266210',
  divider: '#EDF5E8',

  // Feedback & Status
  success: '#266210',
  onSuccess: '#FFFFFF',
  successContainer: '#EDF5E8',
  warning: '#D6A800',
  onWarning: '#063B00',
  warningContainer: '#FFFCE0',
  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  info: '#0284C7',
  onInfo: '#FFFFFF',
  infoContainer: '#E0F2FE',

  // Interactive & Form Inputs
  inputBackground: '#FFFFFF',
  inputBorder: '#D2E4CC',
  inputPlaceholder: '#8FA885',
  disabled: '#EDF5E8',
  onDisabled: '#8FA885',
  ripple: 'rgba(38, 98, 16, 0.12)',
  backdrop: 'rgba(6, 59, 0, 0.5)',
};

export const darkColors: ThemeColors = {
  // Brand / Primary
  primary: '#90B800',
  primaryVariant: '#A4D000',
  onPrimary: '#063B00',
  secondary: '#E1E100',
  secondaryVariant: '#F7F740',
  onSecondary: '#063B00',

  // Background & Surfaces
  background: '#041600',
  onBackground: '#F4FBF0',
  surface: '#0B2904',
  onSurface: '#F4FBF0',
  surfaceVariant: '#143D0A',
  onSurfaceVariant: '#B8D9AF',
  card: '#0C2D06',
  onCard: '#F4FBF0',

  // Typography
  textPrimary: '#F4FBF0',
  textSecondary: '#A9CE9F',
  textTertiary: '#6F9764',
  textDisabled: '#3D5E34',
  textInverse: '#041600',

  // Borders & Dividers
  border: '#1B4710',
  borderFocus: '#90B800',
  divider: '#143D0A',

  // Feedback & Status
  success: '#90B800',
  onSuccess: '#063B00',
  successContainer: '#174708',
  warning: '#E1E100',
  onWarning: '#063B00',
  warningContainer: '#3B3B00',
  error: '#F87171',
  onError: '#450A0A',
  errorContainer: '#7F1D1D',
  info: '#38BDF8',
  onInfo: '#0C4A6E',
  infoContainer: '#075985',

  // Interactive & Form Inputs
  inputBackground: '#0B2904',
  inputBorder: '#1B4710',
  inputPlaceholder: '#6F9764',
  disabled: '#143D0A',
  onDisabled: '#6F9764',
  ripple: 'rgba(144, 184, 0, 0.18)',
  backdrop: 'rgba(0, 0, 0, 0.75)',
};
