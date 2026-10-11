import { describe, expect, it } from 'vitest'
import { computeNet, computeSettlements } from './balances'
import { getSplits } from './money'

const base = { isDeleted: false, paidBy: 'a', amountCents: 1000 }

describe('getSplits', () => {
  it('falls back to an equal split for legacy expenses', () => {
    expect(getSplits({ ...base, participants: ['a', 'b', 'c'], amountCents: 1000 })).toEqual([
      { email: 'a', amountCents: 334 },
      { email: 'b', amountCents: 333 },
      { email: 'c', amountCents: 333 },
    ])
  })
  it('uses stored splits when present', () => {
    const splits = [{ email: 'b', amountCents: 1000 }]
    expect(getSplits({ ...base, participants: ['b'], splits })).toBe(splits)
  })
})

describe('computeNet with unequal splits', () => {
  it('debits each person their custom amount', () => {
    const e = { ...base, participants: ['a', 'b', 'c'], splits: [
      { email: 'a', amountCents: 200 }, { email: 'b', amountCents: 300 }, { email: 'c', amountCents: 500 },
    ] }
    expect(computeNet([e])).toEqual({ a: 800, b: -300, c: -500 })
    expect(computeSettlements([e])).toEqual([
      { from: 'c', to: 'a', amountCents: 500 },
      { from: 'b', to: 'a', amountCents: 300 },
    ])
  })
  it('handles a payer who is not in the split', () => {
    const e = { ...base, participants: ['b'], splits: [{ email: 'b', amountCents: 1000 }] }
    expect(computeNet([e])).toEqual({ a: 1000, b: -1000 })
  })
  it('still computes legacy expenses and skips deleted ones', () => {
    const legacy = { ...base, participants: ['a', 'b'], amountCents: 1000 }
    expect(computeNet([legacy, { ...legacy, isDeleted: true }])).toEqual({ a: 500, b: -500 })
  })
})
