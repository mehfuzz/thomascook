'use client'

import { useState } from 'react'
import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Search, Building2, AlertTriangle, CheckCircle2, XCircle,
  Loader2, User, MapPin, CreditCard, Briefcase, ShieldAlert, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/lib/contexts/user-context'

const VENDOR_CATEGORIES = [
  'IT Services', 'Travel & Hospitality', 'Logistics & Transport',
  'Facilities Management', 'Marketing & Advertising', 'Consulting',
  'HR & Staffing', 'Legal & Compliance', 'Finance & Accounting',
  'Manufacturing & Supply', 'Telecom', 'Other',
]

const STATUS_COLORS = {
  Active: 'bg-green-100 text-green-800',
  Suspended: 'bg-yellow-100 text-yellow-800',
  Cancelled: 'bg-red-100 text-red-800',
  Unknown: 'bg-gray-100 text-gray-700',
}

function DuplicateWarning({ matches }) {
  if (!matches || matches.length === 0) return null

  const hasBlacklisted = matches.some(m => m.is_blacklisted)

  return (
    <Alert className={`border-2 ${hasBlacklisted ? 'border-red-500 bg-red-50' : 'border-yellow-400 bg-yellow-50'}`}>
      <ShieldAlert className={`h-5 w-5 ${hasBlacklisted ? 'text-red-600' : 'text-yellow-600'}`} />
      <AlertTitle className={`font-bold ${hasBlacklisted ? 'text-red-700' : 'text-yellow-700'}`}>
        {hasBlacklisted
          ? 'BLACKLISTED VENDOR DETECTED — Review Required'
          : 'Potential Duplicate Vendor Found'}
      </AlertTitle>
      <AlertDescription>
        <p className="mb-3 text-sm text-gray-700">
          The following existing vendors share the same address, owner, or PAN.
          This may indicate an attempt to re-register a blocked vendor.
        </p>
        <div className="space-y-2">
          {matches.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg border p-3 text-sm ${
                m.is_blacklisted
                  ? 'border-red-300 bg-red-100'
                  : 'border-yellow-300 bg-yellow-100'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold">{m.legal_name || m.trade_name}</span>
                <div className="flex gap-2">
                  {m.is_blacklisted && (
                    <Badge className="bg-red-600 text-white text-xs">BLACKLISTED</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{m.status}</Badge>
                </div>
              </div>
              <div className="mt-1 text-gray-600 space-y-0.5">
                <p><span className="font-medium">GSTIN:</span> {m.gstin}</p>
                {m.pan_number && <p><span className="font-medium">PAN:</span> {m.pan_number}</p>}
                {m.proprietor_name && <p><span className="font-medium">Owner:</span> {m.proprietor_name}</p>}
                <p className="text-xs text-indigo-700 font-medium mt-1">
                  Match reason: {m.match_reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

function InfoRow({ label, value, mono }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

export default function VendorOnboardingPage() {
  const { user } = useUser()

  // --- GST Lookup state ---
  const [gstin, setGstin] = useState('')
  const [gstLoading, setGstLoading] = useState(false)
  const [gstData, setGstData] = useState(null)
  const [gstError, setGstError] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  // --- Duplicate check state ---
  const [dupLoading, setDupLoading] = useState(false)
  const [dupMatches, setDupMatches] = useState(null) // null = not checked yet

  // --- Form fields (auto-filled + manual) ---
  const [form, setForm] = useState({
    // Bank details
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    bank_branch: '',
    // Category
    vendor_category: '',
    service_description: '',
  })

  // --- Submit state ---
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ----------------------------------------------------------------
  // GST Lookup
  // ----------------------------------------------------------------
  async function handleGSTLookup(e) {
    e.preventDefault()
    const trimmed = gstin.trim().toUpperCase()
    if (!trimmed) return

    setGstLoading(true)
    setGstError('')
    setGstData(null)
    setDupMatches(null)
    setIsDemo(false)

    try {
      const res = await fetch(`/api/gst-lookup?gstin=${encodeURIComponent(trimmed)}`)
      const result = await res.json()

      if (!res.ok) {
        setGstError(result.message || 'Failed to fetch GST details. Please try again.')
        return
      }

      const details = result.gst_details
      setIsDemo(!!details._demo)
      setGstData(details)
      toast.success(details._demo ? 'Loaded demo data (GST portal unavailable)' : 'GST details fetched successfully')

      // Immediately run duplicate check
      await runDuplicateCheck(result.gst_details)
    } catch {
      setGstError('Network error. Please check your connection and try again.')
    } finally {
      setGstLoading(false)
    }
  }

  // ----------------------------------------------------------------
  // Duplicate Check
  // ----------------------------------------------------------------
  async function runDuplicateCheck(details) {
    setDupLoading(true)
    try {
      const res = await fetch('/api/vendors/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_full: details.address_full,
          proprietor_name: details.proprietor_name,
          pan_number: details.pan_number,
          exclude_gstin: details.gstin,
        }),
      })
      const result = await res.json()
      setDupMatches(result.matches || [])

      if (result.has_duplicates) {
        const hasBlacklisted = result.matches.some(m => m.is_blacklisted)
        if (hasBlacklisted) {
          toast.error('Blacklisted vendor match found! Review required before proceeding.')
        } else {
          toast.warning('Potential duplicate vendor detected. Please review before submitting.')
        }
      }
    } catch {
      // Non-blocking — still allow form to proceed
      setDupMatches([])
    } finally {
      setDupLoading(false)
    }
  }

  // ----------------------------------------------------------------
  // Form submit
  // ----------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault()
    if (!gstData) {
      toast.error('Please look up a valid GSTIN first.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        // From GST API
        ...gstData,
        // From manual form fields
        ...form,
        // Duplicate detection result (audit trail)
        duplicate_flag: dupMatches && dupMatches.length > 0,
        duplicate_matches: dupMatches || [],
      }

      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error(result.message || 'This vendor already exists.')
        } else {
          throw new Error(result.error || 'Submission failed')
        }
        return
      }

      toast.success('Vendor submitted for onboarding review!')
      setSubmitted(true)
    } catch (err) {
      toast.error(err.message || 'Failed to submit vendor. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setGstin('')
    setGstData(null)
    setGstError('')
    setDupMatches(null)
    setForm({
      bank_account_number: '',
      bank_ifsc: '',
      bank_name: '',
      bank_branch: '',
      vendor_category: '',
      service_description: '',
    })
    setSubmitted(false)
  }

  // ----------------------------------------------------------------
  // Success screen
  // ----------------------------------------------------------------
  if (submitted) {
    return (
      <div className="flex h-screen bg-gray-50">
        <NavSidebar userRole={user?.role} />
        <div className="flex-1 flex flex-col md:pl-64">
          <TopNavbar />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Submitted!</h2>
              <p className="text-gray-600 mb-6">
                The vendor has been submitted for review. Our procurement team will verify the details
                and notify you once approved.
              </p>
              <Button onClick={handleReset} className="bg-[#0F2B5B] hover:bg-[#0F2B5B]/90">
                Onboard Another Vendor
              </Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const hasBlacklistedMatch = dupMatches && dupMatches.some(m => m.is_blacklisted)

  return (
    <div className="flex h-screen bg-gray-50">
      <NavSidebar userRole={user?.role} />
      <div className="flex-1 flex flex-col md:pl-64 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Onboarding</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter the vendor's GSTIN to auto-fill details from the GST portal, then complete the
              remaining fields to submit for approval.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl">

            {/* ── Step 1: GSTIN Lookup ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-4 w-4 text-[#0F2B5B]" />
                  Step 1 — Fetch Details from GST Portal
                </CardTitle>
                <CardDescription>
                  Enter a 15-character GSTIN to pull business and address details automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGSTLookup} className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. 27AABCU9603R1ZX"
                      value={gstin}
                      onChange={e => setGstin(e.target.value.toUpperCase())}
                      maxLength={15}
                      className="font-mono uppercase tracking-widest"
                      disabled={gstLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={gstLoading || gstin.trim().length !== 15}
                    className="bg-[#0F2B5B] hover:bg-[#0F2B5B]/90 shrink-0"
                  >
                    {gstLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching…</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" /> Fetch Details</>
                    )}
                  </Button>
                </form>

                {gstError && (
                  <Alert className="mt-3 border-red-300 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{gstError}</AlertDescription>
                  </Alert>
                )}

                {dupLoading && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking for duplicate vendors…
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Duplicate Warning ── */}
            {dupMatches && dupMatches.length > 0 && (
              <DuplicateWarning matches={dupMatches} />
            )}

            {dupMatches && dupMatches.length === 0 && gstData && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  No duplicate vendors found based on address, owner name, or PAN.
                </AlertDescription>
              </Alert>
            )}

            {/* ── Demo mode banner ── */}
            {isDemo && (
              <Alert className="border-blue-300 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700">Demo Mode — Sample Data</AlertTitle>
                <AlertDescription className="text-blue-600 text-sm">
                  The GST portal is currently unreachable. Showing sample data so you can test the form.
                  For live data, set <code className="bg-blue-100 px-1 rounded">GST_DEMO_MODE=false</code> and
                  configure <code className="bg-blue-100 px-1 rounded">GST_API_URL</code> +{' '}
                  <code className="bg-blue-100 px-1 rounded">GST_API_KEY</code> with a provider like Karza or Signzy.
                </AlertDescription>
              </Alert>
            )}

            {/* ── Step 2: GST Details (auto-filled) ── */}
            {gstData && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4 text-[#0F2B5B]" />
                      Step 2 — Business Details
                    </CardTitle>
                    <Badge className={STATUS_COLORS[gstData.gst_status] || STATUS_COLORS.Unknown}>
                      GST: {gstData.gst_status}
                    </Badge>
                  </div>
                  <CardDescription>Auto-filled from the GST portal. Verify before proceeding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Identity */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Identity
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                      <InfoRow label="GSTIN" value={gstData.gstin} mono />
                      <InfoRow label="PAN" value={gstData.pan_number} mono />
                      <InfoRow label="Legal Name" value={gstData.legal_name} />
                      <InfoRow label="Trade Name" value={gstData.trade_name} />
                      <InfoRow label="Taxpayer Type" value={gstData.taxpayer_type} />
                      <InfoRow label="Registration Date" value={gstData.gst_registration_date} />
                    </div>
                  </div>

                  <Separator />

                  {/* Owner */}
                  {gstData.proprietor_name && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                          <User className="h-3 w-3" /> Proprietor / Authorised Signatory
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <InfoRow label="Name" value={gstData.proprietor_name} />
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Address */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Principal Place of Business
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                      {gstData.address_building && <InfoRow label="Building" value={gstData.address_building} />}
                      {gstData.address_street && <InfoRow label="Street" value={gstData.address_street} />}
                      {gstData.address_locality && <InfoRow label="Locality" value={gstData.address_locality} />}
                      <InfoRow label="City / District" value={[gstData.address_city, gstData.address_district].filter(Boolean).join(' / ')} />
                      <InfoRow label="State" value={gstData.address_state} />
                      <InfoRow label="PIN Code" value={gstData.address_pincode} mono />
                    </div>
                  </div>

                  {gstData.nature_of_business?.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          Nature of Business
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {gstData.nature_of_business.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* GST inactive warning */}
                  {gstData.gst_status && gstData.gst_status !== 'Active' && (
                    <Alert className="border-orange-300 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-700">Inactive GST Registration</AlertTitle>
                      <AlertDescription className="text-orange-600">
                        This vendor's GST status is <strong>{gstData.gst_status}</strong>.
                        Proceed only after verifying with the procurement team.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Step 3: Bank & Financial Details ── */}
            {gstData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-[#0F2B5B]" />
                    Step 3 — Bank & Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form id="vendor-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="bank_account_number">Account Number</Label>
                        <Input
                          id="bank_account_number"
                          placeholder="012345678901"
                          value={form.bank_account_number}
                          onChange={e => setForm(f => ({ ...f, bank_account_number: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bank_ifsc">IFSC Code</Label>
                        <Input
                          id="bank_ifsc"
                          placeholder="HDFC0001234"
                          value={form.bank_ifsc}
                          onChange={e => setForm(f => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))}
                          className="font-mono uppercase"
                          maxLength={11}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          placeholder="HDFC Bank"
                          value={form.bank_name}
                          onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bank_branch">Branch</Label>
                        <Input
                          id="bank_branch"
                          placeholder="Andheri West, Mumbai"
                          value={form.bank_branch}
                          onChange={e => setForm(f => ({ ...f, bank_branch: e.target.value }))}
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ── Step 4: Category ── */}
            {gstData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="h-4 w-4 text-[#0F2B5B]" />
                    Step 4 — Vendor Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor_category">Category <span className="text-red-500">*</span></Label>
                    <Select
                      value={form.vendor_category}
                      onValueChange={val => setForm(f => ({ ...f, vendor_category: val }))}
                    >
                      <SelectTrigger id="vendor_category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDOR_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="service_description">Service Description</Label>
                    <Textarea
                      id="service_description"
                      placeholder="Brief description of services or products to be procured from this vendor…"
                      rows={3}
                      value={form.service_description}
                      onChange={e => setForm(f => ({ ...f, service_description: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Submit ── */}
            {gstData && (
              <div className="pb-10">
                {hasBlacklistedMatch && (
                  <Alert className="mb-4 border-red-400 bg-red-50">
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-700">Submission Blocked</AlertTitle>
                    <AlertDescription className="text-red-600">
                      A blacklisted vendor was detected with the same address or owner.
                      Submitting this vendor requires explicit approval from your Compliance team.
                      Contact them before proceeding.
                    </AlertDescription>
                  </Alert>
                )}

                {dupMatches && dupMatches.length > 0 && !hasBlacklistedMatch && (
                  <Alert className="mb-4 border-yellow-400 bg-yellow-50">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      Duplicate vendors were detected. Your submission will be flagged for manual
                      review by the procurement team.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    form="vendor-form"
                    type="submit"
                    disabled={submitting || !form.vendor_category || hasBlacklistedMatch}
                    className="bg-[#0F2B5B] hover:bg-[#0F2B5B]/90"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                    ) : (
                      'Submit for Onboarding'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Start Over
                  </Button>
                </div>

                {hasBlacklistedMatch && (
                  <p className="mt-2 text-xs text-red-500">
                    Submission is disabled due to blacklisted vendor match. Contact compliance@airtel.com.
                  </p>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
