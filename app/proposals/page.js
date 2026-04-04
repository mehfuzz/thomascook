'use client'

import { NavSidebar } from '@/components/nav-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function ProposalsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavSidebar />
      <div className="md:pl-64">
        <TopNavbar title="Proposals" user={{}} unreadCount={0} />
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Proposals Tracker Coming Soon</h3>
              <p className="text-muted-foreground">Track your proposals and win rates here</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
