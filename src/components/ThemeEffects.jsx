import { useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const FLAKE_COUNT = 48

export default function ThemeEffects() {
  const { theme } = useTheme()

  const flakes = useMemo(
    () =>
      Array.from({ length: FLAKE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 8 + Math.random() * 10,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 8,
        drift: -16 + Math.random() * 32,
        opacity: 0.18 + Math.random() * 0.45,
      })),
    []
  )

  if (theme === 'frostpunk') {
    return (
      <div className="frost-snow" aria-hidden="true">
        {flakes.map(flake => (
          <span
            key={flake.id}
            className="frost-snowflake"
            style={{
              left: `${flake.left}%`,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
              animationDuration: `${flake.duration}s`,
              animationDelay: `${flake.delay}s`,
              '--drift-x': `${flake.drift}px`,
            }}
          />
        ))}
      </div>
    )
  }

  if (theme === 'nier') {
    return (
      <div className="nier-overlay" aria-hidden="true">
        <div className="nier-deco-line nier-deco-top" />
        <div className="nier-deco-line nier-deco-bottom" />
        <div className="nier-sweep-line" />
      </div>
    )
  }

  return null
}
