import { AppColors } from './config/colors';

function toKebab(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

const colorsConfig = Object.fromEntries(
  Object.entries(AppColors).map(([k, v]) => [
    toKebab(k),
    `rgb(var(--color-${toKebab(k)}) / <alpha-value>)`,
  ])
);

export const darkMode = 'class';
export const content = ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'];
export const presets = [require('nativewind/preset')];
export const theme = {
  extend: {
    fontFamily: {
      'sans-regular': ['SourceSans3_400Regular'],
      'sans-medium': ['SourceSans3_500Medium'],
      'sans-semibold': ['SourceSans3_600SemiBold'],
      'sans-bold': ['SourceSans3_700Bold'],
    },
    fontSize: {
      xs: 12,
      sm: 13,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 36,
    },
    colors: colorsConfig,
  },
};
