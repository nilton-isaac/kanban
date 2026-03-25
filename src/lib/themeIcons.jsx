import {
  Crown,
  Cpu,
  Droplets,
  Flame,
  MoonStar,
  Radiation,
  Snowflake,
  SunMedium,
  Sword,
  Zap,
} from 'lucide-react'

const THEME_ICON_MAP = {
  dark: MoonStar,
  light: SunMedium,
  cyberpunk: Zap,
  fallout: Radiation,
  darkest: Sword,
  liquidglass: Droplets,
  frostpunk: Snowflake,
  nier: Cpu,
  darksouls: Flame,
  royale: Crown,
}

export function ThemeIcon({ themeId, size = 14, strokeWidth = 2, style }) {
  const Icon = THEME_ICON_MAP[themeId] || MoonStar
  return <Icon size={size} strokeWidth={strokeWidth} style={style} />
}
