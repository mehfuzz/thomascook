'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/contexts/user-context'
import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/page-loader'
import { Plus, Calendar, Clock, MapPin, Phone, Building2, User, CheckCircle2, XCircle, RefreshCw, Users } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/date-utils'
import { parseISO, isToday, isFuture, isPast, isTomorrow } from 'date-fns'

const STATUS_STYLES = {
  'Scheduled':   'bg-blue-100 text-blue-800',
  'Completed':   'bg-green-100 text-green-800',
  'Rescheduled': 'bg-amber-100 text-amber-800',
  'Cancelled':   'bg-red-100 text-red-800',
}

const MODE_STYLES = {
  'In-Person': 'bg-purple-100 text-purple-800',
  'Virtual':   'bg-cyan-100 text-cyan-800',
  'Phone':     'bg-orange-100 text-orange-800',
}

function getDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return formatDate(dateStr)
}

export default function AppointmentsPage() {
  const { user } = useUser()
  const [appointments, setAppointments] = useState([])
  const [companies, setCompanies] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('upcoming')
  const [adminView, setAdminView] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const [newAppt, setNewAppt] = useState({
    company_id: '',
    contact_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    duration_estimated_minutes: '60',
    meeting_mode: 'In-Person',
    status: 'Scheduled',
    purpose: '',
    location: '',
    agenda: '',
  })

  const supabase = createClient()

  useEffect(() => {
    loadAppointments()
  }, [adminView])

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (newAppt.company_id) loadContacts(newAppt.company_id)
    else setContacts([])
  }, [newAppt.company_id])

  async function loadAppointments() {
    try {
      const url = adminView ? '/api/appointments?all=true' : '/api/appointments'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAppointments(data.appointments || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('id, company_name').order('company_name')
    setCompanies(data || [])
  }

  async function loadContacts(companyId) {
    const { data } = await supabase.from('contacts').select('id, full_name').eq('company_id', companyId).order('full_name')
    setContacts(data || [])
  }

  async function handleAddAppointment(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAppt, create_reminders: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Appointment scheduled and reminders set!')
      setAddDialogOpen(false)
      resetForm()
      loadAppointments()
    } catch (err) {
      toast.error(err.message || 'Failed to schedule appointment')
    }
  }

  async function updateStatus(id, status) {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      toast.success(`Marked as ${status}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  function resetForm() {
    setNewAppt({
      company_id: '', contact_id: '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '', duration_estimated_minutes: '60',
      meeting_mode: 'In-Person', status: 'Scheduled',
      purpose: '', location: '', agenda: '',
    })
  }

  // Derived counts
  const today = new Date().toISOString().split('T')[0]
  const counts = useMemo(() => ({
    today:     appointments.filter(a => a.appointment_date === today).length,
    upcoming:  appointments.filter(a => a.appointment_date > today && a.status === 'Scheduled').length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    total:     appointments.length,
  }), [appointments, today])

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'today':     return appointments.filter(a => a.appointment_date === today)
      case 'upcoming':  return appointments.filter(a => a.appointment_date >= today && a.status === 'Scheduled').sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
      case 'completed': return appointments.filter(a => a.status === 'Completed')
      case 'cancelled': return appointments.filter(a => ['Cancelled', 'Rescheduled'].includes(a.status))
      default:          return [...appointments].sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
    }
  }, [appointments, activeFilter, today])

  const isFromSalesCall = (appt) => appt.purpose === 'Follow-up from sales call'

  if (loading) return <PageLoader message="Loading appointments..." />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar userRole={user?.role} />
      <div className="md:pl-64">
        <TopNavbar title="Appointments" user={user} unreadCount={0} />

        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Appointments</h1>
              <p className="text-muted-foreground mt-1">{counts.upcoming} upcoming scheduled</p>
            </div>
            <div className="flex gap-2">
              {user?.role === 'admin' && (
                <Button
                  variant={adminView ? 'default' : 'outline'}
                  onClick={() => { setAdminView(v => !v); setLoading(true) }}
                  className={adminView ? 'bg-[#0F2B5B]' : ''}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {adminView ? 'All Staff' : 'My View'}
                </Button>
              )}
              <Dialog open={addDialogOpen} onOpenChange={(o) => { setAddDialogOpen(o); if (!o) resetForm() }}>
                <DialogTrigger asChild>
                  <Button className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                    <Plus className="h-4 w-4 mr-2" /> Schedule Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Schedule Appointment</DialogTitle>
                    <DialogDescription>Set up a new meeting or visit</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAppointment} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Company *</Label>
                        <Select value={newAppt.company_id} onValueChange={(v) => setNewAppt({ ...newAppt, company_id: v, contact_id: '' })} required>
                          <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                          <SelectContent>
                            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Contact</Label>
                        <Select value={newAppt.contact_id} onValueChange={(v) => setNewAppt({ ...newAppt, contact_id: v })} disabled={!newAppt.company_id}>
                          <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                          <SelectContent>
                            {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Meeting Mode *</Label>
                        <Select value={newAppt.meeting_mode} onValueChange={(v) => setNewAppt({ ...newAppt, meeting_mode: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="In-Person">In-Person</SelectItem>
                            <SelectItem value="Virtual">Virtual</SelectItem>
                            <SelectItem value="Phone">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date *</Label>
                        <Input type="date" value={newAppt.appointment_date} onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input type="time" value={newAppt.appointment_time} onChange={(e) => setNewAppt({ ...newAppt, appointment_time: e.target.value })} />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input type="number" value={newAppt.duration_estimated_minutes} onChange={(e) => setNewAppt({ ...newAppt, duration_estimated_minutes: e.target.value })} placeholder="60" />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input value={newAppt.location} onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })} placeholder="Office address or meeting link" />
                      </div>
                      <div className="col-span-2">
                        <Label>Purpose *</Label>
                        <Input value={newAppt.purpose} onChange={(e) => setNewAppt({ ...newAppt, purpose: e.target.value })} placeholder="e.g. Proposal presentation, Contract discussion" required />
                      </div>
                      <div className="col-span-2">
                        <Label>Agenda / Notes</Label>
                        <Textarea value={newAppt.agenda} onChange={(e) => setNewAppt({ ...newAppt, agenda: e.target.value })} placeholder="Points to cover, preparation notes..." rows={3} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-[#0F2B5B] hover:bg-[#1a4178]">Schedule & Set Reminders</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Today's Meetings", value: counts.today, color: 'text-[#0F2B5B]' },
              { label: 'Upcoming', value: counts.upcoming, color: 'text-blue-600' },
              { label: 'Completed', value: counts.completed, color: 'text-green-600' },
              { label: 'Total', value: counts.total, color: 'text-[#0F2B5B]' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className={`text-3xl ${color}`}>{value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'today', label: 'Today' },
              { key: 'all', label: 'All' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled / Rescheduled' },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={activeFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(key)}
                className={activeFilter === key ? 'bg-[#0F2B5B]' : ''}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeFilter === 'upcoming' ? 'No upcoming appointments scheduled.' : 'Nothing to show for this filter.'}
                </p>
                <Button onClick={() => setAddDialogOpen(true)} className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                  <Plus className="h-4 w-4 mr-2" /> Schedule Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((appt) => {
                const dateLabel = getDateLabel(appt.appointment_date)
                const isScheduled = appt.status === 'Scheduled'
                const isPastAppt = appt.appointment_date < today

                return (
                  <Card key={appt.id} className={`border-l-4 ${
                    appt.appointment_date === today ? 'border-l-[#F5A623]' :
                    appt.status === 'Completed' ? 'border-l-green-500' :
                    appt.status === 'Cancelled' ? 'border-l-red-300' :
                    'border-l-[#0F2B5B]'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <CardTitle className="text-lg">{appt.companies?.company_name}</CardTitle>
                            {isFromSalesCall(appt) && (
                              <Badge variant="outline" className="text-xs border-[#F5A623] text-[#F5A623]">From Sales Call</Badge>
                            )}
                          </div>
                          <CardDescription className="flex items-center gap-3 flex-wrap mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <strong>{dateLabel}</strong>
                              {appt.appointment_time && (
                                <><Clock className="h-3.5 w-3.5 ml-1" />{appt.appointment_time.slice(0, 5)}</>
                              )}
                            </span>
                            {appt.duration_estimated_minutes && (
                              <span>{appt.duration_estimated_minutes} min</span>
                            )}
                            {appt.companies?.city && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />{appt.companies.city}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge className={STATUS_STYLES[appt.status] || ''}>{appt.status}</Badge>
                          <Badge className={MODE_STYLES[appt.meeting_mode] || 'bg-gray-100 text-gray-800'}>{appt.meeting_mode}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Contact row */}
                      {(appt.contacts?.full_name || appt.contacts?.phone) && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {appt.contacts?.full_name && (
                            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{appt.contacts.full_name}</span>
                          )}
                          {appt.contacts?.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{appt.contacts.phone}</span>
                          )}
                        </div>
                      )}

                      {/* Admin: show staff name */}
                      {adminView && appt.users?.full_name && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>Staff: <strong>{appt.users.full_name}</strong></span>
                        </div>
                      )}

                      {/* Purpose & Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {appt.purpose && (
                          <div>
                            <span className="font-medium">Purpose: </span>
                            <span className="text-muted-foreground">{appt.purpose}</span>
                          </div>
                        )}
                        {appt.location && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{appt.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Agenda */}
                      {appt.agenda && (
                        <div className="text-sm">
                          <span className="font-medium">Agenda: </span>
                          <span className="text-muted-foreground">{appt.agenda}</span>
                        </div>
                      )}

                      {/* Actual outcome if completed */}
                      {appt.actual_outcome && (
                        <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-sm">
                          <span className="font-medium text-green-800 dark:text-green-200">Outcome: </span>
                          <span className="text-green-700 dark:text-green-300">{appt.actual_outcome}</span>
                        </div>
                      )}

                      {/* Actions — only for own appointments and scheduled ones */}
                      {!adminView && isScheduled && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-200 hover:bg-green-50"
                            disabled={updatingId === appt.id}
                            onClick={() => updateStatus(appt.id, 'Completed')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-700 border-amber-200 hover:bg-amber-50"
                            disabled={updatingId === appt.id}
                            onClick={() => updateStatus(appt.id, 'Rescheduled')}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Rescheduled
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            disabled={updatingId === appt.id}
                            onClick={() => updateStatus(appt.id, 'Cancelled')}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
