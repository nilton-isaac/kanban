import { supabase } from './supabase'

function normalizeTask(task) {
  return {
    id: task?.id || `task-${Date.now()}`,
    title: String(task?.title || '').trim(),
    done: Boolean(task?.done),
    link: String(task?.link || '').trim(),
    platform: String(task?.platform || '').trim(),
  }
}

// Columns
export async function fetchColumns(userId) {
  const { data, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('user_id', userId)
    .order('position')
  if (error) throw error
  return data.map(dbColToState)
}

export async function upsertColumn(col, userId) {
  const { error } = await supabase.from('kanban_columns').upsert({
    id: col.id,
    user_id: userId,
    title: col.title,
    color: col.color,
    col_index: col.index,
    role: col.role || null,
    position: col.position || 0,
  })
  if (error) throw error
}

export async function deleteColumn(colId, userId) {
  const { error } = await supabase
    .from('kanban_columns')
    .delete()
    .eq('id', colId)
    .eq('user_id', userId)
  if (error) throw error
}

function dbColToState(row) {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    index: row.col_index,
    role: row.role,
    position: row.position,
  }
}

// Cards
export async function fetchCards(userId) {
  const { data, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('user_id', userId)
    .order('position')
  if (error) throw error
  return data.map(dbCardToState)
}

export async function upsertCard(card, userId) {
  const tasks = (card.tasks || []).map(normalizeTask)
  const { error } = await supabase.from('kanban_cards').upsert({
    id: card.id,
    user_id: userId,
    column_id: card.columnId,
    title: card.title,
    description: card.description || '',
    status: card.status || 'todo',
    priority: card.priority || 'medium',
    urgent: card.urgent || false,
    important: card.important || false,
    due_date: card.dueDate || '',
    tags: card.tags || [],
    assignees: card.assignees || [],
    tasks,
    excluded_from_standup: card.excluded_from_standup || false,
    position: card.position || 0,
    archived: card.archived || false,
    archived_at: card.archivedAt || null,
  })
  if (error) throw error
}

export async function deleteCard(cardId, userId) {
  const { error } = await supabase
    .from('kanban_cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', userId)
  if (error) throw error
}

function dbCardToState(row) {
  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    urgent: row.urgent,
    important: row.important,
    dueDate: row.due_date,
    tags: row.tags || [],
    assignees: row.assignees || [],
    tasks: (row.tasks || []).map(normalizeTask),
    excluded_from_standup: row.excluded_from_standup || false,
    position: row.position,
    createdAt: row.created_at,
    archived: row.archived || false,
    archivedAt: row.archived_at || null,
    images: [],
    banner: null,
  }
}

// Standup Logs
export async function saveStandupLog(userId, message, date) {
  const logDate = date || new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('standup_logs').upsert({
    user_id: userId,
    log_date: logDate,
    message,
  }, { onConflict: 'user_id,log_date' })
  if (error) throw error
}

export async function fetchWeeklyLogs(userId) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data, error } = await supabase
    .from('standup_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('log_date')
  if (error) throw error
  return data
}

// Profile
export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateProfile(userId, patch) {
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...patch })
  if (error) throw error
}
