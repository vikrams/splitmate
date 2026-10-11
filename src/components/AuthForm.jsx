import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    const res = isRegister ? register(form) : login(form.email, form.password)
    if (res.ok) navigate('/dashboard')
    else setError(res.error)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link to="/" className="mb-6 text-base font-bold text-ink">Splitmate</Link>
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">{isRegister ? 'Create your account' : 'Sign in'}</h1>
        {isRegister && (
          <input className="input" placeholder="Name" required value={form.name} onChange={set('name')} />
        )}
        <input className="input" type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
        <input className="input" type="password" placeholder="Password" required value={form.password} onChange={set('password')} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn btn-primary w-full">{isRegister ? 'Register' : 'Sign in'}</button>
        <p className="text-center text-sm text-ink-2">
          {isRegister ? (
            <>Already have an account? <Link to="/login" className="link">Sign in</Link></>
          ) : (
            <>New here? <Link to="/register" className="link">Register</Link></>
          )}
        </p>
      </form>
    </div>
  )
}
