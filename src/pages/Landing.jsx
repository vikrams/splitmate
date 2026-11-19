import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const features = [
  { title: 'Multiple groups', text: 'Trips, flatmates, dinners — keep every set of friends and their expenses separate.' },
  { title: 'Fair splits', text: 'Add an expense once and Splitmate divides it among the people who shared it.' },
  { title: 'Clear balances', text: 'See at a glance how much you are owed and how much you owe, per group and overall.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="navbar">
        <div className="navbar-inner">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-ink-2 hover:text-ink">Log in</Link>
            <Link to="/register" className="btn btn-primary">Sign up</Link>
          </nav>
        </div>
      </header>

      <main className="page stack" style={{ paddingTop: 64 }}>
        <section>
          <h1 className="text-2xl font-extrabold tracking-tight">Split expenses with friends, without the awkward math.</h1>
          <p className="mt-3 text-base text-ink-2">
            Splitmate helps you share costs among friends across multiple groups — a weekend trip,
            the flat, a team lunch — and always know who owes whom.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="btn btn-primary">New user? Register</Link>
            <Link to="/login" className="btn btn-secondary">Existing user? Log in</Link>
          </div>
        </section>

        <section className="list">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h2 className="card-title">{f.title}</h2>
              <p className="sub mt-1">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
