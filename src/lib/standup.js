import { normalizeThemeId } from '../themes'

const THEMES_STANDUP = {
  cyberpunk: {
    header: (date) => `CYBER STANDUP // ${date.toUpperCase()}`,
    section: (title, count) => `[${title}] (${count})`,
    noneInColumn: '- sem itens -',
    noColumns: 'Nenhuma coluna cadastrada.',
    footer: '// END TRANSMISSION',
  },
  fallout: {
    header: (date) => `PIP-BOY STANDUP // ${date.toUpperCase()}`,
    section: (title, count) => `>_ ${title} [${count}]`,
    noneInColumn: '--- sem registros ---',
    noColumns: 'Nenhuma coluna cadastrada.',
    footer: '[ VAULT-TEC APPROVED ]',
  },
  darkest: {
    header: (date) => `REGISTRO DA MASMORRA // ${date.toUpperCase()}`,
    section: (title, count) => `* ${title} (${count})`,
    noneInColumn: 'Nenhum feito registrado.',
    noColumns: 'Nenhuma coluna cadastrada.',
    footer: '- Arquivado no Tomo da Guilda -',
  },
  liquidglass: {
    header: (date) => `GLASSBOARD STANDUP // ${date.toUpperCase()}`,
    section: (title, count) => `- ${title} (${count})`,
    noneInColumn: 'No items.',
    noColumns: 'No columns yet.',
    footer: '// smooth close',
  },
}

const STATUS_BADGE = {
  done: '[DONE]',
  blocked: '[BLOCKED]',
  progress: '[IN PROGRESS]',
  review: '[REVIEW]',
  todo: '[TODO]',
}

function getTheme(themeId) {
  return normalizeThemeId(themeId)
}

function orderColumns(columns) {
  return [...columns].sort((a, b) => {
    const pa = a.position ?? 0
    const pb = b.position ?? 0
    if (pa !== pb) return pa - pb
    return String(a.index || a.title || '').localeCompare(String(b.index || b.title || ''))
  })
}

export function generateStandupMessage(columns, cards, theme = 'cyberpunk') {
  const themeId = getTheme(theme)
  const t = THEMES_STANDUP[themeId] || THEMES_STANDUP.cyberpunk
  const orderedColumns = orderColumns(columns)

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const lines = [t.header(dateStr), '']

  if (orderedColumns.length === 0) {
    lines.push(t.noColumns)
    lines.push('')
    lines.push(t.footer)
    return lines.join('\n')
  }

  orderedColumns.forEach((col) => {
    const colCards = cards.filter((c) => c.columnId === col.id && !c.excluded_from_standup)
    const title = col.title || `COLUNA ${col.index || ''}`.trim()
    lines.push(t.section(title, colCards.length))

    if (colCards.length === 0) {
      lines.push(`  ${t.noneInColumn}`)
    } else {
      colCards.forEach((card) => {
        const badge = STATUS_BADGE[card.status] ? ` ${STATUS_BADGE[card.status]}` : ''
        lines.push(`  - ${card.title}${badge}`)
      })
    }

    lines.push('')
  })

  lines.push(t.footer)
  return lines.join('\n')
}

export function generateWeeklySummary(logs, theme = 'cyberpunk') {
  if (!logs || logs.length === 0) {
    return 'Nenhum standup registrado nesta semana.'
  }

  const themeId = getTheme(theme)
  const first = new Date(logs[0].log_date).toLocaleDateString('pt-BR')
  const last = new Date(logs[logs.length - 1].log_date).toLocaleDateString('pt-BR')

  const headers = {
    cyberpunk: `RESUMO SEMANAL // ${first} -> ${last}`,
    fallout: `RELATORIO SEMANAL VAULT-TEC // ${first} -> ${last}`,
    darkest: `CRONICA DA SEMANA // ${first} -> ${last}`,
    liquidglass: `WEEKLY FLOW // ${first} -> ${last}`,
  }

  const lines = [headers[themeId] || headers.cyberpunk, '']

  logs.forEach((log) => {
    const d = new Date(log.log_date)
    const label = d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).toUpperCase()
    lines.push(`---- ${label} ----`)
    lines.push(log.message)
    lines.push('')
  })

  return lines.join('\n').trim()
}

export function applyNextDay(columns, cards) {
  const yesterdayCol = columns.find((c) => c.role === 'yesterday')
  const todayCol = columns.find((c) => c.role === 'today')

  if (!todayCol) return cards

  return cards.map((card) => {
    if (card.columnId !== todayCol.id) return card

    if (card.status === 'done') {
      return yesterdayCol ? { ...card, columnId: yesterdayCol.id } : card
    }

    if (card.status === 'todo') {
      return { ...card, excluded_from_standup: true }
    }

    return card
  })
}
