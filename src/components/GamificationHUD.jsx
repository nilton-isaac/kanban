import { useState, useEffect } from 'react'
import { computeLevel, getLevelTitle, getLevelColor } from '../lib/gamification'

// Floating XP notification
function XpToast({ earned, show }) {
  if (!show) return null
  return (
    <div style={{
      position: 'fixed', top: 140, right: 24, zIndex: 500,
      padding: '6px 14px',
      background: 'rgba(0,0,0,0.9)',
      border: '1px solid var(--neon-yellow)',
      color: 'var(--neon-yellow)',
      fontFamily: 'var(--font-heading)',
      fontSize: 12, letterSpacing: 2,
      animation: 'slideUp 2.5s ease forwards',
      pointerEvents: 'none',
    }}>
      +{earned} XP ⭐
    </div>
  )
}

// Level up banner
function LevelUpBanner({ level, show }) {
  if (!show) return null
  return (
    <div style={{
      position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
      zIndex: 600,
      padding: '20px 40px',
      background: 'rgba(0,0,0,0.95)',
      border: '2px solid var(--neon-yellow)',
      boxShadow: '0 0 40px var(--neon-yellow)',
      textAlign: 'center',
      animation: 'levelUpPop 3s ease forwards',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
      <div style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-heading)', fontSize: 22, letterSpacing: 4 }}>
        LEVEL UP!
      </div>
      <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-heading)', fontSize: 16, marginTop: 6, letterSpacing: 2 }}>
        Nível {level} — {getLevelTitle(level)}
      </div>
    </div>
  )
}

// Compact HUD strip shown in header area
export function GamificationStrip({ gameState }) {
  const xpInfo = computeLevel(gameState?.totalXp || 0)
  const lvColor = getLevelColor(xpInfo.level)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #333', minWidth: 180 }}>
      <div style={{ color: lvColor, fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap' }}>
        LV.{xpInfo.level}
      </div>
      <div style={{ flex: 1, minWidth: 60 }}>
        <div style={{ height: 4, background: '#222', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${xpInfo.progress * 100}%`,
            background: lvColor,
            boxShadow: `0 0 4px ${lvColor}`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ color: '#444', fontFamily: 'var(--font-body)', fontSize: 8, marginTop: 1 }}>
          {xpInfo.currentXp}/{xpInfo.xpForNext}
        </div>
      </div>
      <div style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: 8, whiteSpace: 'nowrap' }}>
        {getLevelTitle(xpInfo.level)}
      </div>
    </div>
  )
}

// Main gamification HUD wrapper with notification logic
export default function GamificationHUD({ gameState, lastXpEvent }) {
  const [showXp, setShowXp] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [xpAmount, setXpAmount] = useState(0)
  const [levelUpValue, setLevelUpValue] = useState(1)

  useEffect(() => {
    if (!lastXpEvent) return
    setXpAmount(lastXpEvent.earned)
    setShowXp(true)
    setTimeout(() => setShowXp(false), 2500)

    if (lastXpEvent.leveledUp) {
      setLevelUpValue(lastXpEvent.newLevel)
      setShowLevelUp(true)
      setTimeout(() => setShowLevelUp(false), 3000)
    }
  }, [lastXpEvent])

  return (
    <>
      <XpToast earned={xpAmount} show={showXp} />
      <LevelUpBanner level={levelUpValue} show={showLevelUp} />
      {/* CSS animations */}
      <style>{`
        @keyframes slideUp {
          0%   { opacity: 0; transform: translateY(0px); }
          20%  { opacity: 1; transform: translateY(-10px); }
          80%  { opacity: 1; transform: translateY(-20px); }
          100% { opacity: 0; transform: translateY(-35px); }
        }
        @keyframes levelUpPop {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.8); }
          15%  { opacity: 1; transform: translate(-50%,-50%) scale(1.05); }
          85%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(0.9); }
        }
      `}</style>
    </>
  )
}
