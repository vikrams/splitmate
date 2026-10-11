import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addGroup } from '../data/storage'
import { initials } from '../utils/format'

export default function CreateGroup() {
  const { user, findUserByEmail } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [members, setMembers] = useState([user.email])
  const [error, setError] = useState('')

  const addMember = () => {
    const email = emailInput.trim().toLowerCase()
    if (!email) return
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (members.includes(email)) return setError('That person is already added.')
    setMembers([...members, email])
    setEmailInput('')
    setError('')
  }

  const save = (e) => {
    e.preventDefault()
    const group = addGroup({ name: name.trim(), createdBy: user.email, members })
    navigate(`/group/${group.id}`)
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <h1 className="text-xl font-bold">Create group</h1>
      <section className="card space-y-4">
        <label className="block text-sm text-ink-2">
          Group name
          <input
            className="input mt-1 text-ink"
            placeholder="e.g. Goa trip"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div>
          <p className="mb-1 text-sm text-ink-2">Add members</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addMember()
                }
              }}
            />
            <button type="button" onClick={addMember} className="btn btn-secondary">Add</button>
          </div>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      </section>

      <section>
        <h2 className="section-title">Members</h2>
        <ul className="space-y-2">
          {members.map((email) => {
            const u = findUserByEmail(email)
            return (
              <li key={email} className="card flex items-center justify-between py-3">
                <span className="flex items-center gap-3 text-sm">
                  <span className="avatar">{initials(u ? u.name : email)}</span>
                  <span>
                    {u ? u.name : email}
                    {email === user.email && <span className="text-ink-3"> (you)</span>}
                    {u && <span className="ml-2 text-xs text-ink-3">{email}</span>}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`badge ${u ? 'badge-active' : 'badge-pending'}`}>
                    {u ? 'active' : 'pending'}
                  </span>
                  {email !== user.email && (
                    <button type="button" onClick={() => setMembers(members.filter((m) => m !== email))} className="text-sm text-ink-3 hover:text-danger">
                      Remove
                    </button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
      <button className="btn btn-primary">Save group</button>
    </form>
  )
}
