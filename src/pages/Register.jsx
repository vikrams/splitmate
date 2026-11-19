import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthCard, { Field } from '../components/AuthForm'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  function handleSubmit(e) {
    e.preventDefault()
    const res = register(name, email, password)
    if (res.ok) navigate('/dashboard')
    else setError(res.error)
  }

  return (
    <AuthCard
      title="Create your account"
      error={error}
      onSubmit={handleSubmit}
      submitLabel="Register"
      footer={<>Already have an account? <Link to="/login" className="link">Log in</Link></>}
    >
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </AuthCard>
  )
}
