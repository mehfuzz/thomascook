'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Users, Building2, Phone, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/date-utils'
import { formatCurrency } from '@/lib/utils/currency'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    designation: '',
    role: 'user',
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        window.location.href = '/login'
        return
      }

      // Load user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userProfile || userProfile.role !== 'admin') {
        toast.error('Admin access required')
        window.location.href = '/dashboard'
        return
      }

      setUser(userProfile)
      setIsAdmin(true)

      // Load admin stats
      const statsResponse = await fetch('/api/admin/stats')
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Load all users
      const usersResponse = await fetch('/api/admin/users')
      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])

      setLoading(false)
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
      setLoading(false)
    }
  }

  async function handleAddUser(e) {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      toast.success('User created successfully!')
      setAddUserDialogOpen(false)
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
        designation: '',
        role: 'user',
      })
      loadData()
    } catch (error) {
      toast.error(error.message || 'Failed to create user')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F2B5B] mx-auto mb-4\"></div>
          <p className=\"text-muted-foreground\">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className=\"min-h-screen bg-gray-50 dark:bg-gray-900\">
      <NavSidebar />
      <div className=\"md:pl-64\">
        <TopNavbar title=\"Admin Dashboard\" user={user} unreadCount={0} />
        
        <main className=\"p-4 md:p-6 lg:p-8 max-w-7xl mx-auto\">
          {/* Header */}
          <div className=\"flex items-center justify-between mb-6\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900 dark:text-white\">Admin Dashboard</h1>
              <p className=\"text-muted-foreground mt-1\">System-wide overview and user management</p>
            </div>
            <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className=\"bg-[#0F2B5B] hover:bg-[#1a4178]\">
                  <Plus className=\"h-4 w-4 mr-2\" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account for the system</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className=\"space-y-4 mt-4\">
                  <div className=\"space-y-4\">
                    <div>
                      <Label htmlFor=\"email\">Email *</Label>
                      <Input
                        id=\"email\"
                        type=\"email\"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                        placeholder=\"user@thomascook.in\"
                      />
                    </div>
                    <div>
                      <Label htmlFor=\"password\">Password *</Label>
                      <Input
                        id=\"password\"
                        type=\"password\"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                        placeholder=\"Minimum 6 characters\"
                        minLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor=\"full_name\">Full Name *</Label>
                      <Input
                        id=\"full_name\"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        required
                        placeholder=\"John Doe\"
                      />
                    </div>
                    <div>
                      <Label htmlFor=\"phone_number\">Phone Number</Label>
                      <Input
                        id=\"phone_number\"
                        value={newUser.phone_number}
                        onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
                        placeholder=\"+91 9876543210\"
                      />
                    </div>
                    <div>
                      <Label htmlFor=\"designation\">Designation</Label>
                      <Input
                        id=\"designation\"
                        value={newUser.designation}
                        onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                        placeholder=\"Sales Manager\"
                      />
                    </div>
                    <div>
                      <Label htmlFor=\"role\">Role *</Label>
                      <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=\"user\">User</SelectItem>
                          <SelectItem value=\"admin\">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className=\"flex justify-end gap-2 pt-4\">
                    <Button type=\"button\" variant=\"outline\" onClick={() => setAddUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type=\"submit\" className=\"bg-[#0F2B5B] hover:bg-[#1a4178]\">
                      Create User
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* System Stats */}
          {stats && (
            <>
              <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6\">
                <Card>
                  <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
                    <CardTitle className=\"text-sm font-medium\">Total Users</CardTitle>
                    <Users className=\"h-4 w-4 text-muted-foreground\" />
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-2xl font-bold text-[#0F2B5B]\">{stats.stats.totalUsers || 0}</div>
                    <p className=\"text-xs text-muted-foreground\">Active system users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
                    <CardTitle className=\"text-sm font-medium\">Total Companies</CardTitle>
                    <Building2 className=\"h-4 w-4 text-muted-foreground\" />
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-2xl font-bold text-[#0F2B5B]\">{stats.stats.totalCompanies || 0}</div>
                    <p className=\"text-xs text-muted-foreground\">In pipeline</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
                    <CardTitle className=\"text-sm font-medium\">Total Calls</CardTitle>
                    <Phone className=\"h-4 w-4 text-muted-foreground\" />
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-2xl font-bold text-[#0F2B5B]\">{stats.stats.totalCalls || 0}</div>
                    <p className=\"text-xs text-muted-foreground\">Sales calls logged</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
                    <CardTitle className=\"text-sm font-medium\">Total Appointments</CardTitle>
                    <Target className=\"h-4 w-4 text-muted-foreground\" />
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-2xl font-bold text-[#0F2B5B]\">{stats.stats.totalAppointments || 0}</div>
                    <p className=\"text-xs text-muted-foreground\">Scheduled</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
                    <CardTitle className=\"text-sm font-medium\">Total Tasks</CardTitle>
                    <Target className=\"h-4 w-4 text-muted-foreground\" />
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-2xl font-bold text-[#0F2B5B]\">{stats.stats.totalTasks || 0}</div>
                    <p className=\"text-xs text-muted-foreground\">Across all users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
                    <CardTitle className=\"text-sm font-medium\">Proposal Value</CardTitle>
                    <TrendingUp className=\"h-4 w-4 text-muted-foreground\" />
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-2xl font-bold text-[#0F2B5B]\">{formatCurrency(stats.stats.totalProposalValue)}</div>
                    <p className=\"text-xs text-muted-foreground\">Total pipeline</p>
                  </CardContent>
                </Card>
              </div>

              {/* User Performance */}
              <Card className=\"mb-6\">
                <CardHeader>
                  <CardTitle>User Performance</CardTitle>
                  <CardDescription>Activity summary by user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    {stats.userPerformance?.map((u) => (
                      <div key={u.id} className=\"flex items-center justify-between p-3 border rounded-lg\">
                        <div>
                          <p className=\"font-medium\">{u.full_name}</p>
                          <p className=\"text-sm text-muted-foreground\">{u.email}</p>
                        </div>
                        <div className=\"flex gap-4 text-sm\">
                          <div className=\"text-center\">
                            <div className=\"font-semibold text-[#0F2B5B]\">{u.companies}</div>
                            <div className=\"text-muted-foreground\">Companies</div>
                          </div>
                          <div className=\"text-center\">
                            <div className=\"font-semibold text-[#0F2B5B]\">{u.calls}</div>
                            <div className=\"text-muted-foreground\">Calls</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sales Calls (All Users)</CardTitle>
                  <CardDescription>Latest activity across the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    {stats.recentActivity?.slice(0, 10).map((call) => (
                      <div key={call.id} className=\"flex items-start justify-between p-3 border rounded-lg\">
                        <div className=\"flex-1\">
                          <p className=\"font-medium\">{call.companies?.company_name}</p>
                          <p className=\"text-sm text-muted-foreground\">
                            by {call.users?.full_name} • {formatDate(call.call_date)}
                          </p>
                          {call.discussion_summary && (
                            <p className=\"text-sm text-muted-foreground mt-1\">
                              {call.discussion_summary.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        <Badge className=\"ml-2\">{call.call_outcome}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* All Users List */}
          <Card className=\"mt-6\">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{users.length} total users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-2\">
                {users.map((u) => (
                  <div key={u.id} className=\"flex items-center justify-between p-3 border rounded-lg\">
                    <div>
                      <p className=\"font-medium\">{u.full_name}</p>
                      <p className=\"text-sm text-muted-foreground\">{u.email}</p>
                      {u.designation && (
                        <p className=\"text-xs text-muted-foreground\">{u.designation}</p>
                      )}
                    </div>
                    <div className=\"flex items-center gap-3\">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                      <span className=\"text-xs text-muted-foreground\">
                        Joined {formatDate(u.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
