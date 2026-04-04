import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// This route is called by Vercel Cron every 30 minutes
export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Query for reminders that should be sent
    const { data: reminders, error } = await getSupabaseAdmin()
      .from('reminders')
      .select('*')
      .eq('is_sent', false)
      .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
      .lte('reminder_datetime', now)
      .limit(100)

    if (error) {
      console.error('Error fetching reminders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ 
        message: 'No reminders to send', 
        processed: 0 
      })
    }

    // For in-app notifications, we just mark them as sent
    // They will be displayed in the app via Supabase Realtime
    const reminderIds = reminders.map(r => r.id)

    const { error: updateError } = await getSupabaseAdmin()
      .from('reminders')
      .update({ 
        is_sent: true, 
        sent_at: now 
      })
      .in('id', reminderIds)

    if (updateError) {
      console.error('Error updating reminders:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`Processed ${reminders.length} reminders`)

    return NextResponse.json({ 
      message: 'Reminders processed successfully',
      processed: reminders.length,
      reminders: reminders.map(r => ({
        id: r.id,
        type: r.linked_type,
        company: r.company_name,
        message: r.message_text
      }))
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Cron endpoint active',
    note: 'This endpoint processes reminders every 30 minutes'
  })
}
