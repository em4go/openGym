// Program blocks as an ordered "next workout" queue.
//
// A program is not a calendar: it is a list of sessions and a cursor saying which one comes
// next. A block is complete when enough sessions have been finished; how many is configured
// by `sessionsPerWeek`, so a simple "3 sessions a week" rule and other cadences share this code.
export function normalizeProgram(p) {
  const sessionsPerWeek = Math.max(1, Number(p && p.sessionsPerWeek) || 3)
  const rawSessions = Array.isArray(p && p.sessions) ? p.sessions : []
  const sessions = rawSessions.map((s, i) => ({
    id: (s && s.id) || `s${i + 1}`,
    name: (s && s.name) || `Session ${i + 1}`,
    routineId: (s && s.routineId) || (s && s.rid) || null,
    week: Number.isFinite(s && s.week) ? Number(s.week) : Math.floor(i / sessionsPerWeek) + 1,
    day: Number.isFinite(s && s.day) ? Number(s.day) : (i % sessionsPerWeek) + 1,
  }))
  const maxCursor = sessions.length
  let cursor = Number.isInteger(p && p.cursor) ? Number(p.cursor) : 0
  if (!Number.isFinite(cursor)) cursor = 0
  if (cursor < 0) cursor = 0
  if (cursor > maxCursor) cursor = maxCursor
  return {
    name: (p && p.name) || 'Program',
    sessionsPerWeek,
    sessions,
    cursor,
    ...(p && p.cyclesDone != null ? { cyclesDone: Number(p.cyclesDone) || 0 } : {}),
  }
}

export function programCurrent(program) {
  const p = normalizeProgram(program)
  if (p.sessions.length === 0) return null
  if (p.cursor >= p.sessions.length) return null
  return {
    index: p.cursor,
    week: p.sessions[p.cursor].week,
    session: p.sessions[p.cursor],
  }
}

export function programIsComplete(program) {
  const p = normalizeProgram(program)
  return p.sessions.length > 0 && p.cursor >= p.sessions.length
}

export function programWeekComplete(program) {
  const p = normalizeProgram(program)
  if (p.sessions.length === 0) return false
  // The newest finished session closed a block when the cursor lands on a week boundary.
  return p.cursor > 0 && p.cursor % p.sessionsPerWeek === 0
}

export function setProgramCursor(program, cursor) {
  const p = normalizeProgram(program)
  let next = Number.isInteger(cursor) ? cursor : Number(cursor)
  if (!Number.isFinite(next)) next = p.cursor
  next = Math.max(0, Math.min(next, p.sessions.length))
  return { ...p, cursor: next }
}

export function advanceProgram(program, by = 1) {
  const p = normalizeProgram(program)
  const step = Number.isFinite(by) ? by : 1
  if (step <= 0) return p
  return setProgramCursor(p, p.cursor + step)
}

export function programProgress(program) {
  const p = normalizeProgram(program)
  const total = p.sessions.length
  const done = p.cursor
  return { done, total, ratio: total > 0 ? done / total : 0 }
}

export function programRestartCycle(program) {
  const p = normalizeProgram(program)
  return { ...p, cursor: 0, cyclesDone: (p.cyclesDone || 0) + 1 }
}
