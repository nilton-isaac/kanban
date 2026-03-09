// Ghost card shown during drag
export default function CardPreview({ card }) {
  return (
    <div
      style={{
        width: '300px',
        background: 'rgba(10,15,30,0.95)',
        border: '2px dashed var(--neon-yellow)',
        padding: '12px',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
        boxShadow: '0 0 30px rgba(252,238,10,0.3)',
        pointerEvents: 'none',
        transform: 'rotate(2deg)',
      }}
    >
      {card.images && card.images[0] && (
        <div style={{ width: '100%', height: '60px', marginBottom: '8px', overflow: 'hidden' }}>
          <img src={card.images[0].src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        </div>
      )}
      <div style={{ fontSize: '12px', fontFamily: 'var(--font-heading)', color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>
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
