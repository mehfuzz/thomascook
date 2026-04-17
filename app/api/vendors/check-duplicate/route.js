import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Returns vendors that share the same principal address or proprietor/owner name.
// Used during onboarding to surface potentially blacklisted vendors registering under a new name.
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { address_full, proprietor_name, pan_number, exclude_gstin } = await request.json()

    const matches = []

    // 1. Match by PAN (same owner, different GST registration)
    if (pan_number && pan_number.trim()) {
      let q = supabase
        .from('vendors')
        .select('id, legal_name, trade_name, gstin, pan_number, address_full, proprietor_name, status, is_blacklisted')
        .eq('pan_number', pan_number.trim().toUpperCase())

      if (exclude_gstin) q = q.neq('gstin', exclude_gstin)

      const { data } = await q
      if (data?.length) {
        data.forEach(v => matches.push({ ...v, match_reason: 'Same PAN number' }))
      }
    }

    // 2. Match by proprietor / owner name (fuzzy — case-insensitive contains)
    if (proprietor_name && proprietor_name.trim().length > 2) {
      let q = supabase
        .from('vendors')
        .select('id, legal_name, trade_name, gstin, pan_number, address_full, proprietor_name, status, is_blacklisted')
        .ilike('proprietor_name', `%${proprietor_name.trim()}%`)

      if (exclude_gstin) q = q.neq('gstin', exclude_gstin)

      const { data } = await q
      if (data?.length) {
        data.forEach(v => {
          if (!matches.find(m => m.id === v.id)) {
            matches.push({ ...v, match_reason: 'Same proprietor / owner name' })
          }
        })
      }
    }

    // 3. Match by principal place of business address
    if (address_full && address_full.trim().length > 5) {
      // Extract pincode for targeted matching (avoids false positives on common street names)
      const pincodeMatch = address_full.match(/\b\d{6}\b/)
      const pincode = pincodeMatch ? pincodeMatch[0] : null

      let q = supabase
        .from('vendors')
        .select('id, legal_name, trade_name, gstin, pan_number, address_full, proprietor_name, status, is_blacklisted')

      if (pincode) {
        q = q.ilike('address_full', `%${pincode}%`)
      } else {
        // Fall back to matching on the trimmed address string
        q = q.ilike('address_full', `%${address_full.trim().slice(0, 50)}%`)
      }

      if (exclude_gstin) q = q.neq('gstin', exclude_gstin)

      const { data } = await q
      if (data?.length) {
        data.forEach(v => {
          if (!matches.find(m => m.id === v.id)) {
            matches.push({ ...v, match_reason: 'Same registered address' })
          }
        })
      }
    }

    // Deduplicate and prioritise blacklisted vendors first
    const unique = Array.from(new Map(matches.map(m => [m.id, m])).values())
    unique.sort((a, b) => (b.is_blacklisted ? 1 : 0) - (a.is_blacklisted ? 1 : 0))

    return NextResponse.json({
      has_duplicates: unique.length > 0,
      matches: unique,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
