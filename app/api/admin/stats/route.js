import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get all data statistics for admin dashboard
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get statistics for all users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    const { count: totalCalls } = await supabase
      .from('sales_calls')
      .select('*', { count: 'exact', head: true })

    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })

    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    const { data: proposals } = await supabase
      .from('proposals')
      .select('proposal_value')

    const totalProposalValue = proposals?.reduce((sum, p) => sum + parseFloat(p.proposal_value || 0), 0) || 0

    // Get recent activity (last 10 sales calls)
    const { data: recentCalls } = await supabase
      .from('sales_calls')
      .select(`
        *,
        companies(company_name),
        users(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user performance stats
    const { data: userStats } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email
      `)

    // Get call counts per user
    const userPerformance = await Promise.all(
      (userStats || []).map(async (u) => {
        const { count: callCount } = await supabase
          .from('sales_calls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id)

        const { count: companyCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id)

        return {
          ...u,
          calls: callCount || 0,
          companies: companyCount || 0,
        }
      })
    )

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCompanies,
        totalCalls,
        totalAppointments,
        totalTasks,
        totalProposalValue,
      },
      recentActivity: recentCalls,
      userPerformance,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
