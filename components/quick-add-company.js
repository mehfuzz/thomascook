'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function QuickAddCompany({ onCompanyAdded }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState({
    company_name: '',
    industry: '',
    city: '',
    account_tier: 'Cold',
    pipeline_stage: 'Cold Lead',
    primary_travel_type: 'Mixed',
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })

      const result = await response.json()

      if (response.status === 409) {
        toast.warning(result.message)
        setLoading(false)
        return
      }

      if (!response.ok) throw new Error(result.error)

      toast.success('Company added successfully!')
      setOpen(false)
      setCompany({
        company_name: '',
        industry: '',
        city: '',
        account_tier: 'Cold',
        pipeline_stage: 'Cold Lead',
        primary_travel_type: 'Mixed',
      })
      
      if (onCompanyAdded) {
        onCompanyAdded(result.company)
      }
    } catch (error) {
      toast.error('Failed to add company')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-[#0F2B5B] border-[#0F2B5B] hover:bg-[#0F2B5B] hover:text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Company
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Company</DialogTitle>
            <DialogDescription>Add a new company to your pipeline</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={company.company_name}
                onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                required
                placeholder="e.g., Infosys Limited"
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={company.industry}
                onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                placeholder="e.g., IT Services"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={company.city}
                onChange={(e) => setCompany({ ...company, city: e.target.value })}
                placeholder="e.g., Bangalore"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Tier</Label>
                <Select value={company.account_tier} onValueChange={(val) => setCompany({ ...company, account_tier: val })}>
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
                <Label>Travel Type</Label>
                <Select value={company.primary_travel_type} onValueChange={(val) => setCompany({ ...company, primary_travel_type: val })}>
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
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0F2B5B] hover:bg-[#1a4178]" disabled={loading}>
                {loading ? 'Adding...' : 'Add Company'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
