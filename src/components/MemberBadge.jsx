export default function MemberBadge({ active }) {
  return (
    <span className={`badge ${active ? 'badge-active' : 'badge-pending'}`}>
      {active ? 'Active' : 'Pending'}
    </span>
  )
}
