export default function CardPreview({ card }) {
  return (
    <div
      style={{
        width: 304,
        background: 'color-mix(in srgb, var(--doc-surface) 94%, transparent)',
        border: '1px dashed var(--panel-border-strong)',
        borderRadius: 26,
        padding: 16,
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'none',
        transform: 'rotate(2deg)',
      }}
    >
      {card.images && card.images[0] ? (
        <div style={{ width: '100%', height: 78, marginBottom: 12, overflow: 'hidden', borderRadius: 18 }}>
          <img src={card.images[0].src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.82 }} />
        </div>
      ) : null}

      <div style={{ fontSize: '15px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6 }}>
        {card.title}
      </div>

      {card.description ? (
        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          {card.description.slice(0, 88)}
          {card.description.length > 88 ? '...' : ''}
        </p>
      ) : null}
    </div>
  )
}
