import Link from 'next/link'
import { moveProject, removeDemoProjects } from '@/app/admin/actions'
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'
import { getAdminRepo } from '@/lib/data'
import { fmt, plural } from '@/lib/i18n'
import { formatMoney } from '@/lib/data/util'
import { coverOf } from '@/lib/view'

type Search = Promise<Record<string, string | string[] | undefined>>

export default async function AdminProjectsPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin()
  const params = await searchParams
  const { dict } = await adminDictionary()
  const t = dict.admin.projects
  const repo = await getAdminRepo()
  const projects = await repo.listAllProjects()
  const demoCount = projects.filter((p) => p.isDemo).length

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">{t.title}</h1>
          <p className="admin-intro">{plural(projects.length, dict.projects.countOne, dict.projects.countMany)}</p>
        </div>
        <div className="admin-actions">
          <Link href="/admin/projects/new" className="btn btn-ink">
            {t.newProject}
          </Link>
        </div>
      </div>

      {params.deleted === '1' ? (
        <p className="admin-notice admin-notice-ok" role="status">
          {dict.admin.editor.deleted}
        </p>
      ) : null}
      {params.demoRemoved === '1' ? (
        <p className="admin-notice admin-notice-ok" role="status">
          {t.demoRemoved}
        </p>
      ) : null}

      {demoCount > 0 ? (
        <div className="admin-notice">
          <span>{demoCount === 1 ? t.demoNoticeOne : fmt(t.demoNoticeMany, { n: demoCount })}</span>
          <form action={removeDemoProjects}>
            <ConfirmSubmit className="btn btn-outline btn-danger btn-sm" confirm={t.removeDemoConfirm}>
              {t.removeDemo}
            </ConfirmSubmit>
          </form>
        </div>
      ) : null}

      {projects.length === 0 ? (
        <div className="admin-empty">
          <p>{t.empty}</p>
          <Link href="/admin/projects/new" className="btn btn-ink">
            {t.emptyAction}
          </Link>
        </div>
      ) : (
        <div className="admin-table">
          {projects.map((project, i) => {
            const cover = coverOf(project)
            const firstOfYear = i === 0 || projects[i - 1].year !== project.year
            return (
              <div key={project.id} className="admin-row" data-first-of-year={firstOfYear ? 'true' : undefined}>
                {firstOfYear ? <span className="admin-year-label mono">{project.year}</span> : null}
                {cover ? (
                  <img className="admin-thumb" src={repo.imageUrls(cover).thumb} alt="" width={72} height={72} loading="lazy" />
                ) : (
                  <span className="admin-thumb-empty" aria-hidden="true" />
                )}
                <div>
                  <Link href={`/admin/projects/${project.id}`} className="admin-row-name">
                    {project.name}
                  </Link>
                  <div className="admin-row-meta">
                    <span className={`status-pill ${project.published ? 'status-published' : 'status-draft'}`}>{project.published ? t.published : t.draft}</span>
                    {project.featured ? <span className="status-pill status-featured">{t.featured}</span> : null}
                    {project.isDemo ? <span className="status-pill status-sample">{t.sample}</span> : null}
                  </div>
                </div>
                <span className="admin-row-col">
                  {project.year}
                  {project.projectValue !== null ? <span className="muted"> · {formatMoney(project.projectValue)}</span> : null}
                </span>
                <span className="admin-row-col">{plural(project.images.length, dict.project.photosOne, dict.project.photosMany)}</span>
                <div className="admin-row-actions">
                  <form action={moveProject}>
                    <input type="hidden" name="id" value={project.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" className="icon-btn" aria-label={`${t.moveUp}: ${project.name}`} disabled={i === 0 || projects[i - 1].year !== project.year}>
                      ↑
                    </button>
                  </form>
                  <form action={moveProject}>
                    <input type="hidden" name="id" value={project.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button type="submit" className="icon-btn" aria-label={`${t.moveDown}: ${project.name}`} disabled={i === projects.length - 1 || projects[i + 1].year !== project.year}>
                      ↓
                    </button>
                  </form>
                  <Link href={`/admin/projects/${project.id}`} className="icon-btn" aria-label={`${t.edit}: ${project.name}`}>
                    →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
