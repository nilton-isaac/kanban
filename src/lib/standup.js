import { normalizeThemeId } from '../themes'

export const SUMMARY_CONFIG = {
  columnOrder: 'position', // position | alphabetical
  includeEmptyColumns: true,
  linePrefix: '  - ',
  showStatusBadge: true,
}

export const NEXT_DAY_CONFIG = {
  sourceRole: 'today',
  doneTargetRole: 'yesterday',
  doneStatuses: ['done'],
  limboStatuses: ['todo'],
  keepStatuses: ['progress', 'review', 'blocked'],
  hideFromStandupOnLimbo: true,
}

export const DEFAULT_DAILY_TEMPLATE = `{{header}}

{{columns}}

{{footer}}`

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
  nier: {
    header: (date) => `YORHA MISSION LOG // ${date.toUpperCase()}`,
    section: (title, count) => `> ${title} [${count}]`,
    noneInColumn: 'NO DATA.',
    noColumns: 'NO COLUMN DATA.',
    footer: '// END OF TRANSMISSION',
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

function buildColumnsBlock(columns, cards, themePack, config) {
  const orderedColumns = sortColumns(columns, config.columnOrder)
  if (orderedColumns.length === 0) return themePack.noColumns

  const lines = []
  orderedColumns.forEach((col) => {
    const colCards = cards.filter((c) => c.columnId === col.id && !isExcludedFromStandup(c))
    if (!config.includeEmptyColumns && colCards.length === 0) return

    const title = col.title || `COLUNA ${col.index || ''}`.trim()
    lines.push(themePack.section(title, colCards.length))

    if (colCards.length === 0) {
      lines.push(`  ${themePack.noneInColumn}`)
    } else {
      colCards.forEach((card) => {
        const badge = config.showStatusBadge && STATUS_BADGE[card.status] ? ` ${STATUS_BADGE[card.status]}` : ''
        lines.push(`${config.linePrefix}${card.title}${badge}`)
      })
    }

    lines.push('')
  })

  return lines.join('\n').trim()
}

function normalizeDateText(customDateText) {
  if (customDateText && customDateText.trim()) return customDateText.trim()
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function getStandupTemplateContext(columns, cards, theme = 'cyberpunk', options = {}) {
  const themeId = getTheme(theme)
  const themePack = THEMES_STANDUP[themeId] || THEMES_STANDUP.cyberpunk
  const config = { ...SUMMARY_CONFIG, ...options }
  const dateText = normalizeDateText(options.customDateText)

  const columnsBlock = buildColumnsBlock(columns, cards, themePack, config)
  const context = {
    date: dateText,
    header: themePack.header(dateText),
    footer: themePack.footer,
    columns: columnsBlock,
    cards_count: cards.length,
    columns_count: columns.length,
  }

  const columnBlocks = []

  // Token by specific column: {{col:<columnId>}} or {{col:<columnTitle>}} or {{<columnTitle>}}
  columns.forEach((col, idx) => {
    const block = buildColumnsBlock([col], cards, themePack, config)
    const colCards = cards.filter((c) => c.columnId === col.id && !isExcludedFromStandup(c))
    const title = String(col.title || '').trim()
    const normalizedTitle = normalizeKey(title)
    const byPosition = String(col.position ?? idx)
    const byIndex = String(col.index ?? idx + 1)

    // Stable and legacy aliases:
    // - col:<id> (recommended)
    // - col:<title> / <title> (legacy)
    // - colpos:<n> / colindex:<n> / colrole:<role> (extra resiliency)
    context[`col:${col.id}`] = block
    context[`col:${title}`] = block
    context[`col:${normalizedTitle}`] = block
    context[`colpos:${byPosition}`] = block
    context[`colindex:${byIndex}`] = block
    if (col.role) context[`colrole:${col.role}`] = block
    context[title] = block
    context[normalizedTitle] = block

    columnBlocks.push({
      id: col.id,
      title,
      count: colCards.length,
      cards: colCards.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        priority: c.priority,
      })),
      block,
    })
  })

  context.__runtime = {
    columns: columnBlocks,
    cards: cards.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      priority: c.priority,
      columnId: c.columnId,
    })),
  }

  return context
}

function runInlineExpression(expression, context) {
  try {
    const scope = {
      date: context.date,
      header: context.header,
      footer: context.footer,
      columns: context.columns,
      cards_count: context.cards_count,
      columns_count: context.columns_count,
      cols: context.__runtime?.columns || [],
      cards: context.__runtime?.cards || [],
      col: (idOrName) => {
        const key = String(idOrName || '')
        return (
          context[`col:${key}`] ||
          context[`col:${normalizeKey(key)}`] ||
          context[key] ||
          context[normalizeKey(key)] ||
          ''
        )
      },
    }

    const fn = new Function('scope', `with (scope) { return (${expression}); }`)
    const result = fn(scope)
    return result == null ? '' : String(result)
  } catch {
    return '[script-error]'
  }
}

function runBlockScript(code, context) {
  try {
    const scope = {
      date: context.date,
      header: context.header,
      footer: context.footer,
      columns: context.columns,
      cards_count: context.cards_count,
      columns_count: context.columns_count,
      cols: context.__runtime?.columns || [],
      cards: context.__runtime?.cards || [],
      col: (idOrName) => {
        const key = String(idOrName || '')
        return (
          context[`col:${key}`] ||
          context[`col:${normalizeKey(key)}`] ||
          context[key] ||
          context[normalizeKey(key)] ||
          ''
        )
      },
    }

    const fn = new Function('scope', `with (scope) { ${code} }`)
    const result = fn(scope)
    return result == null ? '' : String(result)
  } catch {
    return '[script-error]'
  }
}

export function renderStandupTemplate(template, context) {
  const input = template && template.trim() ? template : DEFAULT_DAILY_TEMPLATE
  const withScriptBlocks = input.replace(/\{\{#script\}\}([\s\S]*?)\{\{\/script\}\}/g, (_full, scriptCode) => {
    return runBlockScript(scriptCode, context)
  })

  return withScriptBlocks.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_full, rawToken) => {
    const token = String(rawToken).trim()
    if (token.startsWith('js:')) {
      return runInlineExpression(token.slice(3).trim(), context)
    }

    return (
      context[token] ??
      context[token.toLowerCase()] ??
      context[normalizeKey(token)] ??
      ''
    )
  }).trim()
}

export function generateStandupMessage(columns, cards, theme = 'cyberpunk', options = {}) {
  const context = getStandupTemplateContext(columns, cards, theme, options)
  const primary = renderStandupTemplate(options.template || DEFAULT_DAILY_TEMPLATE, context)
  if (primary && primary.trim() && templateHasVisibleCards(primary, cards)) return primary
  // Guardrail: never return empty standup due to stale/mismatched template tokens.
  return renderStandupTemplate(DEFAULT_DAILY_TEMPLATE, context)
}

function isExcludedFromStandup(card) {
  const value = card?.excluded_from_standup
  if (value === true) return true
  if (value === false || value == null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function templateHasVisibleCards(renderedText, cards) {
  const visibleCards = (cards || []).filter((c) => !isExcludedFromStandup(c))
  if (visibleCards.length === 0) return true
  const text = String(renderedText || '').toLowerCase()
  return visibleCards.some((c) => text.includes(String(c.title || '').toLowerCase()))
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
    nier: `YORHA WEEKLY LOG // ${first} -> ${last}`,
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
