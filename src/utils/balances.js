import { getSplits } from './money'

// Net position per member in cents: positive = is owed, negative = owes.
// Soft-deleted expenses are always excluded; recalculated from scratch each time.
export function computeNet(expenses) {
  const net = {}
  for (const e of expenses) {
    if (e.isDeleted) continue
    net[e.paidBy] = (net[e.paidBy] || 0) + e.amountCents
    for (const { email, amountCents } of getSplits(e)) {
      net[email] = (net[email] || 0) - amountCents
    }
  }
  return net
}

// Greedy matching of largest debtor to largest creditor: at most (people - 1) payments.
export function computeSettlements(expenses) {
  const net = computeNet(expenses)
  const creditors = []
  const debtors = []
  for (const [email, v] of Object.entries(net)) {
    if (v > 0) creditors.push({ email, v })
    else if (v < 0) debtors.push({ email, v: -v })
  }
  const payments = []
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.v - a.v)
    debtors.sort((a, b) => b.v - a.v)
    const c = creditors[0]
    const d = debtors[0]
    const amount = Math.min(c.v, d.v)
    payments.push({ from: d.email, to: c.email, amountCents: amount })
    c.v -= amount
    d.v -= amount
    if (c.v === 0) creditors.shift()
    if (d.v === 0) debtors.shift()
  }
  return payments
}
