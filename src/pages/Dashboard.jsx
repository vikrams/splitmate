import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getExpenses, getGroups } from '../data/storage'
import { computeNet } from '../utils/balances'
import { formatMoney } from '../utils/money'

const tone = (cents) => (cents > 0 ? 'pos' : cents < 0 ? 'neg' : 'neu')
const toneText = { pos: 'text-pos-fg', neg: 'text-neg-fg', neu: 'text-neu-fg' }

function Balance({ cents }) {
  const t = tone(cents)
  const label = cents > 0 ? "You're owed" : cents < 0 ? 'You owe' : 'All settled'
  return (
    <div className="flex flex-col items-end gap-1">
      {cents !== 0 && (
        <span className={`amount text-xl ${toneText[t]}`}>{formatMoney(Math.abs(cents))}</span>
      )}
      <span className={`pill pill-${t}`}>{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const groups = getGroups()
    .filter((g) => g.members.includes(user.email))
    .map((g) => ({ ...g, balance: computeNet(getExpenses(g.id))[user.email] || 0 }))

  const owed = groups.reduce((s, g) => s + Math.max(g.balance, 0), 0)
  const owe = groups.reduce((s, g) => s + Math.max(-g.balance, 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        {groups.length > 0 && (
          <Link to="/group/new" className="btn btn-primary">Create group</Link>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ['Owed to you', owed, 'pos'],
          ['You owe', owe, 'neg'],
          ['Net balance', owed - owe, tone(owed - owe)],
        ].map(([label, v, t]) => (
          <div key={label} className="card">
            <p className="text-sm text-ink-2">{label}</p>
            <p className={`amount mt-1 text-2xl font-extrabold ${toneText[t]}`}>{formatMoney(v)}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="section-title">Your groups</h2>
        {groups.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="mb-4 text-sm text-ink-3">You're not in any groups yet.</p>
            <Link to="/group/new" className="btn btn-primary">Create group</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link to={`/group/${g.id}`} className="card flex items-center justify-between hover:bg-bg">
                  <div>
                    <p className="text-lg font-semibold">{g.name}</p>
                    <p className="text-sm text-ink-2">{g.members.length} members</p>
                  </div>
                  <Balance cents={g.balance} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
