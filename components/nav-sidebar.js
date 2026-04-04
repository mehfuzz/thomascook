'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Phone, Calendar, Building2, Target, CheckSquare, FileText, Bell, Download, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Sales Calls', href: '/sales-calls', icon: Phone },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Targets', href: '/targets', icon: Target },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'Export MIS', href: '/export', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function NavSidebar({ unreadCount = 0 }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0F2B5B] text-white">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-white to-[#F5A623] rounded-lg flex items-center justify-center mr-3">
            <span className="text-xl font-bold text-[#0F2B5B]">TC</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Sales Center</h1>
            <p className="text-xs text-[#F5A623]">Thomas Cook</p>
          </div>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors relative',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.href === '/reminders' && unreadCount > 0 && (
                    <span className="ml-auto bg-[#F5A623] text-[#0F2B5B] text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-white/10">
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
