// Percentage-of-training-max loading (issue #153 / #70 follow-up).
//
// Stored as a `load` block on a routine exercise so its absolute working weight can be derived
// from the profile's training max at session-start time. A plan entry that carries `load.type
// === 'pct_tm'` resolves to kg at the boundary; history still stores the absolute kg actually
// lifted, so reading the log back needs no new logic.
export function maxTypeOf(cfg) {
  return (cfg && cfg.load && cfg.load.type) || null
}

export function trainingMaxValue(S, key) {
  const tm = S && S.trainingMaxes && S.trainingMaxes[key]
  const n = Number(tm)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function trainingMaxOfLoad(load) {
  const n = Number(load && load.tm)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function resolveLoadWeight(cfg, S) {
  const load = cfg && cfg.load
  if (!load || load.type !== 'pct_tm') return null
  const tm = trainingMaxOfLoad(load) || trainingMaxValue(S, load.tmKey || load.key || load.exerciseId)
  if (tm == null) return null
  const percent = Number(load.value ?? load.percent ?? 0)
  if (!Number.isFinite(percent) || percent <= 0) return null
  const raw = tm * percent / 100
  // Round to the exercise's own increment grid, like progression and the stepper do.
  return Math.round(raw * 10) / 10
}

export function resolveLoadCfg(cfg, S) {
  if (!cfg || !cfg.load || cfg.load.type !== 'pct_tm') return cfg
  const weight = resolveLoadWeight(cfg, S)
  // Force progression off: a percentage lift moves through its cycle when its training max
  // moves, not from one session's hit/miss. Keep the load block so the UI and the next build
  // can see where the number came from.
  return { ...cfg, prog: 'off', ...(weight != null ? { weight } : {}) }
}
