import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  ['Create groups', 'Set up a group for a trip, flat or dinner and invite people by email.'],
  ['Track shared expenses', 'Log who paid and who shares each cost, split equally.'],
  ['See who owes what', 'Get the fewest possible payments to settle everyone up.'],
]

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return (
    <div className="mx-auto max-w-[680px] px-4 py-20">
      <p className="mb-12 text-base font-bold">Splitmate</p>
      <h1 className="text-2xl font-extrabold">Split expenses with friends, effortlessly.</h1>
      <p className="mt-3 text-base text-ink-2">
        Splitmate keeps track of shared costs so nobody has to do the maths.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link to="/register" className="btn btn-primary">Get started</Link>
        <Link to="/login" className="link text-sm">Sign in</Link>
      </div>
      <div className="mt-16 grid gap-2 sm:grid-cols-3">
        {features.map(([title, text]) => (
          <div key={title} className="card">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-ink-2">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
