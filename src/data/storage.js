// Single place for all persistence. Backed by localStorage.
const KEYS = {
  users: 'splitmate:users',
  session: 'splitmate:session',
  groups: 'splitmate:groups',
  expenses: 'splitmate:expenses',
  version: 'splitmate:version',
}
const VERSION = 2 // bump when the groups/expenses shape changes

const SEED = {
  users: [
    { id: 'u1', name: 'Mr A', email: 'a@test.com', password: 'pass' },
    { id: 'u2', name: 'Mr B', email: 'b@test.com', password: 'pass' },
    { id: 'u3', name: 'Mr C', email: 'c@test.com', password: 'pass' },
  ],
  // Members are identified by email. A member is "active" if a registered user has that email.
  groups: [
    { id: 'g1', name: 'Goa Trip', description: 'Beach weekend', members: ['a@test.com', 'b@test.com', 'c@test.com'], createdBy: 'a@test.com' },
    { id: 'g2', name: 'Flat Expenses', description: 'Shared flat bills', members: ['a@test.com', 'b@test.com'], createdBy: 'a@test.com' },
  ],
  // contributions = what each member paid; total is split equally among splitAmong.
  expenses: [
    { id: 'e1', groupId: 'g1', description: 'Lodging', amount: 9000, contributions: [{ member: 'a@test.com', amount: 9000 }], splitAmong: ['a@test.com', 'b@test.com', 'c@test.com'] },
    { id: 'e2', groupId: 'g1', description: 'Food', amount: 3000, contributions: [{ member: 'b@test.com', amount: 3000 }], splitAmong: ['a@test.com', 'b@test.com', 'c@test.com'] },
    { id: 'e3', groupId: 'g2', description: 'Groceries', amount: 2000, contributions: [{ member: 'b@test.com', amount: 2000 }], splitAmong: ['a@test.com', 'b@test.com'] },
  ],
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

// Seed defaults on first load only.
if (read(KEYS.version) !== VERSION) {
  // Older data used user ids for members; reset groups/expenses to the new shape.
  write(KEYS.groups, SEED.groups)
  write(KEYS.expenses, SEED.expenses)
  write(KEYS.version, VERSION)
}
if (read(KEYS.users) === null) write(KEYS.users, SEED.users)

export const getUsers = () => read(KEYS.users) ?? []
export const saveUsers = (users) => write(KEYS.users, users)

export const getSession = () => read(KEYS.session)
export const saveSession = (userId) => write(KEYS.session, userId)
export const clearSession = () => {
  try {
    localStorage.removeItem(KEYS.session)
  } catch {
    /* ignore */
  }
}

export const getGroups = () => read(KEYS.groups) ?? []
export const saveGroups = (groups) => write(KEYS.groups, groups)

export const getExpenses = () => read(KEYS.expenses) ?? []
export const saveExpenses = (expenses) => write(KEYS.expenses, expenses)
