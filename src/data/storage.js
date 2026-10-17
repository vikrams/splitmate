// The only module that touches localStorage. Everything else goes through here.
const KEYS = {
  users: 'splitmate.users',
  groups: 'splitmate.groups',
  expenses: 'splitmate.expenses',
  session: 'splitmate.session',
}

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const newId = () => crypto.randomUUID()

const SEED_USERS = [
  ['Shubham', 'shubham@test.com'],
  ['Bob', 'bob@test.com'],
  ['Rahul', 'rahul@test.com'],
  ['Eva', 'eva@test.com'],
].map(([name, email]) => ({ id: newId(), name, email, password: 'password' }))

export function initStorage() {
  if (localStorage.getItem(KEYS.users) === null) write(KEYS.users, SEED_USERS)
  if (localStorage.getItem(KEYS.groups) === null) write(KEYS.groups, [])
  if (localStorage.getItem(KEYS.expenses) === null) write(KEYS.expenses, [])
}

// Users
export const getUsers = () => read(KEYS.users, [])
export function addUser({ name, email, password }) {
  const user = { id: newId(), name, email, password }
  write(KEYS.users, [...getUsers(), user])
  return user
}

// Session (stores the logged-in user's id)
export const getSessionUserId = () => read(KEYS.session, null)
export const setSessionUserId = (id) => write(KEYS.session, id)
export const clearSession = () => localStorage.removeItem(KEYS.session)

// Groups: { id, name, createdBy, members: [email], createdAt }
export const getGroups = () => read(KEYS.groups, [])
export const getGroup = (id) => getGroups().find((g) => g.id === id) || null
export function addGroup({ name, createdBy, members }) {
  const group = { id: newId(), name, createdBy, members, createdAt: new Date().toISOString() }
  write(KEYS.groups, [...getGroups(), group])
  return group
}

export function removeGroupMember(groupId, email) {
  write(
    KEYS.groups,
    getGroups().map((g) => (g.id === groupId ? { ...g, members: g.members.filter((m) => m !== email) } : g)),
  )
  return getGroup(groupId)
}

// Expenses: { id, groupId, description, amountCents, date, paidBy, participants: [email],
//   splits: [{ email, amountCents }] (sums to amountCents; absent on legacy = equal split),
//   splitMode: 'equal' | 'manual', createdBy: email (absent on legacy), isDeleted,
//   isSettlement?: true (a payment: paidBy pays the single person in splits) }
export const getExpenses = (groupId) =>
  read(KEYS.expenses, []).filter((e) => e.groupId === groupId)
export function addExpense(data) {
  const expense = { id: newId(), ...data, isDeleted: false, createdAt: new Date().toISOString() }
  write(KEYS.expenses, [...read(KEYS.expenses, []), expense])
  return expense
}
// Soft delete only — records are never removed.
export function softDeleteExpense(id) {
  write(
    KEYS.expenses,
    read(KEYS.expenses, []).map((e) => (e.id === id ? { ...e, isDeleted: true } : e)),
  )
}
// Edit = soft-delete the old record and add a fresh one, so history and balances stay consistent.
export function replaceExpense(oldId, data) {
  const all = read(KEYS.expenses, [])
  const expense = { id: newId(), ...data, isDeleted: false, createdAt: new Date().toISOString() }
  write(KEYS.expenses, [...all.map((e) => (e.id === oldId ? { ...e, isDeleted: true } : e)), expense])
  return expense
}
