import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatMoney, splitEqually, toCents } from '../utils/money'

export default function AddExpenseModal({ members, expense, onSave, onCancel }) {
  const { user, displayName } = useAuth()
  const isEdit = !!expense
  const [description, setDescription] = useState(expense?.description ?? '')
  const [amount, setAmount] = useState(expense ? (expense.amountCents / 100).toFixed(2) : '')
  const [date, setDate] = useState(() => expense?.date ?? new Date().toISOString().slice(0, 10))
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? (members.includes(user.email) ? user.email : members[0]))
  const [participants, setParticipants] = useState(expense?.participants ?? members)

  const [splitMode, setSplitMode] = useState(expense?.splitMode ?? 'equal')
  // Typed custom amounts (dollar strings) by email; kept when switching back to equal.
  const [manual, setManual] = useState(() =>
    expense?.splitMode === 'manual' && expense.splits
      ? Object.fromEntries(expense.splits.map((s) => [s.email, (s.amountCents / 100).toFixed(2)]))
      : {},
  )

  const cents = toCents(amount)
  const isManual = splitMode === 'manual'
  const shares = splitEqually(cents, participants)
  const assigned = participants.reduce((sum, m) => sum + toCents(manual[m]), 0)
  const remaining = cents - assigned
  const hasNegative = participants.some((m) => toCents(manual[m]) < 0)
  const splitOk = !isManual || (remaining === 0 && !hasNegative)
  const canSave = cents > 0 && participants.length > 0 && description.trim() !== '' && splitOk

  const toggle = (email) => {
    if (participants.includes(email)) {
      setParticipants(participants.filter((p) => p !== email))
      setManual(({ [email]: _removed, ...rest }) => rest)
    } else {
      setParticipants([...participants, email])
    }
  }

  const switchMode = (mode) => {
    // First visit to custom: start from the current equal split so the user just tweaks it.
    if (mode === 'manual' && Object.keys(manual).length === 0) {
      setManual(Object.fromEntries(participants.map((m) => [m, (shares[m] / 100).toFixed(2)])))
    }
    setSplitMode(mode)
  }

  const fillRemaining = () => {
    const blanks = participants.filter((m) => !manual[m])
    if (blanks.length === 0 || remaining <= 0) return
    const extra = splitEqually(remaining, blanks)
    setManual({ ...manual, ...Object.fromEntries(blanks.map((m) => [m, (extra[m] / 100).toFixed(2)])) })
  }

  const submit = (e) => {
    e.preventDefault()
    if (!canSave) return
    const splits = participants
      .map((email) => ({ email, amountCents: isManual ? toCents(manual[email]) : shares[email] }))
      .filter((s) => !isManual || s.amountCents > 0)
    onSave({
      description: description.trim(),
      amountCents: cents,
      date,
      paidBy,
      participants: splits.map((s) => s.email),
      splits,
      splitMode,
    })
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-[480px] overflow-y-auto rounded-2xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit expense' : 'Add expense'}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-xl leading-none text-ink-3 hover:text-ink">
            ×
          </button>
        </div>
        <div className="space-y-4">
          <input className="input" placeholder="What was it for?" required value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-2">
            <input className="input" type="number" min="0.01" step="0.01" placeholder="Amount" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <label className="block text-sm text-ink-2">
            Paid by
            <select className="input mt-1 text-ink" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {members.map((m) => (
                <option key={m} value={m}>{displayName(m)}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="mb-1 text-sm text-ink-2">Shared by</legend>
            <div className="mb-2 flex gap-2">
              {[['equal', 'Split equally'], ['manual', 'Custom amounts']].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => switchMode(mode)}
                  aria-pressed={splitMode === mode}
                  className={`btn ${splitMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {members.map((m) => (
              <label key={m} className="flex items-center justify-between py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <input type="checkbox" className="accent-primary" checked={participants.includes(m)} onChange={() => toggle(m)} />
                  {displayName(m)}
                </span>
                {isManual ? (
                  <input
                    className="input w-28 text-right"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={!participants.includes(m)}
                    value={participants.includes(m) ? manual[m] ?? '' : ''}
                    onChange={(e) => setManual({ ...manual, [m]: e.target.value })}
                  />
                ) : (
                  <span className="amount text-ink-2">
                    {participants.includes(m) ? formatMoney(shares[m] || 0) : '—'}
                  </span>
                )}
              </label>
            ))}
            {isManual && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className={remaining === 0 && !hasNegative ? 'text-green-600' : 'text-red-600'}>
                  Assigned {formatMoney(assigned)} of {formatMoney(cents)}
                  {remaining > 0 && ` — ${formatMoney(remaining)} remaining`}
                  {remaining < 0 && ` — over by ${formatMoney(-remaining)}`}
                </span>
                {remaining > 0 && participants.some((m) => !manual[m]) && (
                  <button type="button" onClick={fillRemaining} className="text-primary hover:underline">
                    Split remaining equally
                  </button>
                )}
              </div>
            )}
          </fieldset>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button disabled={!canSave} className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  )
}
