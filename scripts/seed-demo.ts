import { adminClient, done, fail } from './lib'
import { getSeedProjects, getSeedSettings } from '../src/lib/data/seed'

async function main() {
  const supabase = adminClient()
  const settings = getSeedSettings()
  const projects = getSeedProjects()

  const { error: settingsError } = await supabase.from('site_settings').upsert(
    {
      id: 1,
      company_name: settings.companyName,
      owner_name: settings.ownerName,
      phone: settings.phone,
      email: settings.email,
      location: settings.location,
      service_area: settings.serviceArea,
      service_area_es: settings.serviceAreaEs,
      homepage_headline: settings.homepageHeadline,
      homepage_headline_es: settings.homepageHeadlineEs,
      homepage_intro: settings.homepageIntro,
      homepage_intro_es: settings.homepageIntroEs,
      about_intro: settings.aboutIntro,
      about_intro_es: settings.aboutIntroEs,
      about_copy: settings.aboutCopy,
      about_copy_es: settings.aboutCopyEs,
      services_list: settings.servicesList,
      services_list_es: settings.servicesListEs,
      contact_copy: settings.contactCopy,
      contact_copy_es: settings.contactCopyEs,
      default_meta_description: settings.defaultMetaDescription,
      default_meta_description_es: settings.defaultMetaDescriptionEs,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )
  if (settingsError) fail('Could not write settings.', settingsError)

  const { data: existing, error: existingError } = await supabase.from('projects').select('id').eq('is_demo', true)
  if (existingError) fail('Could not read projects.', existingError)
  if ((existing ?? []).length > 0) done(`Sample projects are already there (${existing!.length}). Nothing to do.`)

  for (const p of projects) {
    const { error } = await supabase.from('projects').insert({
      id: p.id,
      name: p.name,
      name_es: p.nameEs,
      slug: p.slug,
      year: p.year,
      location: p.location,
      location_es: p.locationEs,
      project_value: p.projectValue,
      project_type: null,
      short_description: p.shortDescription,
      short_description_es: p.shortDescriptionEs,
      full_description: p.description,
      full_description_es: p.descriptionEs,
      details: p.details,
      details_es: p.detailsEs,
      featured: p.featured,
      published: p.published,
      display_order: p.displayOrder,
      is_demo: true,
    })
    if (error) fail(`Could not insert ${p.name}.`, error)

    const { error: imagesError } = await supabase.from('project_images').insert(
      p.images.map((img) => ({
        id: img.id,
        project_id: p.id,
        storage_key: img.storageKey,
        storage_key_medium: img.storageKeyMedium,
        storage_key_thumb: img.storageKeyThumb,
        alt_text: img.altText,
        caption: img.caption,
        width: img.width,
        height: img.height,
        image_group: img.group,
        display_order: img.displayOrder,
      })),
    )
    if (imagesError) fail(`Could not insert photos for ${p.name}.`, imagesError)

    if (p.coverImageId) {
      const { error: coverError } = await supabase.from('projects').update({ cover_image_id: p.coverImageId }).eq('id', p.id)
      if (coverError) fail(`Could not set the cover for ${p.name}.`, coverError)
    }
    console.log(`Added sample project: ${p.name}`)
  }
  done(`Done. ${projects.length} sample projects added.`)
}

main().catch((error) => fail('Seeding failed.', error))
