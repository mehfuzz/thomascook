'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, CheckSquare, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, isPastDue } from '@/lib/utils/date-utils'

export default function TasksPage() {
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    company_id: '',
    due_date: '',
    due_time: '',
    priority: 'Medium',
    status: 'Pending',
    category: 'Follow-up',
    reminder_set: false,
  })

  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadTasks()
    loadCompanies()
  }, [])

  async function loadUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setUser(profile || { email: authUser.email, full_name: 'GM' })
    }
  }

  async function loadTasks() {
    try {
      const response = await fetch('/api/tasks')
      const result = await response.json()
      setTasks(result.tasks || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
      setLoading(false)
    }
  }

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('id, company_name').order('company_name')
    setCompanies(data || [])
  }

  async function handleAddTask(e) {
    e.preventDefault()
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success(newTask.reminder_set ? 'Task created with reminder!' : 'Task created successfully!')
      setAddDialogOpen(false)
      setNewTask({
        title: '',
        description: '',
        company_id: '',
        due_date: '',
        due_time: '',
        priority: 'Medium',
        status: 'Pending',
        category: 'Follow-up',
        reminder_set: false,
      })
      loadTasks()
    } catch (error) {
      toast.error('Failed to create task')
      console.error(error)
    }
  }

  async function toggleTaskStatus(taskId, currentStatus) {
    const newStatus = currentStatus === 'Done' ? 'Pending' : 'Done'
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update task')

      toast.success(`Task marked as ${newStatus}`)
      loadTasks()
    } catch (error) {
      toast.error('Failed to update task')
      console.error(error)
    }
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      'High': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Medium': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return colors[priority] || colors['Medium']
  }

  const groupTasksByStatus = () => {
    const today = new Date().toISOString().split('T')[0]
    
    const overdue = tasks.filter(t => t.status !== 'Done' && t.due_date && t.due_date < today)
    const dueToday = tasks.filter(t => t.status !== 'Done' && t.due_date === today)
    const upcoming = tasks.filter(t => t.status !== 'Done' && t.due_date && t.due_date > today)
    const noDueDate = tasks.filter(t => t.status !== 'Done' && !t.due_date)
    const completed = tasks.filter(t => t.status === 'Done')

    return { overdue, dueToday, upcoming, noDueDate, completed }
  }

  const grouped = groupTasksByStatus()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F2B5B] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar />
      <div className="md:pl-64">
        <TopNavbar title="Tasks" user={user} unreadCount={0} />
        
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="text-muted-foreground mt-1">
                {tasks.filter(t => t.status !== 'Done').length} pending, {grouped.overdue.length} overdue
              </p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>Create a task to track your work</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTask} className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Task Title *</Label>
                      <Input
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        required
                        placeholder="e.g., Follow up with Infosys"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Additional details..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Linked Company</Label>
                        <Select value={newTask.company_id} onValueChange={(val) => setNewTask({ ...newTask, company_id: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {companies.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={newTask.category} onValueChange={(val) => setNewTask({ ...newTask, category: val })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Follow-up">Follow-up</SelectItem>
                            <SelectItem value="Proposal">Proposal</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Internal">Internal</SelectItem>
                            <SelectItem value="Research">Research</SelectItem>
                            <SelectItem value="Client Servicing">Client Servicing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={newTask.due_date}
                          onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Due Time</Label>
                        <Input
                          type="time"
                          value={newTask.due_time}
                          onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={newTask.priority} onValueChange={(val) => setNewTask({ ...newTask, priority: val })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="reminder_set"
                          checked={newTask.reminder_set}
                          onCheckedChange={(checked) => setNewTask({ ...newTask, reminder_set: checked })}
                          disabled={!newTask.due_date || !newTask.due_time}
                        />
                        <Label htmlFor="reminder_set">Set Reminder (30 min before)</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                      Create Task
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
                <div className="text-2xl font-bold text-red-600">{grouped.overdue.length}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Due Today</CardTitle>
                <div className="text-2xl font-bold text-amber-600">{grouped.dueToday.length}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Upcoming</CardTitle>
                <div className="text-2xl font-bold text-[#0F2B5B]">{grouped.upcoming.length}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
                <div className="text-2xl font-bold text-green-600">{grouped.completed.length}</div>
              </CardHeader>
            </Card>
          </div>

          {/* Task Groups */}
          <div className="space-y-6">
            {/* Overdue */}
            {grouped.overdue.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Overdue ({grouped.overdue.length})
                </h2>
                <div className="space-y-2">
                  {grouped.overdue.map(task => (
                    <Card key={task.id} className="border-l-4 border-l-red-500">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === 'Done'}
                            onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{task.title}</h3>
                                {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                                <div className="flex items-center gap-3 mt-2">
                                  {task.companies?.company_name && (
                                    <span className="text-sm text-muted-foreground">{task.companies.company_name}</span>
                                  )}
                                  {task.due_date && (
                                    <span className="text-sm text-red-600 font-medium">
                                      Due: {formatDate(task.due_date)} {task.due_time && `at ${task.due_time}`}
                                    </span>
                                  )}
                                  <Badge variant="outline">{task.category}</Badge>
                                </div>
                              </div>
                              <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Due Today */}
            {grouped.dueToday.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-amber-600">
                  Due Today ({grouped.dueToday.length})
                </h2>
                <div className="space-y-2">
                  {grouped.dueToday.map(task => (
                    <Card key={task.id} className="border-l-4 border-l-amber-500">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === 'Done'}
                            onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{task.title}</h3>
                                {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                                <div className="flex items-center gap-3 mt-2">
                                  {task.companies?.company_name && (
                                    <span className="text-sm text-muted-foreground">{task.companies.company_name}</span>
                                  )}
                                  {task.due_time && <span className="text-sm text-amber-600 font-medium">at {task.due_time}</span>}
                                  <Badge variant="outline">{task.category}</Badge>
                                </div>
                              </div>
                              <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {grouped.upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Upcoming ({grouped.upcoming.length})</h2>
                <div className="space-y-2">
                  {grouped.upcoming.map(task => (
                    <Card key={task.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === 'Done'}
                            onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{task.title}</h3>
                                {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                                <div className="flex items-center gap-3 mt-2">
                                  {task.companies?.company_name && (
                                    <span className="text-sm text-muted-foreground">{task.companies.company_name}</span>
                                  )}
                                  {task.due_date && (
                                    <span className="text-sm text-muted-foreground">
                                      Due: {formatDate(task.due_date)} {task.due_time && `at ${task.due_time}`}
                                    </span>
                                  )}
                                  <Badge variant="outline">{task.category}</Badge>
                                </div>
                              </div>
                              <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Due Date */}
            {grouped.noDueDate.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">No Due Date ({grouped.noDueDate.length})</h2>
                <div className="space-y-2">
                  {grouped.noDueDate.map(task => (
                    <Card key={task.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === 'Done'}
                            onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{task.title}</h3>
                                {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                                <div className="flex items-center gap-3 mt-2">
                                  {task.companies?.company_name && (
                                    <span className="text-sm text-muted-foreground">{task.companies.company_name}</span>
                                  )}
                                  <Badge variant="outline">{task.category}</Badge>
                                </div>
                              </div>
                              <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {grouped.completed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-green-600">Completed ({grouped.completed.length})</h2>
                <div className="space-y-2">
                  {grouped.completed.slice(0, 10).map(task => (
                    <Card key={task.id} className="opacity-60">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium line-through">{task.title}</h3>
                            {task.companies?.company_name && (
                              <span className="text-sm text-muted-foreground">{task.companies.company_name}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tasks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                <p className="text-muted-foreground mb-4">Create your first task to get organized</p>
                <Button onClick={() => setAddDialogOpen(true)} className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Task
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
