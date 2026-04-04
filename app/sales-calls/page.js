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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Phone, Clock, Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatDateTime } from '@/lib/utils/date-utils'
import { formatCurrency } from '@/lib/utils/currency'

export default function SalesCallsPage() {
  const [user, setUser] = useState(null)
  const [calls, setCalls] = useState([])
  const [companies, setCompanies] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  
  const [newCall, setNewCall] = useState({
    company_id: '',
    contact_id: '',
    call_date: new Date().toISOString().split('T')[0],
    call_time: new Date().toTimeString().slice(0, 5),
    duration_minutes: '',
    call_type: 'Warm Follow-up',
    call_outcome: 'Interested',
    discussion_summary: '',
    next_steps: '',
    competitor_mentioned: '',
    proposal_value_discussed: '',
    revisit_date_given: '',
    revisit_time_given: '',
    revisit_notes: '',
  })

  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadCalls()
    loadCompanies()
  }, [])

  useEffect(() => {
    if (newCall.company_id) {
      loadContacts(newCall.company_id)
    }
  }, [newCall.company_id])

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [timerInterval])

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

  async function loadCalls() {
    try {
      const response = await fetch('/api/sales-calls')
      const result = await response.json()
      setCalls(result.sales_calls || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading calls:', error)
      toast.error('Failed to load calls')
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

  function startTimer() {
    setTimerRunning(true)
    setTimerSeconds(0)
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1)
    }, 1000)
    setTimerInterval(interval)
  }

  function stopTimer() {
    setTimerRunning(false)
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    const minutes = Math.floor(timerSeconds / 60)
    setNewCall({ ...newCall, duration_minutes: minutes.toString() })
  }

  function formatTimer(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  async function handleAddCall(e) {
    e.preventDefault()
    try {
      const response = await fetch('/api/sales-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCall),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success(newCall.revisit_date_given ? 'Call logged and reminders created!' : 'Call logged successfully!')
      setAddDialogOpen(false)
      resetForm()
      loadCalls()
    } catch (error) {
      toast.error('Failed to log call')
      console.error(error)
    }
  }

  function resetForm() {
    setNewCall({
      company_id: '',
      contact_id: '',
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toTimeString().slice(0, 5),
      duration_minutes: '',
      call_type: 'Warm Follow-up',
      call_outcome: 'Interested',
      discussion_summary: '',
      next_steps: '',
      competitor_mentioned: '',
      proposal_value_discussed: '',
      revisit_date_given: '',
      revisit_time_given: '',
      revisit_notes: '',
    })
    setTimerSeconds(0)
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    setTimerRunning(false)
  }

  const getOutcomeBadge = (outcome) => {
    const positive = ['Very Interested', 'Interested', 'Proposal Requested', 'Proposal Sent', 'Negotiating', 'Closed Won']
    const negative = ['Not Interested', 'Closed Lost']
    const neutral = ['Neutral', 'Callback Requested']
    
    if (positive.includes(outcome)) return 'bg-green-100 text-green-800'
    if (negative.includes(outcome)) return 'bg-red-100 text-red-800'
    if (neutral.includes(outcome)) return 'bg-amber-100 text-amber-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F2B5B] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar />
      <div className="md:pl-64">
        <TopNavbar title="Sales Calls" user={user} unreadCount={0} />
        
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Calls</h1>
              <p className="text-muted-foreground mt-1">{calls.length} total calls logged</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={(open) => {
              setAddDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                  <Plus className="h-4 w-4 mr-2" />
                  Log New Call
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Sales Call</DialogTitle>
                  <DialogDescription>Record details of your sales conversation</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCall} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_id">Company *</Label>
                      <Select value={newCall.company_id} onValueChange={(val) => setNewCall({ ...newCall, company_id: val, contact_id: '' })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contact_id">Contact</Label>
                      <Select value={newCall.contact_id} onValueChange={(val) => setNewCall({ ...newCall, contact_id: val })} disabled={!newCall.company_id}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="call_date">Call Date *</Label>
                      <Input
                        id="call_date"
                        type="date"
                        value={newCall.call_date}
                        onChange={(e) => setNewCall({ ...newCall, call_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="call_time">Call Time</Label>
                      <Input
                        id="call_time"
                        type="time"
                        value={newCall.call_time}
                        onChange={(e) => setNewCall({ ...newCall, call_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={newCall.duration_minutes}
                          onChange={(e) => setNewCall({ ...newCall, duration_minutes: e.target.value })}
                          placeholder="0"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={timerRunning ? stopTimer : startTimer}
                          className="whitespace-nowrap"
                        >
                          {timerRunning ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                          {timerRunning ? formatTimer(timerSeconds) : 'Timer'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Call Type</Label>
                      <Select value={newCall.call_type} onValueChange={(val) => setNewCall({ ...newCall, call_type: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cold Call">Cold Call</SelectItem>
                          <SelectItem value="Warm Follow-up">Warm Follow-up</SelectItem>
                          <SelectItem value="Scheduled Meeting">Scheduled Meeting</SelectItem>
                          <SelectItem value="Virtual Call">Virtual Call</SelectItem>
                          <SelectItem value="Walk-in Visit">Walk-in Visit</SelectItem>
                          <SelectItem value="Conference">Conference</SelectItem>
                          <SelectItem value="Referral Call">Referral Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Call Outcome *</Label>
                      <Select value={newCall.call_outcome} onValueChange={(val) => setNewCall({ ...newCall, call_outcome: val })} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Very Interested">Very Interested</SelectItem>
                          <SelectItem value="Interested">Interested</SelectItem>
                          <SelectItem value="Neutral">Neutral</SelectItem>
                          <SelectItem value="Not Interested">Not Interested</SelectItem>
                          <SelectItem value="Callback Requested">Callback Requested</SelectItem>
                          <SelectItem value="Proposal Requested">Proposal Requested</SelectItem>
                          <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                          <SelectItem value="Negotiating">Negotiating</SelectItem>
                          <SelectItem value="Closed Won">Closed Won</SelectItem>
                          <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                          <SelectItem value="No Answer">No Answer</SelectItem>
                          <SelectItem value="Gatekeeper">Gatekeeper</SelectItem>
                          <SelectItem value="Left Voicemail">Left Voicemail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Discussion Summary *</Label>
                      <Textarea
                        value={newCall.discussion_summary}
                        onChange={(e) => setNewCall({ ...newCall, discussion_summary: e.target.value })}
                        placeholder="Write everything discussed during the call..."
                        rows={5}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Next Steps</Label>
                      <Textarea
                        value={newCall.next_steps}
                        onChange={(e) => setNewCall({ ...newCall, next_steps: e.target.value })}
                        placeholder="What needs to happen next..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Competitor Mentioned</Label>
                      <Input
                        value={newCall.competitor_mentioned}
                        onChange={(e) => setNewCall({ ...newCall, competitor_mentioned: e.target.value })}
                        placeholder="e.g., MakeMyTrip"
                      />
                    </div>
                    <div>
                      <Label>Proposal Value Discussed</Label>
                      <Input
                        type="number"
                        value={newCall.proposal_value_discussed}
                        onChange={(e) => setNewCall({ ...newCall, proposal_value_discussed: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-3">
                        <Switch
                          id="has_revisit"
                          checked={!!newCall.revisit_date_given}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              setNewCall({ ...newCall, revisit_date_given: '', revisit_time_given: '', revisit_notes: '' })
                            }
                          }}
                        />
                        <Label htmlFor="has_revisit" className="font-semibold">Did the client give a revisit date?</Label>
                      </div>
                      {newCall.revisit_date_given !== '' && (
                        <div className="grid grid-cols-3 gap-4 pl-8 mt-3">
                          <div>
                            <Label>Revisit Date</Label>
                            <Input
                              type="date"
                              value={newCall.revisit_date_given}
                              onChange={(e) => setNewCall({ ...newCall, revisit_date_given: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Revisit Time</Label>
                            <Input
                              type="time"
                              value={newCall.revisit_time_given}
                              onChange={(e) => setNewCall({ ...newCall, revisit_time_given: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Revisit Notes</Label>
                            <Input
                              value={newCall.revisit_notes}
                              onChange={(e) => setNewCall({ ...newCall, revisit_notes: e.target.value })}
                              placeholder="Purpose of revisit"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                      Log Call
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Today's Calls</CardDescription>
                <CardTitle className="text-3xl text-[#0F2B5B]">
                  {calls.filter(c => c.call_date === new Date().toISOString().split('T')[0]).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Week</CardDescription>
                <CardTitle className="text-3xl text-[#0F2B5B]">
                  {calls.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Positive Outcomes</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {calls.filter(c => ['Very Interested', 'Interested', 'Closed Won'].includes(c.call_outcome)).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Duration</CardDescription>
                <CardTitle className="text-3xl text-[#0F2B5B]">
                  {calls.length > 0 ? Math.round(calls.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / calls.length) : 0}m
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Calls List */}
          {calls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No calls logged yet</h3>
                <p className="text-muted-foreground mb-4">Start tracking your sales conversations</p>
                <Button onClick={() => setAddDialogOpen(true)} className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Call
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {calls.map((call) => (
                <Card key={call.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{call.companies?.company_name}</CardTitle>
                        <CardDescription className="mt-1">
                          {formatDate(call.call_date)} at {call.call_time} • {call.duration_minutes || 0} min{call.duration_minutes !== 1 ? 's' : ''}
                          {call.contacts?.full_name && ` • ${call.contacts.full_name}`}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getOutcomeBadge(call.call_outcome)}>{call.call_outcome}</Badge>
                        <Badge variant="outline">{call.call_type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Discussion:</p>
                        <p className="text-sm text-muted-foreground">{call.discussion_summary}</p>
                      </div>
                      {call.next_steps && (
                        <div>
                          <p className="text-sm font-medium mb-1">Next Steps:</p>
                          <p className="text-sm text-muted-foreground">{call.next_steps}</p>
                        </div>
                      )}
                      {call.revisit_date_given && (
                        <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                            🗓️ Revisit Scheduled: {formatDate(call.revisit_date_given)} {call.revisit_time_given && `at ${call.revisit_time_given}`}
                          </p>
                          {call.revisit_notes && <p className="text-sm text-amber-700 dark:text-amber-300">{call.revisit_notes}</p>}
                        </div>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {call.competitor_mentioned && <span>Competitor: {call.competitor_mentioned}</span>}
                        {call.proposal_value_discussed && <span>Value: {formatCurrency(call.proposal_value_discussed)}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
