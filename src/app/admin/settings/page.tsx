import { SettingsForm, type PickerImage } from '@/components/admin/SettingsForm'
import { adminDictionary, requireAdmin } from '@/lib/admin/auth'
import { getAdminRepo } from '@/lib/data'

export default async function SettingsPage() {
  await requireAdmin()
  const { dict } = await adminDictionary()
  const repo = await getAdminRepo()
  const [settings, images] = await Promise.all([repo.getSettings(), repo.listAllImages()])
  const picker: PickerImage[] = images.map((img) => ({
    id: img.id,
    label: `${img.projectName ?? dict.admin.media.siteImage}${img.caption ? ` · ${img.caption}` : ''}`,
    thumb: repo.imageUrls(img).thumb,
  }))
  const brand = {
    logoUrl: settings.logoKey ? repo.imageUrls({ storageKey: settings.logoKey, storageKeyMedium: null, storageKeyThumb: null }).full : null,
    faviconUrl: settings.faviconKey ? repo.imageUrls({ storageKey: settings.faviconKey, storageKeyMedium: null, storageKeyThumb: null }).full : null,
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">{dict.admin.settings.title}</h1>
        </div>
      </div>
      <SettingsForm settings={settings} images={picker} brand={brand} strings={dict.admin.settings} genericError={dict.admin.editor.errors.generic} />
    </>
  )
}
