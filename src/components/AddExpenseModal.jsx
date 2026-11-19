import { useState } from 'react'
import { addExpense, displayName } from '../utils/groups'
import { formatMoney } from '../utils/balances'

export default function AddExpenseModal({ group, onClose, onSaved }) {
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState([{ member: group.members[0], amount: '' }])
  const [error, setError] = useState('')
  const [mode, setMode] = useState('equal') // 'equal' | 'exact'
  const [sharing, setSharing] = useState(group.members) // who shared this expense
  const [owed, setOwed] = useState({}) // member -> amount string (exact mode)

  const total = rows.reduce((t, r) => t + (Number(r.amount) > 0 ? Number(r.amount) : 0), 0)
  const each = sharing.length ? total / sharing.length : 0
  const assigned = sharing.reduce((t, m) => t + (Number(owed[m]) > 0 ? Number(owed[m]) : 0), 0)
  const left = Math.round((total - assigned) * 100) / 100
  const balanced = mode === 'equal' ? sharing.length > 0 : sharing.length > 0 && left === 0 && total > 0
  const toggle = (m) => setSharing(sharing.includes(m) ? sharing.filter((x) => x !== m) : [...sharing, m])
  const update = (i, patch) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const unused = group.members.filter((m) => !rows.some((r) => r.member === m))

  function handleSubmit(e) {
    e.preventDefault()
    const res = addExpense(group, {
      description,
      contributions: rows,
      splitAmong: sharing,
      shares: mode === 'exact' ? sharing.map((m) => ({ member: m, amount: owed[m] })) : undefined,
    })
    if (res.ok) onSaved()
    else setError(res.error)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="modal flex flex-col gap-4"
      >
        <div className="modal-head" style={{ marginBottom: 0 }}>
          <h2 className="card-title">Add expense</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="x-btn">×</button>
        </div>
        {error && <p className="alert">{error}</p>}

        <label className="block">
          <span className="label">Expense (e.g. Food, Lodging, Transportation)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
        </label>

        <div>
          <span className="label">Who contributed, and how much?</span>
          <div className="list">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <select value={r.member} onChange={(e) => update(i, { member: e.target.value })} className="input min-w-0 flex-1">
                  {group.members.filter((m) => m === r.member || unused.includes(m)).map((m) => (
                    <option key={m} value={m}>{displayName(m)}</option>
                  ))}
                </select>
                <input type="number" min="0" step="0.01" placeholder="₹ amount" value={r.amount} onChange={(e) => update(i, { amount: e.target.value })} className="input !w-28" />
                {rows.length > 1 && (
                  <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} aria-label="Remove" className="px-2 text-ink-3 hover:text-danger">✕</button>
                )}
              </div>
            ))}
          </div>
          {unused.length > 0 && (
            <button type="button" onClick={() => setRows([...rows, { member: unused[0], amount: '' }])} className="link mt-2">
              + Add another member
            </button>
          )}
        </div>

        <div>
          <span className="label">Split</span>
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => setMode('equal')} className={`btn ${mode === 'equal' ? 'btn-primary' : 'btn-secondary'}`}>Equally</button>
            <button type="button" onClick={() => setMode('exact')} className={`btn ${mode === 'exact' ? 'btn-primary' : 'btn-secondary'}`}>By amount</button>
          </div>
          <ul className="list">
            {group.members.map((m) => (
              <li key={m} className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={sharing.includes(m)} onChange={() => toggle(m)} className="accent-[#EA580C]" />
                  {displayName(m)}
                </label>
                {sharing.includes(m) && (mode === 'exact' ? (
                  <input type="number" min="0" step="0.01" placeholder="₹ owes" value={owed[m] ?? ''} onChange={(e) => setOwed({ ...owed, [m]: e.target.value })} className="input !w-28" aria-label={`${displayName(m)} owes`} />
                ) : (
                  <span className="money text-ink-2">{formatMoney(each)}</span>
                ))}
              </li>
            ))}
          </ul>
        </div>

        {mode === 'exact' ? (
          <p className={`rounded-lg px-3 py-2 text-sm ${left === 0 && total > 0 ? 'neu' : 'neg'}`}>
            {left === 0 && total > 0 ? `All ${formatMoney(total)} assigned.` : `${formatMoney(left)} ${left < 0 ? 'over' : 'left to assign'} (total ${formatMoney(total)}).`}
          </p>
        ) : (
          <p className="neu rounded-lg px-3 py-2 text-sm">
            Total {formatMoney(total)}, shared equally by {sharing.length} {sharing.length === 1 ? 'member' : 'members'} ({formatMoney(each)} each).
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button disabled={!balanced} className="btn btn-primary">Save expense</button>
        </div>
      </form>
    </div>
  )
}
