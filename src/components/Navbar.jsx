import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard"><Logo /></Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-2">{user.name}</span>
          <button onClick={logout} className="text-ink-3 hover:text-ink">Sign out</button>
        </div>
      </div>
    </header>
  )
}
