import { Link } from 'react-router-dom'
import Logo from './Logo'

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input {...props} className="input" />
    </label>
  )
}

export default function AuthCard({ title, error, onSubmit, submitLabel, children, footer }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[680px] px-4 pt-8">
        <Link to="/"><Logo /></Link>
      </div>
      <main className="mx-auto max-w-[400px] px-4 pt-16">
        <form onSubmit={onSubmit} className="card flex flex-col gap-4">
          <div>
            <h1 className="h1">{title}</h1>
            <p className="sub mt-1">Welcome to Splitmate.</p>
          </div>
          {error && <p className="alert">{error}</p>}
          {children}
          <button className="btn btn-primary w-full">{submitLabel}</button>
          <p className="sub text-center">{footer}</p>
        </form>
      </main>
    </div>
  )
}
