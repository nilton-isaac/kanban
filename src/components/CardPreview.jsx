import { useTheme } from '../contexts/ThemeContext'

// Ghost card shown during drag
export default function CardPreview({ card }) {
  const { theme } = useTheme()
  const isNier = theme === 'nier'

  return (
    <div
      style={{
        width: '300px',
        background: isNier ? 'rgba(244, 240, 232, 0.96)' : 'rgba(10,15,30,0.95)',
        border: `2px dashed ${isNier ? '#6d665e' : 'var(--neon-yellow)'}`,
        padding: '12px',
        clipPath: isNier ? 'none' : 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
        boxShadow: isNier ? '3px 3px 0 rgba(79, 75, 70, 0.25)' : '0 0 30px rgba(252,238,10,0.3)',
        pointerEvents: 'none',
        transform: 'rotate(2deg)',
      }}
    >
      {card.images && card.images[0] && (
        <div style={{ width: '100%', height: '60px', marginBottom: '8px', overflow: 'hidden' }}>
          <img src={card.images[0].src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        </div>
      )}
      <div style={{ fontSize: '12px', fontFamily: 'var(--font-heading)', color: isNier ? '#2f2b27' : '#fff', fontWeight: 'bold', marginBottom: 4 }}>
        {card.title}
      </div>
      {card.description && (
        <p style={{ fontSize: '11px', color: '#666', fontFamily: 'var(--font-body)' }}>
          {card.description.slice(0, 60)}{card.description.length > 60 ? '...' : ''}
        </p>
      )}
    </div>
  )
}
