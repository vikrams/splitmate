// Two overlapping circles = one bill, split between mates.
export function LogoMark({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#1C1917" />
      <circle cx="15" cy="20" r="8.5" fill="#ffffff" />
      <circle cx="25" cy="20" r="8.5" fill="#A8A29E" />
      <path d="M20 12.7a8.5 8.5 0 0 1 0 14.6 8.5 8.5 0 0 1 0-14.6z" fill="#57534E" />
    </svg>
  )
}

export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-base font-bold text-ink ${className}`}>
      <LogoMark />
      Splitmate
    </span>
  )
}
