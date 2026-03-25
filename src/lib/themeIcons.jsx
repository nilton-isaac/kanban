import { MoonStar, SunMedium } from 'lucide-react'

const THEME_ICON_MAP = {
  light: SunMedium,
  dark: MoonStar,
}

export function ThemeIcon({ themeId, size = 14, strokeWidth = 2, style }) {
  const Icon = THEME_ICON_MAP[themeId] || MoonStar
  return <Icon size={size} strokeWidth={strokeWidth} style={style} />
}
