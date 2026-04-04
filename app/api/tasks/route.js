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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const company_id = searchParams.get('company_id')

    let query = supabase
      .from('tasks')
      .select(`
        *,
        companies(company_name)
      `)
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (company_id) {
      query = query.eq('company_id', company_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: data })
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

    const taskId = uuidv4()
    const taskData = {
      id: taskId,
      user_id: user.id,
      ...body,
    }

    const { data: result, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create reminder if requested
    if (body.reminder_set && body.due_date && body.due_time) {
      const { data: company } = body.company_id ? await supabase
        .from('companies')
        .select('company_name')
        .eq('id', body.company_id)
        .single() : { data: null }

      const dueDateTime = new Date(`${body.due_date}T${body.due_time}`)
      // Set reminder 30 minutes before
      dueDateTime.setMinutes(dueDateTime.getMinutes() - 30)

      await supabase.from('reminders').insert({
        id: uuidv4(),
        user_id: user.id,
        linked_type: 'task',
        linked_id: taskId,
        company_id: body.company_id || null,
        company_name: company?.company_name || null,
        reminder_datetime: dueDateTime.toISOString(),
        message_text: `Task reminder: ${body.title}. Due at ${body.due_time}`,
        delivery_channel: 'in-app',
      })
    }

    return NextResponse.json({ task: result }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
