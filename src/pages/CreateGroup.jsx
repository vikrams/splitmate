import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUsers } from '../data/storage'
import { createGroup, isRegistered, isValidEmail, normEmail, displayName } from '../utils/groups'
import MemberBadge from '../components/MemberBadge'
import Navbar from '../components/Navbar'
import { Field } from '../components/AuthForm'

export default function CreateGroup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState([]) // extra members (emails), creator is implicit
  const [emailInput, setEmailInput] = useState('')
  const [error, setError] = useState('')

  function addMember() {
    const email = normEmail(emailInput)
    if (!isValidEmail(email)) return setError('Enter a valid member email.')
    if (email === user.email || members.includes(email)) return setError('That member is already in the group.')
    setError('')
    setMembers([...members, email])
    setEmailInput('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const res = createGroup(user.email, { name, description, members })
    if (res.ok) navigate(`/group/${res.group.id}`)
    else setError(res.error)
  }

  const suggestions = getUsers().filter((u) => u.email !== user.email && !members.includes(u.email))

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="page">
      <Link to="/dashboard" className="link">← Back to dashboard</Link>
      <form onSubmit={handleSubmit} className="card mt-4 flex flex-col gap-4">
        <h1 className="h1">Create group</h1>
        {error && <p className="alert">{error}</p>}
        <Field label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip" />
        <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />

        <div>
          <span className="label">Members</span>
          <div className="flex gap-2">
            <input
              type="email"
              list="known-users"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
              placeholder="Member email"
              className="input"
            />
            <datalist id="known-users">
              {suggestions.map((u) => <option key={u.id} value={u.email}>{u.name}</option>)}
            </datalist>
            <button type="button" onClick={addMember} className="btn btn-secondary">Add</button>
          </div>
          <p className="meta mt-1">Registered users show as Active; others show as Pending until they sign up with that email.</p>

          <ul className="mt-3 divide-y rounded-lg border bg-white">
            <li className="flex items-center justify-between px-3 py-2">
              <span>{user.name} (you) <span className="text-sm text-ink-2">{user.email}</span></span>
              <MemberBadge active />
            </li>
            {members.map((email) => (
              <li key={email} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="min-w-0 truncate">
                  {isRegistered(email) ? displayName(email) : email}
                  {isRegistered(email) && <span className="text-sm text-ink-2"> {email}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <MemberBadge active={isRegistered(email)} />
                  <button type="button" onClick={() => setMembers(members.filter((m) => m !== email))} className="link-danger">Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button className="btn btn-primary w-full">Create group</button>
      </form>
      </div>
    </div>
  )
}
