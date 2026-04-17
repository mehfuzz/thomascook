import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isValidGSTIN(gstin) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)
}

function normaliseGSTResponse(raw, gstin) {
  const pradr = raw.pradr?.addr || raw.pradr || {}

  const building = [pradr.bnm, pradr.bno].filter(Boolean).join(', ')
  const street   = [pradr.st, pradr.flno].filter(Boolean).join(', ')
  const locality = pradr.loc || ''
  const city     = pradr.dst || ''
  const state    = pradr.stcd || ''
  const pincode  = pradr.pncd || ''
  const addressFull = [building, street, locality, city, state, pincode].filter(Boolean).join(', ')

  const signatories = raw.authDt || raw.authEmpDt || []
  const proprietorName = Array.isArray(signatories) && signatories.length > 0
    ? signatories[0]?.nm || signatories[0]?.name || ''
    : ''

  // rgdt comes as "DD/MM/YYYY" from the portal
  let regDate = null
  if (raw.rgdt) {
    const parts = raw.rgdt.split('/')
    regDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : raw.rgdt
  }

  return {
    gstin: gstin,
    legal_name: raw.lgnm || raw.legalNm || '',
    trade_name: raw.tradeNam || raw.tradeName || '',
    pan_number: gstin.slice(2, 12),
    gst_status: raw.sts || raw.status || 'Unknown',
    taxpayer_type: raw.dty || raw.ctb || '',
    gst_registration_date: regDate,
    nature_of_business: Array.isArray(raw.nba) ? raw.nba : [],
    address_building: building,
    address_street: street,
    address_locality: locality,
    address_city: city,
    address_district: pradr.dst || '',
    address_state: state,
    address_pincode: pincode,
    address_full: addressFull,
    proprietor_name: proprietorName,
  }
}

// ── Third-party GST API (Karza / Signzy / IDfy / etc.) ──────────────────────
async function fetchFromConfiguredAPI(gstin) {
  const apiUrl = process.env.GST_API_URL
  const apiKey = process.env.GST_API_KEY

  const response = await fetch(`${apiUrl}/${gstin}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    throw new Error(`GST API returned non-JSON response (HTTP ${response.status})`)
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `GST API error ${response.status}`)
  }

  const data = await response.json()
  return normaliseGSTResponse(data?.result || data?.data || data, gstin)
}

// ── Official GST portal public search ───────────────────────────────────────
async function fetchFromGSTPortal(gstin) {
  const url = `https://services.gst.gov.in/services/api/search?gstin=${gstin}`

  let response
  try {
    response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://services.gst.gov.in/services/searchtp',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })
  } catch (e) {
    throw new Error('portal_unreachable')
  }

  // If the portal returns HTML (CAPTCHA / maintenance page), don't try to parse it
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    throw new Error('portal_unreachable')
  }

  if (!response.ok) {
    throw new Error(response.status === 404 ? 'gstin_not_found' : 'portal_unreachable')
  }

  const data = await response.json()
  const payload = data?.data || data?.taxpayerInfo || data
  if (!payload?.lgnm && !payload?.legalNm) {
    throw new Error('gstin_not_found')
  }

  return normaliseGSTResponse(payload, gstin)
}

// ── Demo / sandbox mode (set GST_DEMO_MODE=true in .env.local) ───────────────
function getDemoData(gstin) {
  const stateCode = gstin.slice(0, 2)
  const stateNames = {
    '27': 'Maharashtra', '07': 'Delhi', '29': 'Karnataka',
    '33': 'Tamil Nadu', '06': 'Haryana', '09': 'Uttar Pradesh',
    '19': 'West Bengal', '24': 'Gujarat', '36': 'Telangana',
  }
  return {
    gstin,
    legal_name: 'Acme Supplies Private Limited',
    trade_name: 'Acme Supplies',
    pan_number: gstin.slice(2, 12),
    gst_status: 'Active',
    taxpayer_type: 'Regular',
    gst_registration_date: '2019-07-01',
    nature_of_business: ['Wholesale Business', 'Retail Business'],
    address_building: 'Acme Tower, 4th Floor',
    address_street: 'MG Road',
    address_locality: 'Andheri West',
    address_city: stateNames[stateCode] ? 'Mumbai' : 'City',
    address_district: stateNames[stateCode] ? 'Mumbai Suburban' : 'District',
    address_state: stateNames[stateCode] || 'State',
    address_pincode: '400053',
    address_full: 'Acme Tower, 4th Floor, MG Road, Andheri West, Mumbai, Maharashtra, 400053',
    proprietor_name: 'Rajesh Kumar Sharma',
    _demo: true,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gstin = (searchParams.get('gstin') || '').trim().toUpperCase()

    if (!gstin) {
      return NextResponse.json({ error: 'GSTIN is required' }, { status: 400 })
    }

    if (!isValidGSTIN(gstin)) {
      return NextResponse.json(
        { error: 'invalid_gstin', message: 'Invalid GSTIN format. A valid GSTIN is 15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric.' },
        { status: 400 }
      )
    }

    // Check if vendor already exists
    const { data: existing } = await supabase
      .from('vendors')
      .select('id, legal_name, status')
      .eq('gstin', gstin)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: 'already_exists',
        message: `This GSTIN is already registered: ${existing.legal_name} (${existing.status})`,
        existing,
      }, { status: 409 })
    }

    // Demo mode — no real API call
    if (process.env.GST_DEMO_MODE === 'true') {
      return NextResponse.json({ gst_details: getDemoData(gstin) })
    }

    // Try third-party API first, then fall back to portal
    let gstData
    try {
      if (process.env.GST_API_URL && process.env.GST_API_KEY) {
        gstData = await fetchFromConfiguredAPI(gstin)
      } else {
        gstData = await fetchFromGSTPortal(gstin)
      }
    } catch (fetchErr) {
      const msg = fetchErr.message || ''

      if (msg === 'gstin_not_found') {
        return NextResponse.json(
          { error: 'gstin_not_found', message: 'GSTIN not found on the GST portal. Please verify the number.' },
          { status: 404 }
        )
      }

      if (msg === 'portal_unreachable') {
        return NextResponse.json({
          error: 'portal_unavailable',
          message: 'The GST portal is currently unavailable or blocking automated requests. To use live data, set GST_API_URL and GST_API_KEY in your environment variables (supports Karza, Signzy, IDfy, or any REST-based GST API). Alternatively, set GST_DEMO_MODE=true to use sample data during development.',
        }, { status: 503 })
      }

      // Any other error
      return NextResponse.json(
        { error: 'gst_fetch_failed', message: msg || 'Failed to fetch GST details. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ gst_details: gstData })
  } catch (error) {
    return NextResponse.json({ error: 'server_error', message: 'An unexpected error occurred.' }, { status: 500 })
  }
}
