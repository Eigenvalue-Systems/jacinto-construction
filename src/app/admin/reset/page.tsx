import { NewPasswordForm } from '@/components/admin/AuthForms'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'

export default async function ResetPage() {
  await requireAdmin()
  const { dict } = await adminDictionary()
  return (
    <div className="admin-section" style={{ maxWidth: 520 }}>
      <NewPasswordForm strings={dict.admin.login} />
    </div>
  )
}
