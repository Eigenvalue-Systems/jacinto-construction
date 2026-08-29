import { adminClient, done, fail } from './lib'

async function main() {
  const supabase = adminClient()
  const { data: projects, error } = await supabase.from('projects').select('id, name').eq('is_demo', true)
  if (error) fail('Could not read projects.', error)
  if (!projects || projects.length === 0) done('No sample projects found. Nothing to do.')

  const ids = projects!.map((p) => p.id)
  const { data: images } = await supabase.from('project_images').select('storage_key, storage_key_medium, storage_key_thumb').in('project_id', ids)
  const keys = (images ?? [])
    .flatMap((i) => [i.storage_key, i.storage_key_medium, i.storage_key_thumb])
    .filter((k): k is string => !!k && !k.startsWith('public:'))

  const { error: deleteError } = await supabase.from('projects').delete().in('id', ids)
  if (deleteError) fail('Could not delete sample projects.', deleteError)
  if (keys.length > 0) await supabase.storage.from('project-images').remove(keys)

  for (const p of projects!) console.log(`Removed: ${p.name}`)
  done(`Done. ${ids.length} sample projects removed.`)
}

main().catch((error) => fail('Removal failed.', error))
