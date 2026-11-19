// Who owes what for one expense: explicit `shares` if present, otherwise an equal
// split of the total among `splitAmong` (remainder paisa goes to the first person).
export function expenseShares(e) {
  if (e.shares) return e.shares
  const total = Math.round(e.amount * 100)
  const n = e.splitAmong.length
  const base = Math.floor(total / n)
  const extra = total - base * n
  return e.splitAmong.map((member, i) => ({ member, amount: (base + (i === 0 ? extra : 0)) / 100 }))
}

// Per-group member stats. Each expense has contributions (who paid how much);
// the total is split per `shares` (or equally among `splitAmong`).
// net = paid - share (positive => is owed money, negative => owes money).
export function groupStats(group, expenses) {
  const stats = Object.fromEntries(group.members.map((m) => [m, { paid: 0, share: 0, net: 0 }]))
  for (const e of expenses.filter((x) => x.groupId === group.id)) {
    for (const c of e.contributions) if (stats[c.member]) stats[c.member].paid += c.amount
    for (const { member, amount } of expenseShares(e)) if (stats[member]) stats[member].share += amount
  }
  for (const s of Object.values(stats)) s.net = s.paid - s.share
  return stats
}

// Turn net balances into a minimal-ish list of "from owes to" payments.
export function settlements(stats) {
  const cents = (n) => Math.round(n * 100)
  const debtors = []
  const creditors = []
  for (const [member, s] of Object.entries(stats)) {
    const c = cents(s.net)
    if (c < 0) debtors.push({ member, c: -c })
    else if (c > 0) creditors.push({ member, c })
  }
  debtors.sort((a, b) => b.c - a.c)
  creditors.sort((a, b) => b.c - a.c)
  const out = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].c, creditors[j].c)
    out.push({ from: debtors[i].member, to: creditors[j].member, amount: amt / 100 })
    debtors[i].c -= amt
    creditors[j].c -= amt
    if (debtors[i].c === 0) i++
    if (creditors[j].c === 0) j++
  }
  return out
}

export const formatMoney = (n) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
