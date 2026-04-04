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
    const status = searchParams.get('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    let query = supabase
      .from('appointments')
      .select(`
        *,
        companies(company_name, city),
        contacts(full_name, phone)
      `)
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (company_id) {
      query = query.eq('company_id', company_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (date_from) {
      query = query.gte('appointment_date', date_from)
    }

    if (date_to) {
      query = query.lte('appointment_date', date_to)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointments: data })
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

    const appointmentId = uuidv4()
    const appointmentData = {
      id: appointmentId,
      user_id: user.id,
      ...body,
    }

    const { data: result, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create reminders if requested
    if (body.create_reminders !== false && body.appointment_date) {
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

      const reminderTime = userProfile?.reminder_day_before_time || '09:00:00'
      const morningTime = userProfile?.reminder_on_day_time || '08:00:00'

      // Day before reminder
      const dayBefore = new Date(body.appointment_date)
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
        message_text: `Reminder: Meeting with ${company?.company_name} tomorrow at ${body.appointment_time || 'scheduled time'}. ${body.purpose || ''}`,
        delivery_channel: 'in-app',
      })

      // Day of reminder
      const dayOf = new Date(body.appointment_date)
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
        message_text: `Today's meeting: ${company?.company_name} at ${body.appointment_time || 'scheduled time'}. Location: ${body.location || 'TBD'}`,
        delivery_channel: 'in-app',
      })
    }

    return NextResponse.json({ appointment: result }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
