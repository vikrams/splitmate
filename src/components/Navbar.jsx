import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-10 h-14 border-b border-line bg-surface">
      <div className="mx-auto flex h-full max-w-[680px] items-center justify-between px-4">
        <Link to="/dashboard" className="text-base font-bold text-ink">
          Splitmate
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-2">{user.name}</span>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="cursor-hand-lg text-ink-3 hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
