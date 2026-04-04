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
import { Plus, Building2, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { getHealthScoreBadge } from '@/lib/utils/health-score'
import { PageLoader } from '@/components/page-loader'

export default function CompaniesPage() {
  const [user, setUser] = useState(null)
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [filterStage, setFilterStage] = useState('all')
  
  const [newCompany, setNewCompany] = useState({
    company_name: '',
    industry: '',
    city: '',
    state: '',
    address: '',
    website: '',
    gstin: '',
    account_tier: 'Cold',
    pipeline_stage: 'Cold Lead',
    annual_travel_budget_estimate: '',
    employee_count: '',
    primary_travel_type: 'Mixed',
    account_notes: '',
  })

  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadCompanies()
  }, [])

  useEffect(() => {
    filterCompanies()
  }, [companies, searchQuery, filterTier, filterStage])

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

  async function loadCompanies() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCompanies(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Failed to load companies')
      setLoading(false)
    }
  }

  function filterCompanies() {
    let filtered = [...companies]

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter(c => c.account_tier === filterTier)
    }

    if (filterStage !== 'all') {
      filtered = filtered.filter(c => c.pipeline_stage === filterStage)
    }

    setFilteredCompanies(filtered)
  }

  async function handleAddCompany(e) {
    e.preventDefault()
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      })

      const result = await response.json()

      if (response.status === 409) {
        toast.warning(result.message)
        return
      }

      if (!response.ok) throw new Error(result.error)

      toast.success('Company added successfully!')
      setAddDialogOpen(false)
      setNewCompany({
        company_name: '',
        industry: '',
        city: '',
        state: '',
        address: '',
        website: '',
        gstin: '',
        account_tier: 'Cold',
        pipeline_stage: 'Cold Lead',
        annual_travel_budget_estimate: '',
        employee_count: '',
        primary_travel_type: 'Mixed',
        account_notes: '',
      })
      loadCompanies()
    } catch (error) {
      toast.error('Failed to add company')
      console.error(error)
    }
  }

  const getTierBadge = (tier) => {
    const colors = {
      'Hot': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Warm': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Cold': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    }
    return colors[tier] || colors['Cold']
  }

  const getStageBadge = (stage) => {
    const colors = {
      'Cold Lead': 'bg-gray-100 text-gray-800',
      'Contacted': 'bg-blue-100 text-blue-800',
      'Proposal Sent': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-amber-100 text-amber-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
    }
    return colors[stage] || colors['Cold Lead']
  }

  if (loading) {
    return <PageLoader message="Loading companies..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar />
      <div className="md:pl-64">
        <TopNavbar title="Company Pipeline" user={user} unreadCount={0} />
        
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header with Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Companies</h1>
              <p className="text-muted-foreground mt-1">{companies.length} total companies in your pipeline</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                  <DialogDescription>Enter the company details to add to your pipeline</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCompany} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={newCompany.company_name}
                        onChange={(e) => setNewCompany({ ...newCompany, company_name: e.target.value })}
                        required
                        placeholder="e.g., Infosys Limited"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={newCompany.industry}
                        onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                        placeholder="e.g., IT Services"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newCompany.city}
                        onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                        placeholder="e.g., Bangalore"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_tier">Account Tier</Label>
                      <Select value={newCompany.account_tier} onValueChange={(val) => setNewCompany({ ...newCompany, account_tier: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hot">Hot</SelectItem>
                          <SelectItem value="Warm">Warm</SelectItem>
                          <SelectItem value="Cold">Cold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pipeline_stage">Pipeline Stage</Label>
                      <Select value={newCompany.pipeline_stage} onValueChange={(val) => setNewCompany({ ...newCompany, pipeline_stage: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cold Lead">Cold Lead</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                          <SelectItem value="Negotiation">Negotiation</SelectItem>
                          <SelectItem value="Won">Won</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="primary_travel_type">Primary Travel Type</Label>
                      <Select value={newCompany.primary_travel_type} onValueChange={(val) => setNewCompany({ ...newCompany, primary_travel_type: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Domestic">Domestic</SelectItem>
                          <SelectItem value="International">International</SelectItem>
                          <SelectItem value="MICE">MICE</SelectItem>
                          <SelectItem value="Visa">Visa</SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employee_count">Employee Count</Label>
                      <Input
                        id="employee_count"
                        value={newCompany.employee_count}
                        onChange={(e) => setNewCompany({ ...newCompany, employee_count: e.target.value })}
                        placeholder="e.g., 1000-5000"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="account_notes">Notes</Label>
                      <Textarea
                        id="account_notes"
                        value={newCompany.account_notes}
                        onChange={(e) => setNewCompany({ ...newCompany, account_notes: e.target.value })}
                        placeholder="Any important notes about this company..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                      Add Company
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="Cold Lead">Cold Lead</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Companies Grid */}
          {filteredCompanies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground mb-4">
                  {companies.length === 0 
                    ? "Get started by adding your first company" 
                    : "Try adjusting your filters"}
                </p>
                {companies.length === 0 && (
                  <Button onClick={() => setAddDialogOpen(true)} className="bg-[#0F2B5B] hover:bg-[#1a4178]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Company
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{company.company_name}</CardTitle>
                        <CardDescription>{company.industry || 'No industry set'}</CardDescription>
                      </div>
                      <Badge className={getHealthScoreBadge(company.health_score)}>
                        {company.health_score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tier:</span>
                        <Badge className={getTierBadge(company.account_tier)}>{company.account_tier}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Stage:</span>
                        <Badge className={getStageBadge(company.pipeline_stage)}>{company.pipeline_stage}</Badge>
                      </div>
                      {company.city && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Location:</span>
                          <span className="text-sm font-medium">{company.city}</span>
                        </div>
                      )}
                      {company.primary_travel_type && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Travel:</span>
                          <span className="text-sm font-medium">{company.primary_travel_type}</span>
                        </div>
                      )}
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
