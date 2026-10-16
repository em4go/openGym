import { describe, it, expect } from 'vitest'
import {
  normalizeProgram,
  programCurrent,
  programIsComplete,
  programWeekComplete,
  setProgramCursor,
  advanceProgram,
  programProgress,
  programRestartCycle,
} from './program.js'

describe('program blocks', () => {
  const sessions = [
    { id: 'w1d1', name: 'Week 1 Day 1' },
    { id: 'w1d2', name: 'Week 1 Day 2' },
    { id: 'w1d3', name: 'Week 1 Day 3' },
    { id: 'w2d1', name: 'Week 2 Day 1' },
  ]

  it('normalizes a program and clamps the cursor', () => {
    const p = normalizeProgram({ name: 'Test', sessions, sessionsPerWeek: 3, cursor: 99 })
    expect(p.cursor).toBe(4)
    expect(p.sessions.length).toBe(4)
    expect(p.sessions[0]).toMatchObject({ week: 1, day: 1 })
    expect(p.sessions[3]).toMatchObject({ week: 2, day: 1 })
  })

  it('reports the current session', () => {
    const p = normalizeProgram({ sessions, cursor: 1 })
    expect(programCurrent(p)).toMatchObject({ index: 1, week: 1, session: { id: 'w1d2' } })
  })

  it('returns null when complete', () => {
    const p = normalizeProgram({ sessions, cursor: 4 })
    expect(programCurrent(p)).toBeNull()
    expect(programIsComplete(p)).toBe(true)
  })

  it('advances by one session', () => {
    const p = normalizeProgram({ sessions, cursor: 1 })
    const next = advanceProgram(p, 1)
    expect(next.cursor).toBe(2)
  })

  it('allows changing the next workout index', () => {
    const p = normalizeProgram({ sessions, cursor: 1 })
    const moved = setProgramCursor(p, 3)
    expect(moved.cursor).toBe(3)
    expect(programCurrent(moved).session.id).toBe('w2d1')
  })

  it('can complete a block before all sessions', () => {
    const p = normalizeProgram({ sessions, sessionsPerWeek: 3, cursor: 2 })
    expect(programWeekComplete(p)).toBe(false)
    const done = advanceProgram(p, 1)
    expect(programWeekComplete(done)).toBe(true)
  })

  it('supports a weekly session count that is not 3', () => {
    const p = normalizeProgram({ sessions, sessionsPerWeek: 2, cursor: 2 })
    expect(p.sessionsPerWeek).toBe(2)
    expect(programWeekComplete(p)).toBe(true)
  })

  it('reports progress and restarts a cycle', () => {
    const p = normalizeProgram({ sessions, cursor: 2 })
    expect(programProgress(p)).toEqual({ done: 2, total: 4, ratio: 0.5 })
    const restarted = programRestartCycle(p)
    expect(restarted.cursor).toBe(0)
    expect(restarted.cyclesDone).toBe(1)
  })
})
