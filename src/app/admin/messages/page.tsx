import { deleteMessage } from '@/app/admin/actions'
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'
import { getAdminRepo } from '@/lib/data'

export default async function MessagesPage() {
  await requireAdmin()
  const { locale, dict } = await adminDictionary()
  const t = dict.admin.messages
  const repo = await getAdminRepo()
  const messages = await repo.listContactMessages()
  const formatter = new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' })

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">{t.title}</h1>
          <p className="admin-intro">{t.intro}</p>
        </div>
      </div>
      {messages.length === 0 ? (
        <div className="admin-empty">
          <p>{t.empty}</p>
        </div>
      ) : (
        <ul className="message-list">
          {messages.map((m) => {
            const isEmail = m.contact.includes('@')
            return (
              <li key={m.id} className="message-item">
                <div className="message-head">
                  <span className="message-name">{m.name}</span>
                  <span className="mono muted">{formatter.format(new Date(m.createdAt))}</span>
                </div>
                <a href={isEmail ? `mailto:${m.contact}` : `tel:${m.contact.replace(/[^\d+]/g, '')}`} className="message-contact link-plain">
                  {m.contact}
                </a>
                <p className="message-body">{m.message}</p>
                <div className="message-foot">
                  <span className="mono muted">
                    {t.language}: {m.locale === 'es' ? 'Español' : 'English'}
                  </span>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmSubmit className="btn btn-outline btn-danger btn-sm" confirm={t.deleteConfirm}>
                      {t.delete}
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
