import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getGroupExpenses, updateGroup, deleteGroup, isRegistered, isValidEmail, normEmail, displayName } from '../utils/groups'
import { formatMoney } from '../utils/balances'
import MemberBadge from './MemberBadge'

const input = 'input'

export default function GroupModal({ group, onClose, onSaved }) {
  const { user } = useAuth()
  const initial = () => ({
    name: group.name,
    description: group.description ?? '',
    members: [...group.members],
    expenses: getGroupExpenses(group.id).map((e) => ({
      ...e,
      contributions: e.contributions.map((c) => ({ ...c })),
      splitAmong: [...e.splitAmong],
    })),
  })
  const [original] = useState(initial)
  const [draft, setDraft] = useState(original)
  const [emailInput, setEmailInput] = useState('')
  const [error, setError] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(original)

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const setExpense = (id, patch) => set({ expenses: draft.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  const setContribution = (e, i, patch) =>
    setExpense(e.id, { contributions: e.contributions.map((c, k) => (k === i ? { ...c, ...patch } : c)) })

  function discard() {
    if (dirty && !window.confirm('Discard your changes?')) return
    onClose()
  }

  function addMember() {
    const email = normEmail(emailInput)
    if (!isValidEmail(email)) return setError('Enter a valid member email.')
    if (draft.members.includes(email)) return setError('That member is already in the group.')
    setError('')
    set({ members: [...draft.members, email] })
    setEmailInput('')
  }

  function removeMember(email) {
    if (draft.expenses.some((e) => e.contributions.some((c) => c.member === email && Number(c.amount) > 0) || e.shares?.some((x) => x.member === email)))
      return setError(`${displayName(email)} is part of an expense. Edit or delete that expense first.`)
    setError('')
    set({ members: draft.members.filter((m) => m !== email) })
  }

  function save() {
    const res = updateGroup(group.id, draft)
    if (res.ok) onSaved()
    else setError(res.error)
  }

  function remove() {
    if (!window.confirm(`Delete "${group.name}" and all its expenses? This cannot be undone.`)) return
    const res = deleteGroup(group.id, user.email)
    if (res.ok) onSaved()
    else setError(res.error)
  }

  return (
    <div className="overlay" onClick={discard}>
      <div onClick={(e) => e.stopPropagation()} className="modal modal-wide flex flex-col">
        <div className="modal-head">
          <h2 className="card-title">Group details</h2>
          <div className="flex items-center gap-4">
            <Link to={`/group/${group.id}`} className="link">Open full page →</Link>
            <button type="button" onClick={discard} aria-label="Close" className="x-btn">×</button>
          </div>
        </div>

        <div className="space-y-6">
          {error && <p className="alert">{error}</p>}

          <section className="space-y-3">
            <label className="block">
              <span className="label">Group name</span>
              <input className={input} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Description</span>
              <input className={input} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
            </label>
          </section>

          <section>
            <h3 className="card-title mb-2">Members</h3>
            <ul className="divide-y rounded-lg border">
              {draft.members.map((m) => (
                <li key={m} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 truncate">
                    {displayName(m)}{m === user.email && ' (you)'}
                    {isRegistered(m) && <span className="text-sm text-ink-2"> {m}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <MemberBadge active={isRegistered(m)} />
                    {m !== user.email && (
                      <button type="button" onClick={() => removeMember(m)} className="link-danger">Remove</button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                placeholder="Add member by email"
                className={input}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
              />
              <button type="button" onClick={addMember} className="btn btn-secondary">Add</button>
            </div>
          </section>

          <section>
            <h3 className="card-title mb-2">Expenses</h3>
            {draft.expenses.length === 0 ? (
              <p className="text-sm text-ink-3">No expenses yet.</p>
            ) : (
              <ul className="space-y-3">
                {draft.expenses.map((e) => {
                  const total = e.contributions.reduce((t, c) => t + (Number(c.amount) > 0 ? Number(c.amount) : 0), 0)
                  const used = e.contributions.map((c) => c.member)
                  const free = draft.members.filter((m) => !used.includes(m))
                  return (
                    <li key={e.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <input className={input} value={e.description} onChange={(ev) => setExpense(e.id, { description: ev.target.value })} placeholder="Description" />
                        <button type="button" onClick={() => set({ expenses: draft.expenses.filter((x) => x.id !== e.id) })} className="shrink-0 link-danger">Delete</button>
                      </div>
                      {e.contributions.map((c, i) => (
                        <div key={i} className="flex gap-2">
                          <select className="input min-w-0 flex-1" value={c.member} onChange={(ev) => setContribution(e, i, { member: ev.target.value })}>
                            {draft.members.filter((m) => m === c.member || free.includes(m)).map((m) => (
                              <option key={m} value={m}>{displayName(m)}</option>
                            ))}
                          </select>
                          <input type="number" min="0" step="0.01" className="input !w-28" value={c.amount} onChange={(ev) => setContribution(e, i, { amount: ev.target.value })} />
                          {e.contributions.length > 1 && (
                            <button type="button" aria-label="Remove contribution" className="px-2 text-ink-3 hover:text-danger" onClick={() => setExpense(e.id, { contributions: e.contributions.filter((_, k) => k !== i) })}>✕</button>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm text-ink-2">
                        {free.length > 0 ? (
                          <button type="button" className="link" onClick={() => setExpense(e.id, { contributions: [...e.contributions, { member: free[0], amount: '' }] })}>+ Add contributor</button>
                        ) : <span />}
                        <span>Total {formatMoney(total)} · {e.shares ? `unequal split among ${e.splitAmong.length}` : `${formatMoney(total / e.splitAmong.length)} each among ${e.splitAmong.length}`}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t pt-4">
          {group.createdBy === user.email && (
            <button type="button" onClick={remove} className="btn btn-danger">Delete group</button>
          )}
          <span className="flex-1" />
          <button type="button" onClick={discard} className="btn btn-secondary">Discard</button>
          <button type="button" onClick={save} disabled={!dirty} className="btn btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  )
}
