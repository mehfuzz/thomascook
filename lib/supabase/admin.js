import { createClient } from '@supabase/supabase-js'

let _client = null

// Lazy singleton — only created on first call, not at module import time.
// This prevents build failures when env vars aren't available at build time.
export function getSupabaseAdmin() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return _client
}
