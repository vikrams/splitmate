import { getGroups, saveGroups, getExpenses, saveExpenses, getUsers } from '../data/storage'

const EMAIL_RE = /^\S+@\S+\.\S+$/

export const normEmail = (e) => e.trim().toLowerCase()
export const isValidEmail = (e) => EMAIL_RE.test(normEmail(e))
export const isRegistered = (email) => getUsers().some((u) => u.email.toLowerCase() === normEmail(email))
export const displayName = (email) => getUsers().find((u) => u.email.toLowerCase() === email)?.name ?? email

// Returns { ok, group } or { ok: false, error }
export function createGroup(creatorEmail, { name, description, members }) {
  name = name.trim()
  if (!name) return { ok: false, error: 'Group name is required.' }
  const list = [...new Set([creatorEmail, ...members.map(normEmail)])]
  const group = {
    id: 'g' + Date.now(),
    name,
    description: description.trim(),
    members: list,
    createdBy: creatorEmail,
  }
  saveGroups([...getGroups(), group])
  return { ok: true, group }
}

export const getGroup = (id) => getGroups().find((g) => g.id === id) ?? null
export const getGroupExpenses = (id) => getExpenses().filter((e) => e.groupId === id)

// contributions: [{ member, amount }]. The total is shared equally among `splitAmong`
// (default: every group member), or per `shares` [{ member, amount }] for an unequal split.
export function addExpense(group, { description, contributions, splitAmong, shares }) {
  description = description.trim()
  if (!description) return { ok: false, error: 'Description is required.' }
  const valid = contributions.filter((c) => c.member && Number(c.amount) > 0)
  if (valid.length === 0) return { ok: false, error: 'Add at least one member contribution greater than 0.' }
  if (new Set(valid.map((c) => c.member)).size !== valid.length)
    return { ok: false, error: 'Each member can only be listed once.' }
  const clean = valid.map((c) => ({ member: c.member, amount: Math.round(Number(c.amount) * 100) / 100 }))
  const amount = Math.round(clean.reduce((t, c) => t + c.amount, 0) * 100) / 100
  const expense = {
    id: 'e' + Date.now(),
    groupId: group.id,
    description,
    amount,
    contributions: clean,
    splitAmong: [...(splitAmong ?? group.members)],
  }
  if (shares) {
    const cleanShares = shares
      .filter((x) => Number(x.amount) > 0)
      .map((x) => ({ member: x.member, amount: Math.round(Number(x.amount) * 100) / 100 }))
    if (cleanShares.length === 0) return { ok: false, error: 'Assign an amount to at least one member.' }
    if (cleanShares.some((x) => !group.members.includes(x.member))) return { ok: false, error: 'Shares must be for group members.' }
    const sum = Math.round(cleanShares.reduce((t, x) => t + x.amount, 0) * 100)
    if (sum !== Math.round(amount * 100)) return { ok: false, error: 'The split amounts must add up to the total.' }
    expense.shares = cleanShares
    expense.splitAmong = cleanShares.map((x) => x.member)
  } else if (expense.splitAmong.length === 0 || expense.splitAmong.some((m) => !group.members.includes(m))) {
    return { ok: false, error: 'Pick at least one member to split with.' }
  }
  saveExpenses([...getExpenses(), expense])
  return { ok: true, expense }
}

// Saves edits to a group and all of its expenses in one go.
// draft: { name, description, members: [email], expenses: [{ id, description, contributions: [{member, amount}], splitAmong }] }
export function updateGroup(groupId, draft) {
  const group = getGroup(groupId)
  if (!group) return { ok: false, error: 'Group no longer exists.' }
  const name = draft.name.trim()
  if (!name) return { ok: false, error: 'Group name is required.' }
  const members = [...new Set(draft.members.map(normEmail))]

  const expenses = []
  for (const e of draft.expenses) {
    const label = e.description.trim() || 'an expense'
    if (!e.description.trim()) return { ok: false, error: 'Every expense needs a description.' }
    const valid = e.contributions.filter((c) => c.member && Number(c.amount) > 0)
    if (valid.length === 0) return { ok: false, error: `"${label}" needs at least one contribution greater than 0.` }
    if (new Set(valid.map((c) => c.member)).size !== valid.length)
      return { ok: false, error: `"${label}" lists a member more than once.` }
    if (valid.some((c) => !members.includes(c.member)))
      return { ok: false, error: `"${label}" has a contribution from someone who is not a member.` }
    const contributions = valid.map((c) => ({ member: c.member, amount: Math.round(Number(c.amount) * 100) / 100 }))
    const amount = Math.round(contributions.reduce((t, c) => t + c.amount, 0) * 100) / 100
    let splitAmong = e.splitAmong.filter((m) => members.includes(m))
    let shares
    if (e.shares) {
      shares = e.shares.filter((x) => members.includes(x.member))
      const sum = Math.round(shares.reduce((t, x) => t + x.amount, 0) * 100)
      if (sum !== Math.round(amount * 100))
        return { ok: false, error: `"${label}" has an unequal split that no longer adds up to its total. Delete it and add it again.` }
      splitAmong = shares.map((x) => x.member)
    }
    if (splitAmong.length === 0) return { ok: false, error: `"${label}" has nobody to split with.` }
    expenses.push({ id: e.id, groupId, description: e.description.trim(), amount, contributions, splitAmong, ...(shares && { shares }) })
  }

  saveGroups(getGroups().map((g) => (g.id === groupId ? { ...g, name, description: draft.description.trim(), members } : g)))
  saveExpenses([...getExpenses().filter((e) => e.groupId !== groupId), ...expenses])
  return { ok: true }
}

// Deletes a group and all its expenses. Only the creator may do this.
export function deleteGroup(groupId, userEmail) {
  const group = getGroup(groupId)
  if (!group) return { ok: false, error: 'Group no longer exists.' }
  if (group.createdBy !== userEmail) return { ok: false, error: 'Only the group creator can delete this group.' }
  saveGroups(getGroups().filter((g) => g.id !== groupId))
  saveExpenses(getExpenses().filter((e) => e.groupId !== groupId))
  return { ok: true }
}
