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
    const company_id = searchParams.get('company_id')
    const outcome = searchParams.get('outcome')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    let query = supabase
      .from('sales_calls')
      .select(`
        *,
        companies(company_name),
        contacts(full_name)
      `)
      .eq('user_id', user.id)
      .order('call_date', { ascending: false })
      .order('call_time', { ascending: false })

    if (company_id) {
      query = query.eq('company_id', company_id)
    }

    if (outcome) {
      query = query.eq('call_outcome', outcome)
    }

    if (date_from) {
      query = query.gte('call_date', date_from)
    }

    if (date_to) {
      query = query.lte('call_date', date_to)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sales_calls: data })
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

    // Clean up empty string numeric fields
    const cleanedBody = { ...body }
    if (cleanedBody.proposal_value_discussed === '' || cleanedBody.proposal_value_discussed === null) {
      delete cleanedBody.proposal_value_discussed
    }
    if (cleanedBody.duration_minutes === '' || cleanedBody.duration_minutes === null) {
      delete cleanedBody.duration_minutes
    }

    const callData = {
      id: uuidv4(),
      user_id: user.id,
      ...cleanedBody,
    }

    // Insert sales call
    const { data: callResult, error: callError } = await supabase
      .from('sales_calls')
      .insert(callData)
      .select()
      .single()

    if (callError) {
      return NextResponse.json({ error: callError.message }, { status: 500 })
    }

    // If revisit date is set, create appointment and reminders
    if (body.revisit_date_given) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('reminder_day_before_time, reminder_on_day_time')
        .eq('id', user.id)
        .single()

      const { data: company } = await supabase
        .from('companies')
        .select('company_name')
        .eq('id', body.company_id)
        .single()

      // Create appointment
      const appointmentId = uuidv4()
      await supabase.from('appointments').insert({
        id: appointmentId,
        user_id: user.id,
        company_id: body.company_id,
        contact_id: body.contact_id,
        appointment_date: body.revisit_date_given,
        appointment_time: body.revisit_time_given,
        purpose: 'Follow-up from sales call',
        agenda: body.revisit_notes,
        status: 'Scheduled',
        meeting_mode: 'In-Person',
      })

      // Create reminders
      const reminderTime = userProfile?.reminder_day_before_time || '09:00:00'
      const morningTime = userProfile?.reminder_on_day_time || '08:00:00'
      
      // Day before reminder
      const dayBefore = new Date(body.revisit_date_given)
      dayBefore.setDate(dayBefore.getDate() - 1)
      const [hours, minutes] = reminderTime.split(':')
      dayBefore.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      await supabase.from('reminders').insert({
        id: uuidv4(),
        user_id: user.id,
        linked_type: 'appointment',
        linked_id: appointmentId,
        company_id: body.company_id,
        company_name: company?.company_name,
        reminder_datetime: dayBefore.toISOString(),
        message_text: `Reminder: Visit ${company?.company_name} tomorrow. ${body.revisit_notes || ''}`,
        delivery_channel: 'in-app',
      })

      // Day of reminder
      const dayOf = new Date(body.revisit_date_given)
      const [mHours, mMinutes] = morningTime.split(':')
      dayOf.setHours(parseInt(mHours), parseInt(mMinutes), 0, 0)

      await supabase.from('reminders').insert({
        id: uuidv4(),
        user_id: user.id,
        linked_type: 'appointment',
        linked_id: appointmentId,
        company_id: body.company_id,
        company_name: company?.company_name,
        reminder_datetime: dayOf.toISOString(),
        message_text: `Today's visit: ${company?.company_name} at ${body.revisit_time_given || 'scheduled time'}. ${body.revisit_notes || ''}`,
        delivery_channel: 'in-app',
      })

      // Update call to mark reminders created
      await supabase
        .from('sales_calls')
        .update({ reminders_created: true })
        .eq('id', callResult.id)
    }

    // Update company's last contacted date
    await supabase
      .from('companies')
      .update({ last_contacted_date: body.call_date })
      .eq('id', body.company_id)

    return NextResponse.json({ sales_call: callResult }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
