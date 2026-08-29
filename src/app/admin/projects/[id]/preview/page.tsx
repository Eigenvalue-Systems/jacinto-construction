import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectView } from '@/components/site/project/ProjectView'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'
import { getAdminRepo } from '@/lib/data'

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { locale, dict } = await adminDictionary()
  const repo = await getAdminRepo()
  const [project, settings] = await Promise.all([repo.getProjectById(id), repo.getSettings()])
  if (!project) notFound()
  return (
    <>
      <div className="admin-head">
        <div>
          <Link href={`/admin/projects/${project.id}`} className="mono muted">
            ← {dict.admin.editor.backToList}
          </Link>
          <p className="admin-title" style={{ marginTop: 10 }}>
            {dict.admin.editor.preview}: {project.name}
          </p>
        </div>
      </div>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
        <ProjectView locale={locale} dict={dict} project={project} settings={settings} repo={repo} previous={null} next={null} />
      </div>
    </>
  )
}
