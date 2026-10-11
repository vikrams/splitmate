import { createContext, useContext, useState } from 'react'
import {
  addUser,
  clearSession,
  getSessionUserId,
  getUsers,
  initStorage,
  setSessionUserId,
} from '../data/storage'

const AuthContext = createContext(null)

const norm = (email) => email.trim().toLowerCase()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    initStorage()
    const id = getSessionUserId()
    return getUsers().find((u) => u.id === id) || null
  })

  const register = ({ name, email, password }) => {
    const e = norm(email)
    if (getUsers().some((u) => u.email === e)) {
      return { ok: false, error: 'An account with this email already exists.' }
    }
    const created = addUser({ name: name.trim(), email: e, password })
    setSessionUserId(created.id)
    setUser(created)
    return { ok: true }
  }

  const login = (email, password) => {
    const found = getUsers().find((u) => u.email === norm(email) && u.password === password)
    if (!found) return { ok: false, error: 'Invalid email or password.' }
    setSessionUserId(found.id)
    setUser(found)
    return { ok: true }
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  // Lookup helpers so other code never reads the user store directly.
  const findUserByEmail = (email) => getUsers().find((u) => u.email === norm(email)) || null
  const displayName = (email) => findUserByEmail(email)?.name || email

  return (
    <AuthContext.Provider
      value={{ user, register, login, logout, findUserByEmail, displayName }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
