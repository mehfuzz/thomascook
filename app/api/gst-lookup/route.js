import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Validate the format of a GSTIN (15-char alphanumeric Indian tax ID)
function isValidGSTIN(gstin) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase())
}

// Normalise a raw GST API response into our internal shape
function normaliseGSTResponse(raw) {
  const pradr = raw.pradr?.addr || raw.pradr || {}

  const buildingParts = [pradr.bnm, pradr.bno].filter(Boolean)
  const building = buildingParts.join(', ')
  const street = [pradr.st, pradr.flno].filter(Boolean).join(', ')
  const locality = pradr.loc || ''
  const city = pradr.dst || pradr.city || ''
  const state = pradr.stcd || pradr.state || ''
  const pincode = pradr.pncd || ''

  const addressParts = [building, street, locality, city, state, pincode].filter(Boolean)
  const addressFull = addressParts.join(', ')

  // Authorised signatories / proprietor name
  const signatories = raw.authDt || raw.authEmpDt || []
  const proprietorName = Array.isArray(signatories) && signatories.length > 0
    ? signatories[0]?.nm || signatories[0]?.name || ''
    : ''

  // Nature of business
  const nba = Array.isArray(raw.nba) ? raw.nba : []

  return {
    gstin: raw.gstin || raw.GSTIN || '',
    legal_name: raw.lgnm || raw.legalNm || '',
    trade_name: raw.tradeNam || raw.tradeName || '',
    pan_number: (raw.gstin || raw.GSTIN || '').slice(2, 12) || '',
    gst_status: raw.sts || raw.status || 'Unknown',
    taxpayer_type: raw.dty || raw.taxPayerType || raw.ctb || '',
    gst_registration_date: raw.rgdt
      ? raw.rgdt.split('/').reverse().join('-')   // DD/MM/YYYY → YYYY-MM-DD
      : null,
    nature_of_business: nba,
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

async function fetchFromGSTPortal(gstin) {
  // Official GST portal search endpoint (no auth needed for public lookup)
  const url = `https://services.gst.gov.in/services/api/search?gstin=${gstin.toUpperCase()}`

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; VendorOnboarding/1.0)',
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`GST portal returned ${response.status}`)
  }

  const data = await response.json()

  // The portal wraps the payload differently across versions
  const payload = data?.data || data?.taxpayerInfo || data
  if (!payload || (!payload.lgnm && !payload.legalNm)) {
    throw new Error('GSTIN not found or invalid')
  }

  return normaliseGSTResponse({ ...payload, gstin })
}

async function fetchFromConfiguredAPI(gstin) {
  // Third-party GST API (e.g. Karza, Signzy, IDfy) — configured via env
  const apiUrl = process.env.GST_API_URL
  const apiKey = process.env.GST_API_KEY

  const response = await fetch(`${apiUrl}/${gstin.toUpperCase()}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Third-party GST API returned ${response.status}`)
  }

  const data = await response.json()
  return normaliseGSTResponse(data?.result || data)
}

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
        { error: 'Invalid GSTIN format. Must be 15 alphanumeric characters.' },
        { status: 400 }
      )
    }

    // Check if vendor already exists in our database
    const { data: existing } = await supabase
      .from('vendors')
      .select('id, legal_name, status')
      .eq('gstin', gstin)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: 'already_exists',
        message: `This GSTIN is already registered as vendor: ${existing.legal_name} (${existing.status})`,
        existing,
      }, { status: 409 })
    }

    // Fetch from GST API — prefer third-party if configured, else fall back to portal
    let gstData
    if (process.env.GST_API_URL && process.env.GST_API_KEY) {
      gstData = await fetchFromConfiguredAPI(gstin)
    } else {
      gstData = await fetchFromGSTPortal(gstin)
    }

    return NextResponse.json({ gst_details: gstData })
  } catch (error) {
    // Surface legible errors to the client
    const message = error.message || 'Failed to fetch GST details'
    const isNotFound = message.toLowerCase().includes('not found') || message.toLowerCase().includes('invalid')
    return NextResponse.json(
      { error: isNotFound ? 'gstin_not_found' : 'gst_fetch_failed', message },
      { status: isNotFound ? 404 : 502 }
    )
  }
}
