const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const formatMoney = (cents) => fmt.format(cents / 100)

export const toCents = (value) => {
  const n = parseFloat(value)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

// Splits cents equally; leftover cents go to the first people so the total is exact.
export function splitEqually(totalCents, people) {
  const shares = {}
  if (people.length === 0) return shares
  const base = Math.floor(totalCents / people.length)
  let rest = totalCents - base * people.length
  for (const p of people) {
    shares[p] = base + (rest > 0 ? 1 : 0)
    if (rest > 0) rest--
  }
  return shares
}

// Per-person shares as [{ email, amountCents }]. Legacy expenses have no `splits`,
// so they fall back to an equal split of `participants`.
export function getSplits(expense) {
  if (expense.splits) return expense.splits
  const shares = splitEqually(expense.amountCents, expense.participants)
  return Object.entries(shares).map(([email, amountCents]) => ({ email, amountCents }))
}
