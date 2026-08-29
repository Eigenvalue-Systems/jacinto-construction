import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="admin-empty">
      <p>404</p>
      <p style={{ color: 'var(--ink-soft)' }}>This page is not part of the admin console.</p>
      <Link href="/admin/projects" className="btn btn-ink btn-sm">
        Projects
      </Link>
    </div>
  )
}
