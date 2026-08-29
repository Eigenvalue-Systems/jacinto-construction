import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteProject, duplicateProject } from '@/app/admin/actions'
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit'
import { PhotoManager, type ManagedImage } from '@/components/admin/PhotoManager'
import { ProjectEditor } from '@/components/admin/ProjectEditor'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'
import { getAdminRepo } from '@/lib/data'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { dict } = await adminDictionary()
  const repo = await getAdminRepo()
  const project = await repo.getProjectById(id)
  if (!project) notFound()
  const t = dict.admin.editor
  const images: ManagedImage[] = project.images.map((img) => ({ ...img, urls: repo.imageUrls(img) }))

  return (
    <>
      <div className="admin-head">
        <div>
          <Link href="/admin/projects" className="mono muted">
            ← {t.backToList}
          </Link>
          <h1 className="admin-title" style={{ marginTop: 10 }}>
            {project.name}
          </h1>
          <div className="admin-row-meta">
            <span className={`status-pill ${project.published ? 'status-published' : 'status-draft'}`}>{project.published ? t.published : t.draft}</span>
            {project.isDemo ? <span className="status-pill status-sample">{dict.admin.projects.sample}</span> : null}
          </div>
        </div>
        <div className="admin-actions">
          <Link href={`/admin/projects/${project.id}/preview`} className="btn btn-outline btn-sm">
            {t.preview}
          </Link>
          {project.published ? (
            <a href={`/projects/${project.slug}`} className="btn btn-outline btn-sm" target="_blank" rel="noopener">
              {t.viewLive} ↗
            </a>
          ) : null}
        </div>
      </div>

      {project.isDemo ? <p className="admin-notice">{t.sampleNotice}</p> : null}

      <ProjectEditor
        project={project}
        strings={t}
        photos={
          <>
            <p className="admin-section-hint" style={{ marginTop: -12 }}>
              {t.photosHint}
            </p>
            <PhotoManager projectId={project.id} projectName={project.name} initialImages={images} initialCoverId={project.coverImageId} strings={dict.admin.photos} />
          </>
        }
      />

      <section className="admin-section">
        <div className="admin-actions">
          <form action={duplicateProject}>
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn btn-outline btn-sm">
              {t.duplicate}
            </button>
          </form>
          <form action={deleteProject}>
            <input type="hidden" name="id" value={project.id} />
            <ConfirmSubmit className="btn btn-outline btn-danger btn-sm" confirm={t.deleteConfirm}>
              {t.delete}
            </ConfirmSubmit>
          </form>
        </div>
      </section>
    </>
  )
}
