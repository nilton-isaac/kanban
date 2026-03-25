// Ghost card shown during drag
export default function CardPreview({ card }) {
  return (
    <div
      style={{
        width: '300px',
        background: 'var(--surface-contrast)',
        border: '2px dashed var(--panel-border-strong)',
        padding: '12px',
        clipPath: 'none',
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'none',
        transform: 'rotate(2deg)',
      }}
    >
      {card.images && card.images[0] && (
        <div style={{ width: '100%', height: '60px', marginBottom: '8px', overflow: 'hidden' }}>
          <img src={card.images[0].src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        </div>
      )}
      <div style={{ fontSize: '12px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: 4 }}>
        {card.title}
      </div>
      {card.description && (
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          {card.description.slice(0, 60)}{card.description.length > 60 ? '...' : ''}
        </p>
      )}
    </div>
  )
}
