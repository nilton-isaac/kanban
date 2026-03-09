import { normalizeThemeId } from '../themes'

export const SUMMARY_CONFIG = {
  columnOrder: 'position', // position | alphabetical
  includeEmptyColumns: true,
  linePrefix: '  - ',
  showStatusBadge: true,
  orderedColumnIds: null,
  includeColumnIds: null,
  customDateText: null,
  customHeader: null,
  customFooter: null,
}

export const NEXT_DAY_CONFIG = {
  sourceRole: 'today',
  doneTargetRole: 'yesterday',
  doneStatuses: ['done'],
  limboStatuses: ['todo'],
  keepStatuses: ['progress', 'review', 'blocked'],
  hideFromStandupOnLimbo: true,
}

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

function sortColumns(columns, columnOrder) {
  const ordered = [...columns]
  if (columnOrder === 'alphabetical') {
    return ordered.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
  }

  return ordered.sort((a, b) => {
    const pa = a.position ?? 0
    const pb = b.position ?? 0
    if (pa !== pb) return pa - pb
    return String(a.index || a.title || '').localeCompare(String(b.index || b.title || ''))
  })
}

function applyColumnIdOrder(columns, orderedColumnIds) {
  if (!orderedColumnIds || orderedColumnIds.length === 0) return columns
  const orderMap = new Map(orderedColumnIds.map((id, idx) => [id, idx]))
  return [...columns].sort((a, b) => {
    const ai = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER
    const bi = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER
    if (ai !== bi) return ai - bi
    return String(a.title || '').localeCompare(String(b.title || ''))
  })
}

export function generateStandupMessage(columns, cards, theme = 'cyberpunk', config = SUMMARY_CONFIG) {
  const themeId = getTheme(theme)
  const t = THEMES_STANDUP[themeId] || THEMES_STANDUP.cyberpunk
  const baseOrderedColumns = sortColumns(columns, config.columnOrder)
  const customOrderedColumns = applyColumnIdOrder(baseOrderedColumns, config.orderedColumnIds)
  const orderedColumns = config.includeColumnIds
    ? customOrderedColumns.filter((c) => config.includeColumnIds.includes(c.id))
    : customOrderedColumns

  const dateStr = config.customDateText || new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const headerLine = config.customHeader && config.customHeader.trim().length > 0
    ? config.customHeader.replaceAll('{date}', dateStr)
    : t.header(dateStr)
  const footerLine = config.customFooter && config.customFooter.trim().length > 0
    ? config.customFooter.replaceAll('{date}', dateStr)
    : t.footer

  const lines = [headerLine, '']

  if (orderedColumns.length === 0) {
    lines.push(t.noColumns)
    lines.push('')
    lines.push(footerLine)
    return lines.join('\n')
  }

  orderedColumns.forEach((col) => {
    const colCards = cards.filter((c) => c.columnId === col.id && !c.excluded_from_standup)
    if (!config.includeEmptyColumns && colCards.length === 0) return

    const title = col.title || `COLUNA ${col.index || ''}`.trim()
    lines.push(t.section(title, colCards.length))

    if (colCards.length === 0) {
      lines.push(`  ${t.noneInColumn}`)
    } else {
      colCards.forEach((card) => {
        const badge = config.showStatusBadge && STATUS_BADGE[card.status] ? ` ${STATUS_BADGE[card.status]}` : ''
        lines.push(`${config.linePrefix}${card.title}${badge}`)
      })
    }

    lines.push('')
  })

  lines.push(footerLine)
  return lines.join('\n')
}

export function getNextDayImpact(columns, cards, config = NEXT_DAY_CONFIG) {
  const sourceColumn = columns.find((c) => c.role === config.sourceRole)
  const doneTargetColumn = columns.find((c) => c.role === config.doneTargetRole)
  const sourceCards = sourceColumn ? cards.filter((c) => c.columnId === sourceColumn.id) : []

  const doneCount = sourceCards.filter((c) => config.doneStatuses.includes(c.status)).length
  const limboCount = sourceCards.filter((c) => config.limboStatuses.includes(c.status)).length
  const keepCount = sourceCards.filter((c) => config.keepStatuses.includes(c.status)).length

  return {
    hasSourceColumn: Boolean(sourceColumn),
    sourceColumnTitle: sourceColumn?.title || null,
    doneTargetTitle: doneTargetColumn?.title || null,
    doneCount,
    limboCount,
    keepCount,
  }
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

export function applyNextDay(columns, cards, config = NEXT_DAY_CONFIG) {
  const sourceColumn = columns.find((c) => c.role === config.sourceRole)
  const doneTargetColumn = columns.find((c) => c.role === config.doneTargetRole)

  if (!sourceColumn) return cards

  return cards.map((card) => {
    if (card.columnId !== sourceColumn.id) return card

    if (config.doneStatuses.includes(card.status)) {
      return doneTargetColumn ? { ...card, columnId: doneTargetColumn.id } : card
    }

    if (config.limboStatuses.includes(card.status)) {
      return config.hideFromStandupOnLimbo ? { ...card, excluded_from_standup: true } : card
    }

    return card
  })
}
