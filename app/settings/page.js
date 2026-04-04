'use client'

import { useState, useEffect } from 'react'
import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useUser } from '@/lib/contexts/user-context'

export default function SettingsPage() {
  const { user, invalidateUser } = useUser()
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    designation: '',
  })
  const [loading, setLoading] = useState(false)

  // Populate form once user is available from context
  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        designation: user.designation || '',
      })
    }
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      toast.success('Profile updated successfully!')
      invalidateUser()
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar />
      <div className="md:pl-64">
        <TopNavbar title="Settings" user={user} unreadCount={0} />
        
        <main className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profile.phone_number}
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        value={profile.designation}
                        onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                        placeholder="General Manager"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-[#0F2B5B] hover:bg-[#1a4178]" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure when and how you receive reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">In-app notifications are enabled by default. Additional notification settings will be available in the full version.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
