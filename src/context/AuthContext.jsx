import { createContext, useContext, useState } from 'react'
import {
  getUsers,
  saveUsers,
  getSession,
  saveSession,
  clearSession,
} from '../data/storage'

const AuthContext = createContext(null)

const strip = ({ password, ...rest }) => rest // never expose password

function loadSessionUser() {
  const id = getSession()
  const found = id && getUsers().find((u) => u.id === id)
  return found ? strip(found) : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSessionUser)

  // Each returns { ok: true } or { ok: false, error }
  function register(name, email, password) {
    name = name.trim()
    email = email.trim().toLowerCase()
    if (!name || !email || !password) return { ok: false, error: 'All fields are required.' }
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'Enter a valid email.' }
    if (password.length < 4) return { ok: false, error: 'Password must be at least 4 characters.' }
    const users = getUsers()
    if (users.some((u) => u.email.toLowerCase() === email))
      return { ok: false, error: 'An account with this email already exists.' }
    const newUser = { id: 'u' + Date.now(), name, email, password }
    saveUsers([...users, newUser])
    saveSession(newUser.id)
    setUser(strip(newUser))
    return { ok: true }
  }

  function login(email, password) {
    email = email.trim().toLowerCase()
    const found = getUsers().find((u) => u.email.toLowerCase() === email && u.password === password)
    if (!found) return { ok: false, error: 'Invalid email or password.' }
    saveSession(found.id)
    setUser(strip(found))
    return { ok: true }
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
