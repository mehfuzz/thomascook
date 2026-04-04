'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/contexts/user-context'
import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Phone, Building2, TrendingUp, Target, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, isToday, isTomorrow, getDaysUntil } from '@/lib/utils/date-utils'

import { PageLoader } from '@/components/page-loader'

export default function DashboardPage() {
  const { user, userLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayCalls: 0,
    todayMeetings: 0,
    weekCalls: 0,
    monthRevenue: 0,
    activeCompanies: 0,
    openProposalsValue: 0,
    todayAppointments: [],
    upcomingRevisits: [],
    overdueTasks: 0,
    pendingHighPriorityTasks: [],
  })
  const [targets, setTargets] = useState({
    daily: { calls: 0, meetings: 0, callsTarget: 10, meetingsTarget: 3 },
    weekly: { calls: 0, meetings: 0, revenue: 0, callsTarget: 50, meetingsTarget: 15, revenueTarget: 500000 },
    monthly: { calls: 0, meetings: 0, revenue: 0, proposals: 0, callsTarget: 200, meetingsTarget: 60, revenueTarget: 2000000, proposalsTarget: 20 }
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      window.location.href = '/login'
      return
    }
    loadDashboardData()
  }, [user, userLoading])

  async function loadDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Run all queries in parallel
      const [
        { count: todayCallsCount },
        { data: todayAppointments },
        { count: companiesCount },
        { data: proposals },
        { data: highPriorityTasks },
      ] = await Promise.all([
        supabase.from('sales_calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('call_date', today),
        supabase.from('appointments').select('*, companies(company_name)').eq('user_id', user.id).eq('appointment_date', today).order('appointment_time', { ascending: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('proposals').select('proposal_value').eq('user_id', user.id).in('status', ['Sent', 'Under Review', 'Revision Requested']),
        supabase.from('tasks').select('*, companies(company_name)').eq('user_id', user.id).eq('priority', 'High').eq('status', 'Pending').order('due_date', { ascending: true }).limit(5),
      ])

      const openProposalsValue = proposals?.reduce((sum, p) => sum + parseFloat(p.proposal_value || 0), 0) || 0

      setStats({
        todayCalls: todayCallsCount || 0,
        todayMeetings: todayAppointments?.length || 0,
        activeCompanies: companiesCount || 0,
        openProposalsValue,
        todayAppointments: todayAppointments || [],
        pendingHighPriorityTasks: highPriorityTasks || [],
        upcomingRevisits: [],
        overdueTask: 0,
      })

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const calculatePercentage = (done, target) => {
    if (target === 0) return 0
    return Math.min(100, Math.round((done / target) * 100))
  }

  if (loading) {
    return <PageLoader message="Loading your dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar userRole={user?.role || 'user'} />
      <div className="md:pl-64">
        <TopNavbar 
          title="Dashboard" 
          user={user} 
          unreadCount={0}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Morning Brief Card */}
          <Card className="mb-6 border-l-4 border-l-[#F5A623]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">☀️</span>
                <span>Good morning, {user?.full_name || 'General Manager'}!</span>
              </CardTitle>
              <CardDescription>
                {formatDate(new Date(), 'EEEE, MMMM dd, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.todayAppointments.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#0F2B5B]" />
                      Today's Appointments ({stats.todayAppointments.length})
                    </h4>
                    <div className="space-y-2">
                      {stats.todayAppointments.map((apt) => (
                        <div key={apt.id} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div className="text-sm font-medium">{apt.appointment_time || 'TBD'}</div>
                          <div className="text-sm">{apt.companies?.company_name}</div>
                          <Badge variant="outline" className="ml-auto">{apt.meeting_mode}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No appointments scheduled for today</div>
                )}

                {stats.pendingHighPriorityTasks.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      High Priority Tasks ({stats.pendingHighPriorityTasks.length})
                    </h4>
                    <div className="space-y-1">
                      {stats.pendingHighPriorityTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="text-sm flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                          <CheckCircle2 className="h-4 w-4 text-red-600" />
                          <span>{task.title}</span>
                          {task.due_date && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0F2B5B]">{stats.todayCalls}</div>
                <p className="text-xs text-muted-foreground">Target: {targets.daily.callsTarget}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0F2B5B]">{stats.activeCompanies}</div>
                <p className="text-xs text-muted-foreground">In your pipeline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Proposals</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0F2B5B]">{formatCurrency(stats.openProposalsValue)}</div>
                <p className="text-xs text-muted-foreground">Total pipeline value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Meetings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0F2B5B]">{stats.todayMeetings}</div>
                <p className="text-xs text-muted-foreground">Scheduled appointments</p>
              </CardContent>
            </Card>
          </div>

          {/* Target Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Daily Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#F5A623]" />
                  Daily Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Calls</span>
                    <span className="text-sm text-muted-foreground">
                      {targets.daily.calls} / {targets.daily.callsTarget}
                    </span>
                  </div>
                  <Progress 
                    value={calculatePercentage(targets.daily.calls, targets.daily.callsTarget)} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Meetings</span>
                    <span className="text-sm text-muted-foreground">
                      {targets.daily.meetings} / {targets.daily.meetingsTarget}
                    </span>
                  </div>
                  <Progress 
                    value={calculatePercentage(targets.daily.meetings, targets.daily.meetingsTarget)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#F5A623]" />
                  Weekly Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Calls</span>
                    <span className="text-sm text-muted-foreground">
                      {targets.weekly.calls} / {targets.weekly.callsTarget}
                    </span>
                  </div>
                  <Progress 
                    value={calculatePercentage(targets.weekly.calls, targets.weekly.callsTarget)} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenue</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(targets.weekly.revenue)} / {formatCurrency(targets.weekly.revenueTarget)}
                    </span>
                  </div>
                  <Progress 
                    value={calculatePercentage(targets.weekly.revenue, targets.weekly.revenueTarget)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Monthly Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#F5A623]" />
                  Monthly Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Calls</span>
                    <span className="text-sm text-muted-foreground">
                      {targets.monthly.calls} / {targets.monthly.callsTarget}
                    </span>
                  </div>
                  <Progress 
                    value={calculatePercentage(targets.monthly.calls, targets.monthly.callsTarget)} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenue</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(targets.monthly.revenue)} / {formatCurrency(targets.monthly.revenueTarget)}
                    </span>
                  </div>
                  <Progress 
                    value={calculatePercentage(targets.monthly.revenue, targets.monthly.revenueTarget)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-20 flex-col gap-2" variant="outline" asChild>
                  <a href="/sales-calls">
                    <Phone className="h-6 w-6" />
                    <span className="text-sm">Log Call</span>
                  </a>
                </Button>
                <Button className="h-20 flex-col gap-2" variant="outline" asChild>
                  <a href="/appointments">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Add Appointment</span>
                  </a>
                </Button>
                <Button className="h-20 flex-col gap-2" variant="outline" asChild>
                  <a href="/companies">
                    <Building2 className="h-6 w-6" />
                    <span className="text-sm">Add Company</span>
                  </a>
                </Button>
                <Button className="h-20 flex-col gap-2" variant="outline" asChild>
                  <a href="/tasks">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-sm">Add Task</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
