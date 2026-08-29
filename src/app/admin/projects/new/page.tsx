import { NewProjectForm } from '@/components/admin/NewProjectForm'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'

export default async function NewProjectPage() {
  await requireAdmin()
  const { dict } = await adminDictionary()
  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">{dict.admin.newProject.title}</h1>
          <p className="admin-intro">{dict.admin.newProject.hint}</p>
        </div>
      </div>
      <div className="admin-section" style={{ maxWidth: 560 }}>
        <NewProjectForm strings={dict.admin.newProject} errorText={dict.admin.editor.errors.nameRequired} />
      </div>
    </>
  )
}
