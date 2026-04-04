'use client'

import { Loader2 } from 'lucide-react'

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#0F2B5B]/20 border-t-[#0F2B5B] rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#F5A623] animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Thomas Cook Sales Center</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function CardLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F2B5B] mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
