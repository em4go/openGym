import { describe, it, expect } from 'vitest'
import { trainingMaxValue, resolveLoadWeight, resolveLoadCfg } from './training-max.js'

describe('percentage-of-training-max loading', () => {
  it('reads a valid training max', () => {
    expect(trainingMaxValue({ trainingMaxes: { bench: 100 } }, 'bench')).toBe(100)
    expect(trainingMaxValue({ trainingMaxes: { bench: 0 } }, 'bench')).toBeNull()
    expect(trainingMaxValue({}, 'bench')).toBeNull()
  })

  it('resolves percent to weight', () => {
    const S = { trainingMaxes: { bench: 100 } }
    expect(resolveLoadWeight({ load: { type: 'pct_tm', value: 75, tmKey: 'bench' } }, S)).toBe(75)
  })

  it('rounds fractional percentages to one decimal', () => {
    const S = { trainingMaxes: { bench: 100 } }
    expect(resolveLoadWeight({ load: { type: 'pct_tm', value: 33.333, tmKey: 'bench' } }, S)).toBe(33.3)
  })

  it('returns null without a matching training max', () => {
    expect(resolveLoadWeight({ load: { type: 'pct_tm', value: 75, tmKey: 'bench' } }, {})).toBeNull()
  })

  it('forces progression off and keeps the load block', () => {
    const S = { trainingMaxes: { bench: 100 } }
    const out = resolveLoadCfg({ id: 'bench', sets: 3, reps: 5, prog: 'linear', load: { type: 'pct_tm', value: 75, tmKey: 'bench' } }, S)
    expect(out.prog).toBe('off')
    expect(out.weight).toBe(75)
    expect(out.load).toEqual({ type: 'pct_tm', value: 75, tmKey: 'bench' })
  })

  it('leaves ordinary weight configs unchanged', () => {
    const cfg = { id: 'bench', sets: 3, reps: 5, weight: 60 }
    expect(resolveLoadCfg(cfg, {})).toBe(cfg)
  })
})
