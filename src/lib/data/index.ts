import { cache } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createPublicSupabase, createServerSupabase } from '@/lib/supabase/server'
import { getLocalRepository } from './local'
import { SupabaseRepository } from './supabase'
import type { AdminRepository, Repository } from './types'

export function dataMode(): 'local' | 'supabase' {
  return isSupabaseConfigured() ? 'supabase' : 'local'
}

export function localAdminEnabled() {
  return dataMode() === 'local' && process.env.NODE_ENV !== 'production'
}

export const getPublicRepo = cache((): Repository => {
  if (dataMode() === 'local') return getLocalRepository()
  return new SupabaseRepository(createPublicSupabase())
})

export const getAdminRepo = cache(async (): Promise<AdminRepository> => {
  if (dataMode() === 'local') return getLocalRepository()
  return new SupabaseRepository(await createServerSupabase())
})
