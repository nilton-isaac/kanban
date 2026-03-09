// ── Standup message generation ────────────────────────────────────────────────

const THEMES_STANDUP = {
  cyberpunk: {
    header:  (date) => `⚡ CYBER_STANDUP // ${date.toUpperCase()}`,
    done:    '✅ [ONTEM — REALIZADO]',
    today:   '🔄 [HOJE — EM EXECUÇÃO]',
    blocker: '🚫 [BLOQUEIOS ATIVOS]',
    none:    '— nada registrado —',
    footer:  '// END TRANSMISSION',
  },
  fallout: {
    header:  (date) => `☢ PIP-BOY STANDUP // ${date.toUpperCase()}`,
    done:    '>_ ONTEM — MISSÕES CONCLUÍDAS:',
    today:   '>_ HOJE — MISSÕES ATIVAS:',
    blocker: '>_ ALERTAS DE BLOQUEIO:',
    none:    '--- sem registros ---',
    footer:  '[ VAULT-TEC APPROVED ]',
  },
  detective: {
    header:  (date) => `🔎 RELATÓRIO DIÁRIO — ${date.toUpperCase()}`,
    done:    '■ CASOS ENCERRADOS ONTEM:',
    today:   '■ INVESTIGAÇÕES EM ANDAMENTO:',
    blocker: '■ OBSTÁCULOS NO CASO:',
    none:    'Nenhuma ocorrência registrada.',
    footer:  '— Arquivado pelo Detetive —',
  },
}

export function generateStandupMessage(columns, cards, theme = 'cyberpunk') {
  const t = THEMES_STANDUP[theme] || THEMES_STANDUP.cyberpunk

  const yesterdayCol = columns.find(c => c.role === 'yesterday')
  const todayCol     = columns.find(c => c.role === 'today')
  const blockerCol   = columns.find(c => c.role === 'blocker')

  const relevant = (col) =>
    col ? cards.filter(c => c.columnId === col.id && !c.excluded_from_standup) : []

  const yesterdayCards = relevant(yesterdayCol)
  const todayCards     = relevant(todayCol)
  const blockerCards   = relevant(blockerCol)

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const lines = []
  lines.push(t.header(dateStr))
  lines.push('')

  lines.push(t.done)
  if (yesterdayCards.length > 0) {
    yesterdayCards.forEach(c => lines.push(`  • ${c.title}${c.status === 'done' ? ' ✓' : ''}`))
  } else {
    lines.push(`  ${t.none}`)
  }
  lines.push('')

  lines.push(t.today)
  if (todayCards.length > 0) {
    todayCards.forEach(c => {
      const badge = c.status === 'done' ? ' ✓' : c.status === 'blocked' ? ' 🚫' : ''
      lines.push(`  • ${c.title}${badge}`)
    })
  } else {
    lines.push(`  ${t.none}`)
  }
  lines.push('')

  if (blockerCards.length > 0) {
    lines.push(t.blocker)
    blockerCards.forEach(c => lines.push(`  • ${c.title}`))
    lines.push('')
  }

  lines.push(t.footer)
  return lines.join('\n')
}

// ── Weekly summary ────────────────────────────────────────────────────────────

export function generateWeeklySummary(logs, theme = 'cyberpunk') {
  if (!logs || logs.length === 0) {
    return 'Nenhum standup registrado nesta semana.'
  }

  const first = new Date(logs[0].log_date).toLocaleDateString('pt-BR')
  const last  = new Date(logs[logs.length - 1].log_date).toLocaleDateString('pt-BR')

  const headers = {
    cyberpunk: `📊 RESUMO SEMANAL // ${first} → ${last}`,
    fallout:   `☢ RELATÓRIO SEMANAL VAULT-TEC // ${first} → ${last}`,
    detective: `🔎 RELATÓRIO SEMANAL // ${first} → ${last}`,
  }

  const lines = [headers[theme] || headers.cyberpunk, '']

  logs.forEach(log => {
    const d = new Date(log.log_date)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()
    lines.push(`──── ${label} ────`)
    lines.push(log.message)
    lines.push('')
  })

  return lines.join('\n').trim()
}

// ── Next-day transition logic ─────────────────────────────────────────────────
// Returns updated cards array after end-of-day transition

export function applyNextDay(columns, cards) {
  const yesterdayCol = columns.find(c => c.role === 'yesterday')
  const todayCol     = columns.find(c => c.role === 'today')

  if (!todayCol) return cards

  return cards.map(card => {
    if (card.columnId !== todayCol.id) return card

    if (card.status === 'done') {
      // Completed today → move to yesterday column
      return yesterdayCol
        ? { ...card, columnId: yesterdayCol.id }
        : card
    }

    if (card.status === 'todo') {
      // Never started → limbo (hidden from standup summaries)
      return { ...card, excluded_from_standup: true }
    }

    // progress / review / blocked → carry over to next day
    return card
  })
}
