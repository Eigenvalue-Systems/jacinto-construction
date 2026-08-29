import Link from 'next/link'
import { deleteMediaImage } from '@/app/admin/actions'
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'
import { getAdminRepo } from '@/lib/data'

export default async function MediaPage() {
  await requireAdmin()
  const { dict } = await adminDictionary()
  const t = dict.admin.media
  const repo = await getAdminRepo()
  const images = await repo.listAllImages()
  const projects = await repo.listAllProjects()
  const projectIdBySlug = new Map(projects.map((p) => [p.slug, p.id]))

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">{t.title}</h1>
          <p className="admin-intro">{t.intro}</p>
        </div>
      </div>
      {images.length === 0 ? (
        <div className="admin-empty">
          <p>{t.empty}</p>
        </div>
      ) : (
        <ul className="media-grid">
          {images.map((image) => {
            const projectId = image.projectSlug ? projectIdBySlug.get(image.projectSlug) : null
            return (
              <li key={image.id} className="media-item">
                <img className="media-img" src={repo.imageUrls(image).thumb} alt={image.altText} loading="lazy" />
                <span className="media-meta" title={image.projectName ?? t.siteImage}>
                  {image.projectName ?? t.siteImage}
                </span>
                <div className="admin-actions">
                  {projectId ? (
                    <Link href={`/admin/projects/${projectId}`} className="link-plain" style={{ fontSize: 13 }}>
                      {t.openProject}
                    </Link>
                  ) : null}
                  <form action={deleteMediaImage}>
                    <input type="hidden" name="id" value={image.id} />
                    <ConfirmSubmit className="link-plain" confirm={t.deleteConfirm}>
                      <span style={{ fontSize: 13, color: 'var(--brick-deep)' }}>{t.delete}</span>
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
