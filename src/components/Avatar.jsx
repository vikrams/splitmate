export default function Avatar({ name }) {
  const initials = String(name ?? '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()
  return <span className="avatar">{initials || '?'}</span>
}
