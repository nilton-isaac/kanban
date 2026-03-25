import { useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const FLAKE_COUNT = 48
const EMBER_COUNT = 28
const SPARK_COUNT = 18

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

  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 7 + Math.random() * 8,
        delay: Math.random() * 6,
        drift: -42 + Math.random() * 84,
        opacity: 0.25 + Math.random() * 0.5,
      })),
    []
  )

  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 5,
        duration: 6 + Math.random() * 7,
        delay: Math.random() * 5,
        drift: -22 + Math.random() * 44,
        opacity: 0.2 + Math.random() * 0.4,
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
      </div>
    )
  }

  if (theme === 'darksouls') {
    return (
      <div className="darksouls-overlay" aria-hidden="true">
        <div className="darksouls-bonfire-glow" />
        <div className="darksouls-embers">
          {embers.map(ember => (
            <span
              key={ember.id}
              className="darksouls-ember"
              style={{
                left: `${ember.left}%`,
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                opacity: ember.opacity,
                animationDuration: `${ember.duration}s`,
                animationDelay: `${ember.delay}s`,
                '--drift-x': `${ember.drift}px`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (theme === 'royale') {
    return (
      <div className="royale-overlay" aria-hidden="true">
        <div className="royale-vignette" />
        <div className="royale-sparks">
          {sparks.map(spark => (
            <span
              key={spark.id}
              className="royale-spark"
              style={{
                left: `${spark.left}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                opacity: spark.opacity,
                animationDuration: `${spark.duration}s`,
                animationDelay: `${spark.delay}s`,
                '--drift-x': `${spark.drift}px`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return null
}
