import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AddExpenseModal from '../components/AddExpenseModal'
import { useAuth } from '../context/AuthContext'
import { addExpense, getExpenses, getGroup, removeGroupMember, replaceExpense, softDeleteExpense } from '../data/storage'
import { computeNet, computeSettlements } from '../utils/balances'
import { initials } from '../utils/format'
import { formatMoney } from '../utils/money'

export default function GroupDetail() {
  const { id } = useParams()
  const { user, findUserByEmail, displayName } = useAuth()
  const [group, setGroup] = useState(() => getGroup(id))
  const [expenses, setExpenses] = useState(() => getExpenses(id))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  if (!group || !group.members.includes(user.email)) {
    return (
      <div>
        <p className="mb-3 text-sm text-ink-3">Group not found.</p>
        <Link to="/dashboard" className="link text-sm">Back to dashboard</Link>
      </div>
    )
  }

  const refresh = () => setExpenses(getExpenses(id))
  const visible = expenses.filter((e) => !e.isDeleted).sort((a, b) => b.date.localeCompare(a.date))
  const settlements = computeSettlements(expenses)
  // Legacy expenses have no createdBy; the payer is the best guess at who entered them.
  const creatorOf = (e) => e.createdBy ?? e.paidBy
  const net = computeNet(expenses)
  const isOwner = group.createdBy === user.email
  // Keep people who were removed but still appear on an expense being edited.
  const modalMembers = editing
    ? [...new Set([...group.members, editing.paidBy, ...editing.participants])]
    : group.members

  const settle = (s) => {
    if (!confirm(`Record that ${who(s.from).toLowerCase()} paid ${s.to === user.email ? 'you' : displayName(s.to)} ${formatMoney(s.amountCents)}?`)) return
    addExpense({
      groupId: id,
      description: 'Payment',
      amountCents: s.amountCents,
      date: new Date().toISOString().slice(0, 10),
      paidBy: s.from,
      participants: [s.to],
      splits: [{ email: s.to, amountCents: s.amountCents }],
      splitMode: 'manual',
      isSettlement: true,
      createdBy: user.email,
    })
    refresh()
  }

  const removeMember = (email) => {
    if ((net[email] || 0) !== 0) {
      alert(`${displayName(email)} still has a balance of ${formatMoney(Math.abs(net[email]))}. Settle up before removing them.`)
      return
    }
    if (confirm(`Remove ${displayName(email)} from this group?`)) setGroup(removeGroupMember(id, email))
  }

  const who = (email) => (email === user.email ? 'You' : displayName(email))

  const mine = settlements.filter((s) => s.from === user.email || s.to === user.email)
  const others = settlements.filter((s) => s.from !== user.email && s.to !== user.email)
  const phrase = (s) => {
    const verb = s.from === user.email ? 'owe' : 'owes'
    const target = s.to === user.email ? 'you' : displayName(s.to)
    return `${who(s.from)} ${verb} ${target}`
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard" className="text-sm text-ink-2 hover:text-ink">← Dashboard</Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">{group.name}</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">Add expense</button>
        </div>
      </div>

      <section>
        <h2 className="section-title">Members</h2>
        <ul className="flex flex-wrap gap-2">
          {group.members.map((m) => {
            const u = findUserByEmail(m)
            return (
              <li key={m} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm">
                <span className="avatar">{initials(u ? u.name : m)}</span>
                {u ? u.name : m}
                <span className={`badge ${u ? 'badge-active' : 'badge-pending'}`}>
                  {u ? 'active' : 'pending'}
                </span>
                {isOwner && m !== group.createdBy && (
                  <button onClick={() => removeMember(m)} aria-label={`Remove ${m}`} className="text-ink-3 hover:text-danger">×</button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="section-title">Balances</h2>
        {settlements.length === 0 ? (
          <div className="card py-8 text-center text-sm text-ink-3">All settled up.</div>
        ) : (
          <div className="space-y-2">
            {mine.map((s) => {
              const owing = s.from === user.email
              return (
                <div
                  key={s.from + s.to}
                  className={`flex items-center justify-between rounded-xl px-5 py-4 ${owing ? 'bg-neg-bg text-neg-fg' : 'bg-pos-bg text-pos-fg'}`}
                >
                  <span className="text-base font-semibold">{phrase(s)}</span>
                  <span className="flex items-center gap-3">
                    <button onClick={() => settle(s)} className="btn btn-secondary">Settle up</button>
                    <span className="amount text-2xl font-extrabold">{formatMoney(s.amountCents)}</span>
                  </span>
                </div>
              )
            })}
            {others.map((s) => (
              <div key={s.from + s.to} className="flex items-center justify-between rounded-xl bg-neu-bg px-5 py-3 text-neu-fg">
                <span className="text-sm">{phrase(s)}</span>
                <span className="amount text-base">{formatMoney(s.amountCents)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">Expenses</h2>
        {visible.length === 0 ? (
          <div className="card py-8 text-center text-sm text-ink-3">No expenses yet.</div>
        ) : (
          <ul className="space-y-2">
            {visible.map((e) => (
              <li key={e.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">
                    {e.isSettlement ? `${who(e.paidBy)} paid ${e.participants[0] === user.email ? 'you' : displayName(e.participants[0])}` : e.description}
                  </p>
                  <p className="text-xs text-ink-3">
                    {e.isSettlement ? 'Payment' : `Paid by ${e.paidBy === user.email ? 'you' : displayName(e.paidBy)}`} · {new Date(e.date + 'T00:00').toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="amount text-lg font-extrabold">{formatMoney(e.amountCents)}</span>
                  {!e.isSettlement && creatorOf(e) === user.email && (
                    <button onClick={() => setEditing(e)} className="text-sm text-primary hover:underline">
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Delete this expense?')) {
                        softDeleteExpense(e.id)
                        refresh()
                      }
                    }}
                    className="text-sm text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(showModal || editing) && (
        <AddExpenseModal
          members={modalMembers}
          expense={editing}
          onCancel={() => {
            setShowModal(false)
            setEditing(null)
          }}
          onSave={(data) => {
            if (editing) replaceExpense(editing.id, { ...data, groupId: id, createdBy: creatorOf(editing) })
            else addExpense({ ...data, groupId: id, createdBy: user.email })
            refresh()
            setShowModal(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
