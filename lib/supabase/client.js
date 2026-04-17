import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fall back to placeholder values at build time so prerendering doesn't
  // throw. Actual authenticated calls still require real env vars at runtime.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL    || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}
