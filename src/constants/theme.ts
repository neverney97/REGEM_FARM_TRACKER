import { Colors } from './colors';
import { FontSize, FontWeight, FontFamily, LineHeight } from './typography';
import { Spacing, BorderRadius, Shadow } from './spacing';

export const Theme = {
  colors: Colors,
  fontSize: FontSize,
  fontWeight: FontWeight,
  fontFamily: FontFamily,
  lineHeight: LineHeight,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadow: Shadow,
};

export type AppTheme = typeof Theme;

export { Colors, FontSize, FontWeight, FontFamily, Spacing, BorderRadius, Shadow };