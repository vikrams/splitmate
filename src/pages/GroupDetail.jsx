import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getGroup, getGroupExpenses, isRegistered, displayName } from '../utils/groups'
import { groupStats, settlements, expenseShares, formatMoney } from '../utils/balances'
import MemberBadge from '../components/MemberBadge'
import Avatar from '../components/Avatar'
import Navbar from '../components/Navbar'
import AddExpenseModal from '../components/AddExpenseModal'

export default function GroupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [version, setVersion] = useState(0) // bump to re-read storage after saving
  void version

  const group = getGroup(id)
  if (!group || !group.members.includes(user.email)) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="page">
          <p className="empty">Group not found, or you are not a member.</p>
          <p className="text-center"><Link to="/dashboard" className="link">Back to dashboard</Link></p>
        </div>
      </div>
    )
  }

  const expenses = getGroupExpenses(group.id)
  const stats = groupStats(group, expenses)
  const debts = settlements(stats)
  const you = (m) => (m === user.email ? `${displayName(m)} (you)` : displayName(m))
  const mine = debts.filter((d) => d.from === user.email || d.to === user.email)
  const others = debts.filter((d) => d.from !== user.email && d.to !== user.email)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page stack">
        <div>
          <Link to="/dashboard" className="link">← Back to dashboard</Link>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="h1">{group.name}</h1>
              {group.description && <p className="sub mt-1">{group.description}</p>}
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary shrink-0">Add expense</button>
          </div>
        </div>

        <section>
          <h2 className="card-title mb-3">Who owes whom</h2>
          {debts.length === 0 ? (
            <p className="empty card">Everyone is settled up.</p>
          ) : (
            <div className="list">
              {mine.map((d, i) => {
                const owed = d.to === user.email
                return (
                  <div key={`m${i}`} className={`card flex items-center justify-between gap-4 ${owed ? 'pos' : 'neg'}`} style={{ borderColor: owed ? '#ECFDF5' : '#FEF2F2' }}>
                    <span className="text-base font-semibold">
                      {owed ? `${displayName(d.from)} owes you` : `You owe ${displayName(d.to)}`}
                    </span>
                    <span className="money-xl">{formatMoney(d.amount)}</span>
                  </div>
                )
              })}
              {others.map((d, i) => (
                <div key={`o${i}`} className="card flex items-center justify-between gap-4 !py-3 text-ink-2">
                  <span className="text-sm">{you(d.from)} owes {you(d.to)}</span>
                  <span className="money text-base text-ink-3">{formatMoney(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="card-title mb-3">Members</h2>
          <ul className="list">
            {group.members.map((m) => (
              <li key={m} className="card flex items-center justify-between !py-3">
                <span className="flex items-center gap-3 text-sm"><Avatar name={displayName(m)} />{you(m)}</span>
                <MemberBadge active={isRegistered(m)} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="card-title mb-3">Expenses</h2>
          {expenses.length === 0 ? (
            <p className="empty card">No expenses yet. Add the first one.</p>
          ) : (
            <ul className="list">
              {[...expenses].reverse().map((e) => (
                <li key={e.id} className="card">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="card-title">{e.description}</span>
                    <span className="money text-lg">{formatMoney(e.amount)}</span>
                  </div>
                  <p className="sub mt-1">
                    Paid by {e.contributions.map((c) => `${displayName(c.member)} ${formatMoney(c.amount)}`).join(', ')}
                  </p>
                  <p className="meta mt-1">
                    {e.shares
                      ? `Split unequally · ${expenseShares(e).map((x) => `${displayName(x.member)} ${formatMoney(x.amount)}`).join(', ')}`
                      : `Split equally among ${e.splitAmong.length} · ${formatMoney(e.amount / e.splitAmong.length)} each`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {showModal && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); setVersion((v) => v + 1) }}
        />
      )}
    </div>
  )
}
