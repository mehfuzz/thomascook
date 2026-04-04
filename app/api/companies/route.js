import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')
    const stage = searchParams.get('stage')
    const search = searchParams.get('search')

    let query = supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (tier) {
      query = query.eq('account_tier', tier)
    }

    if (stage) {
      query = query.eq('pipeline_stage', stage)
    }

    if (search) {
      query = query.ilike('company_name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ companies: data })
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

    // Check for duplicate company name
    if (body.company_name) {
      const { data: existing } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('user_id', user.id)
        .ilike('company_name', body.company_name)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json({ 
          error: 'duplicate',
          message: `A company with similar name already exists: ${existing[0].company_name}`,
          existing: existing[0]
        }, { status: 409 })
      }
    }

    // Clean up the body - remove empty strings for numeric fields
    const cleanedBody = { ...body }
    if (cleanedBody.annual_travel_budget_estimate === '' || cleanedBody.annual_travel_budget_estimate === null) {
      delete cleanedBody.annual_travel_budget_estimate
    }
    if (cleanedBody.proposal_value_discussed === '' || cleanedBody.proposal_value_discussed === null) {
      delete cleanedBody.proposal_value_discussed
    }

    const companyData = {
      id: uuidv4(),
      user_id: user.id,
      ...cleanedBody,
      health_score: 50, // Default health score
    }

    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ company: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
