import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthCard, { Field } from '../components/AuthForm'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  function handleSubmit(e) {
    e.preventDefault()
    const res = login(email, password)
    if (res.ok) navigate('/dashboard')
    else setError(res.error)
  }

  return (
    <AuthCard
      title="Log in to Splitmate"
      error={error}
      onSubmit={handleSubmit}
      submitLabel="Log in"
      footer={<>New here? <Link to="/register" className="link">Create an account</Link></>}
    >
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </AuthCard>
  )
}
