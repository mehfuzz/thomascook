'use client'

import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { useUser } from '@/lib/contexts/user-context'

export default function TargetsPage() {
  const { user } = useUser()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar />
      <div className="md:pl-64">
        <TopNavbar title="Targets & Performance" user={user} unreadCount={0} />
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Targets & Performance Coming Soon</h3>
              <p className="text-muted-foreground">Set and track your daily, weekly, and monthly targets</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
