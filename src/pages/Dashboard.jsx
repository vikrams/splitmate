import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getGroups, getExpenses, getUsers } from '../data/storage'
import { getGroupExpenses, displayName } from '../utils/groups'
import { groupStats, formatMoney } from '../utils/balances'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'
import GroupModal from '../components/GroupModal'

const EPS = 0.005

function NetPill({ net }) {
  if (Math.abs(net) < EPS) return <span className="pill neu">settled</span>
  return net > 0
    ? <span className="pill pos">gets back {formatMoney(net)}</span>
    : <span className="pill neg">owes {formatMoney(net)}</span>
}

function GroupExpenses({ groupId }) {
  const expenses = getGroupExpenses(groupId)
  return (
    <div className="mt-4 border-t pt-4">
      <p className="meta mb-2">Expenses ({expenses.length})</p>
      {expenses.length === 0 ? (
        <p className="meta">No expenses yet.</p>
      ) : (
        <ul className="list">
          {[...expenses].reverse().map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0 truncate">
                {e.description}
                <span className="meta"> · paid by {e.contributions.map((c) => displayName(c.member)).join(', ')}</span>
              </span>
              <span className="money shrink-0">{formatMoney(e.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [openGroupId, setOpenGroupId] = useState(null)
  const [, setVersion] = useState(0) // bump to re-read storage after saving
  const users = getUsers()
  const nameOf = (email) => users.find((u) => u.email === email)?.name ?? email
  const expenses = getExpenses()
  const groups = getGroups()
    .filter((g) => g.members.includes(user.email))
    .map((g) => ({ group: g, stats: groupStats(g, expenses) }))

  let owed = 0
  let owe = 0
  for (const { stats } of groups) {
    const net = stats[user.email].net
    if (net > EPS) owed += net
    else if (net < -EPS) owe += -net
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="page stack">
        <section className="grid grid-cols-2 gap-2">
          <div className="card pos" style={{ borderColor: '#ECFDF5' }}>
            <p className="text-sm">You are owed</p>
            <p className="money-xl mt-2">{formatMoney(owed)}</p>
          </div>
          <div className="card neg" style={{ borderColor: '#FEF2F2' }}>
            <p className="text-sm">You owe</p>
            <p className="money-xl mt-2">{formatMoney(owe)}</p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="card-title">Your groups</h2>
            <Link to="/group/new" className="btn btn-primary">Create group</Link>
          </div>

          {groups.length === 0 ? (
            <p className="empty card">You are not in any groups yet. Create one to get started.</p>
          ) : (
            <div className="list">
              {groups.map(({ group, stats }) => (
                <div key={group.id} className="card">
                  <div className="flex items-baseline justify-between">
                    <button onClick={() => setOpenGroupId(group.id)} className="card-title text-left hover:text-primary">{group.name}</button>
                    <span className="meta">{group.members.length} members</span>
                  </div>
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="meta text-left">
                        <th className="pb-2 font-normal">Member</th>
                        <th className="pb-2 text-right font-normal">Paid</th>
                        <th className="pb-2 text-right font-normal">Share</th>
                        <th className="pb-2 text-right font-normal">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.members.map((id) => (
                        <tr key={id} className="border-t">
                          <td className="py-2">
                            <span className="flex items-center gap-2"><Avatar name={nameOf(id)} />{nameOf(id)}{id === user.email && <span className="text-ink-3"> (you)</span>}</span>
                          </td>
                          <td className="py-2 text-right tabular-nums text-ink-2">{formatMoney(stats[id].paid)}</td>
                          <td className="py-2 text-right tabular-nums text-ink-2">{formatMoney(stats[id].share)}</td>
                          <td className="py-2 text-right"><NetPill net={stats[id].net} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <GroupExpenses groupId={group.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {openGroupId && groups.some(({ group }) => group.id === openGroupId) && (
        <GroupModal
          key={openGroupId}
          group={groups.find(({ group }) => group.id === openGroupId).group}
          onClose={() => setOpenGroupId(null)}
          onSaved={() => { setOpenGroupId(null); setVersion((v) => v + 1) }}
        />
      )}
    </div>
  )
}
