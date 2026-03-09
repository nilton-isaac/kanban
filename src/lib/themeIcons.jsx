import { Zap, Radiation, Sword, Droplets, Snowflake, Cpu } from 'lucide-react'

const THEME_ICON_MAP = {
  cyberpunk: Zap,
  fallout: Radiation,
  darkest: Sword,
  liquidglass: Droplets,
  frostpunk: Snowflake,
  nier: Cpu,
}

export function ThemeIcon({ themeId, size = 14, strokeWidth = 2, style }) {
  const Icon = THEME_ICON_MAP[themeId] || Zap
  return <Icon size={size} strokeWidth={strokeWidth} style={style} />
}
