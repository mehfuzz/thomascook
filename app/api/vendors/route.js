import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const blacklisted = searchParams.get('blacklisted')

    let query = supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (blacklisted === 'true') query = query.eq('is_blacklisted', true)
    if (search) {
      query = query.or(
        `legal_name.ilike.%${search}%,trade_name.ilike.%${search}%,gstin.ilike.%${search}%`
      )
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ vendors: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Prevent duplicate GSTIN
    const { data: existingGSTIN } = await supabase
      .from('vendors')
      .select('id, legal_name')
      .eq('gstin', body.gstin)
      .maybeSingle()

    if (existingGSTIN) {
      return NextResponse.json({
        error: 'duplicate_gstin',
        message: `Vendor with GSTIN ${body.gstin} already exists: ${existingGSTIN.legal_name}`,
        existing: existingGSTIN,
      }, { status: 409 })
    }

    const vendorData = {
      ...body,
      created_by: user.id,
      status: body.status || 'Pending',
    }

    const { data, error } = await supabase
      .from('vendors')
      .insert(vendorData)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ vendor: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
