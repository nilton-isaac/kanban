import { normalizeThemeId } from '../themes'

const STANDUP_DEBUG = true

export const SUMMARY_CONFIG = {
  columnOrder: 'position',
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

export const DEFAULT_STANDUP_PREFERENCES = {
  format: 'markdown',
  showCompletedTasks: false,
  showPendingTasks: false,
  includeTaskLinks: true,
  completedTaskLabel: 'Concluida',
  pendingTaskLabel: 'Pendente',
  columnAliases: {},
  statusLabels: {
    done: 'Concluida',
    blocked: 'Bloqueada',
    review: 'Em review',
    progress: 'Em andamento',
    todo: 'A fazer',
  },
}

export const DEFAULT_DAILY_TEMPLATE = `{{header}}\n\n{{columns}}\n\n{{footer}}`

const THEMES_STANDUP = {
  dark: {
    header: (date) => `SYNTH STANDUP // ${date.toUpperCase()}`,
    section: (title, count) => `${title} (${count})`,
    noneInColumn: '- nenhum item nesta faixa -',
    noColumns: 'Nenhuma coluna cadastrada.',
    footer: '// glow stable',
  },
  light: {
    header: (date) => `SYNTH FLOW // ${date.toUpperCase()}`,
    section: (title, count) => `${title} (${count})`,
    noneInColumn: '- nenhum item nesta faixa -',
    noColumns: 'Nenhuma coluna cadastrada.',
    footer: '// workspace synced',
  },
}

function getTheme(themeId) {
  return normalizeThemeId(themeId)
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeStandupPreferences(raw) {
  const input = raw && typeof raw === 'object' ? raw : {}
  const statusLabels = input.statusLabels && typeof input.statusLabels === 'object' ? input.statusLabels : {}

  return {
    ...DEFAULT_STANDUP_PREFERENCES,
    ...input,
    format: ['plain', 'markdown', 'html'].includes(input.format) ? input.format : DEFAULT_STANDUP_PREFERENCES.format,
    showCompletedTasks: Boolean(input.showCompletedTasks),
    showPendingTasks: Boolean(input.showPendingTasks),
    includeTaskLinks: input.includeTaskLinks !== false,
    completedTaskLabel: String(input.completedTaskLabel || DEFAULT_STANDUP_PREFERENCES.completedTaskLabel),
    pendingTaskLabel: String(input.pendingTaskLabel || DEFAULT_STANDUP_PREFERENCES.pendingTaskLabel),
    columnAliases: input.columnAliases && typeof input.columnAliases === 'object' ? input.columnAliases : {},
    statusLabels: {
      ...DEFAULT_STANDUP_PREFERENCES.statusLabels,
      ...Object.fromEntries(Object.entries(statusLabels).map(([key, value]) => [key, String(value || '').trim()])),
    },
  }
}

function formatText(text, options = {}, preferences = DEFAULT_STANDUP_PREFERENCES) {
  const content = String(text || '')
  const format = preferences.format || 'plain'
  const bold = Boolean(options.bold)
  const italic = Boolean(options.italic)

  if (format === 'html') {
    let formatted = escapeHtml(content)
    if (bold) formatted = `<strong>${formatted}</strong>`
    if (italic) formatted = `<em>${formatted}</em>`
    return formatted
  }

  if (format === 'markdown') {
    let formatted = content
    if (bold) formatted = `**${formatted}**`
    if (italic) formatted = `_${formatted}_`
    return formatted
  }

  return content
}

function formatLink(label, url, preferences = DEFAULT_STANDUP_PREFERENCES) {
  const href = String(url || '').trim()
  if (!href) return label

  if (preferences.format === 'html') {
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
  }

  if (preferences.format === 'markdown') {
    return `[${label}](${href})`
  }

  return `${label} (${href})`
}

function formatStatusBadge(status, preferences) {
  const label = preferences.statusLabels[status] || String(status || '').trim()
  if (!label) return ''
  return formatText(label, { bold: true, italic: true }, preferences)
}

function normalizeTask(task) {
  return {
    id: task?.id,
    title: String(task?.title || '').trim(),
    done: Boolean(task?.done),
    link: String(task?.link || '').trim(),
    platform: String(task?.platform || '').trim(),
  }
}

function isVisibleInStandup(card) {
  return !card?.archived && !isExcludedFromStandup(card)
}

function resolveColumnLabel(column, preferences) {
  const alias = preferences.columnAliases?.[column.id]
  if (alias && String(alias).trim()) return String(alias).trim()
  return String(column.title || `COLUNA ${column.index || ''}`).trim()
}

function formatTaskLine(task, preferences, linePrefix) {
  const label = task.done ? preferences.completedTaskLabel : preferences.pendingTaskLabel
  const decoratedLabel = formatText(label, { bold: true, italic: true }, preferences)
  const taskTitle = preferences.includeTaskLinks && task.link
    ? formatLink(task.title || task.platform || 'Abrir tarefa', task.link, preferences)
    : formatText(task.title, { italic: !task.done }, preferences)
  const platform = task.platform ? ` · ${task.platform}` : ''
  return `${linePrefix}    ${decoratedLabel}: ${taskTitle}${platform}`
}

function sortColumns(columns, columnOrder, preferences) {
  const ordered = [...columns]
  if (columnOrder === 'alphabetical') {
    return ordered.sort((a, b) => resolveColumnLabel(a, preferences).localeCompare(resolveColumnLabel(b, preferences)))
  }

  return ordered.sort((a, b) => {
    const pa = a.position ?? 0
    const pb = b.position ?? 0
    if (pa !== pb) return pa - pb
    return String(a.index || a.title || '').localeCompare(String(b.index || b.title || ''))
  })
}

function buildColumnsBlock(columns, cards, themePack, config, preferences) {
  const orderedColumns = sortColumns(columns, config.columnOrder, preferences)
  if (orderedColumns.length === 0) return themePack.noColumns

  const lines = []
  orderedColumns.forEach((col) => {
    const colCards = cards.filter((c) => c.columnId === col.id && isVisibleInStandup(c))
    if (!config.includeEmptyColumns && colCards.length === 0) return

    const title = resolveColumnLabel(col, preferences)
    const sectionTitle = themePack.section(title, colCards.length)
    lines.push(formatText(sectionTitle, { bold: true }, preferences))

    if (colCards.length === 0) {
      lines.push(`  ${themePack.noneInColumn}`)
    } else {
      colCards.forEach((card) => {
        const badge = config.showStatusBadge && card.status ? ` ${formatStatusBadge(card.status, preferences)}` : ''
        lines.push(`${config.linePrefix}${formatText(card.title, {}, preferences)}${badge}`)

        const tasks = (card.tasks || []).map(normalizeTask).filter((task) => {
          if (task.done) return preferences.showCompletedTasks
          return preferences.showPendingTasks
        })
        tasks.forEach((task) => lines.push(formatTaskLine(task, preferences, config.linePrefix)))
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

function buildRuntimeCard(card, columns, preferences) {
  const column = columns.find((item) => item.id === card.columnId)
  const columnLabel = column ? resolveColumnLabel(column, preferences) : ''
  return {
    id: card.id,
    title: card.title,
    status: card.status,
    priority: card.priority,
    columnId: card.columnId,
    columnLabel,
    tasks: (card.tasks || []).map(normalizeTask),
  }
}

export function getStandupTemplateContext(columns, cards, theme = 'dark', options = {}) {
  const themeId = getTheme(theme)
  const themePack = THEMES_STANDUP[themeId] || THEMES_STANDUP.dark
  const config = { ...SUMMARY_CONFIG, ...options }
  const preferences = normalizeStandupPreferences(options.preferences)
  const dateText = normalizeDateText(options.customDateText)

  const columnsBlock = buildColumnsBlock(columns, cards, themePack, config, preferences)
  const context = {
    date: dateText,
    header: formatText(themePack.header(dateText), {}, preferences),
    footer: formatText(themePack.footer, {}, preferences),
    columns: columnsBlock,
    cards_count: cards.length,
    columns_count: columns.length,
    preferences,
    prefs: preferences,
  }

  const columnBlocks = []

  columns.forEach((col, idx) => {
    const block = buildColumnsBlock([col], cards, themePack, config, preferences)
    const colCards = cards.filter((c) => c.columnId === col.id && isVisibleInStandup(c))
    const title = String(col.title || '').trim()
    const alias = resolveColumnLabel(col, preferences)
    const normalizedTitle = normalizeKey(title)
    const normalizedAlias = normalizeKey(alias)
    const byPosition = String(col.position ?? idx)
    const byIndex = String(col.index ?? idx + 1)

    context[`col:${col.id}`] = block
    context[`col:${title}`] = block
    context[`col:${normalizedTitle}`] = block
    context[`col:${alias}`] = block
    context[`col:${normalizedAlias}`] = block
    context[`colpos:${byPosition}`] = block
    context[`colindex:${byIndex}`] = block
    if (col.role) context[`colrole:${col.role}`] = block
    context[title] = block
    context[normalizedTitle] = block
    context[alias] = block
    context[normalizedAlias] = block

    columnBlocks.push({
      id: col.id,
      title,
      alias,
      count: colCards.length,
      cards: colCards.map((c) => buildRuntimeCard(c, columns, preferences)),
      block,
    })
  })

  context.__runtime = {
    columns: columnBlocks,
    cards: cards.map((c) => buildRuntimeCard(c, columns, preferences)),
    style: (text, opts = {}) => formatText(text, opts, preferences),
    link: (label, href) => formatLink(label, href, preferences),
    statusLabel: (status) => preferences.statusLabels[status] || status,
    statusText: (status) => formatStatusBadge(status, preferences),
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
      prefs: context.preferences,
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
      style: context.__runtime?.style,
      link: context.__runtime?.link,
      statusLabel: context.__runtime?.statusLabel,
      statusText: context.__runtime?.statusText,
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
      prefs: context.preferences,
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
      style: context.__runtime?.style,
      link: context.__runtime?.link,
      statusLabel: context.__runtime?.statusLabel,
      statusText: context.__runtime?.statusText,
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
  const withScriptBlocks = input.replace(/\{\{#script\}\}([\s\S]*?)\{\{\/script\}\}/g, (_full, scriptCode) => runBlockScript(scriptCode, context))

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

export function generateStandupMessage(columns, cards, theme = 'dark', options = {}) {
  const context = getStandupTemplateContext(columns, cards, theme, options)
  const primary = renderStandupTemplate(options.template || DEFAULT_DAILY_TEMPLATE, context)
  const hasVisible = templateHasVisibleCards(primary, cards)
  if (primary && primary.trim() && hasVisible) {
    debugStandup('primary', { columns, cards, theme, options, context, primary, hasVisible, fallbackUsed: false })
    return primary
  }

  const fallback = renderStandupTemplate(DEFAULT_DAILY_TEMPLATE, context)
  debugStandup('fallback', {
    columns,
    cards,
    theme,
    options,
    context,
    primary,
    hasVisible,
    fallback,
    fallbackUsed: true,
  })
  return fallback
}

function isExcludedFromStandup(card) {
  const value = card?.excluded_from_standup
  if (value === true) return true
  if (value === false || value == null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function templateHasVisibleCards(renderedText, cards) {
  const visibleCards = (cards || []).filter((c) => isVisibleInStandup(c))
  if (visibleCards.length === 0) return true
  const text = String(renderedText || '').toLowerCase()
  return visibleCards.some((c) => text.includes(String(c.title || '').toLowerCase()))
}

function debugStandup(stage, payload) {
  if (!STANDUP_DEBUG || typeof window === 'undefined') return

  try {
    const cols = (payload.columns || []).map((c, idx) => ({
      idx,
      id: c.id,
      title: c.title,
      role: c.role,
      position: c.position,
      index: c.index,
    }))
    const cds = (payload.cards || []).map((c, idx) => ({
      idx,
      id: c.id,
      title: c.title,
      columnId: c.columnId,
      status: c.status,
      excluded_from_standup: c.excluded_from_standup,
      excluded_normalized: isExcludedFromStandup(c),
      tasks: (c.tasks || []).length,
    }))

    console.groupCollapsed(`[standup:${stage}] cols=${cols.length} cards=${cds.length} theme=${payload.theme}`)
    console.log('template', payload.options?.template || DEFAULT_DAILY_TEMPLATE)
    console.log('customDateText', payload.options?.customDateText)
    console.log('preferences', payload.options?.preferences)
    console.table(cols)
    console.table(cds)
    console.log('context.columns (rendered block)', payload.context?.columns)
    console.log('primary result', payload.primary)
    console.log('hasVisible', payload.hasVisible)
    console.log('fallbackUsed', payload.fallbackUsed)
    if (payload.fallbackUsed) console.log('fallback result', payload.fallback)
    console.groupEnd()
  } catch (err) {
    console.error('[standup:debug-error]', err)
  }
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

export function generateWeeklySummary(logs, theme = 'dark') {
  if (!logs || logs.length === 0) {
    return 'Nenhum standup registrado nesta semana.'
  }

  const themeId = getTheme(theme)
  const first = new Date(logs[0].log_date).toLocaleDateString('pt-BR')
  const last = new Date(logs[logs.length - 1].log_date).toLocaleDateString('pt-BR')

  const headers = {
    dark: `RESUMO SEMANAL // ${first} -> ${last}`,
    light: `RESUMO SEMANAL // ${first} -> ${last}`,
  }

  const lines = [headers[themeId] || headers.dark, '']

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
