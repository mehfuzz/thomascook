'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const UserContext = createContext(null)
const CACHE_KEY = 'tc_user_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    // Serve from cache immediately to avoid showing loader on tab switch
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) {
          setUser(data)
          setUserLoading(false)
          return
        }
      }
    } catch (_) {}

    loadUser()
  }, [])

  async function loadUser() {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setUserLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      const userData = profile || { id: authUser.id, email: authUser.email, full_name: 'GM', role: 'user' }
      setUser(userData)

      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: userData, timestamp: Date.now() }))
      } catch (_) {}
    } finally {
      setUserLoading(false)
    }
  }

  function invalidateUser() {
    try { sessionStorage.removeItem(CACHE_KEY) } catch (_) {}
    setUser(null)
    setUserLoading(true)
    loadUser()
  }

  return (
    <UserContext.Provider value={{ user, userLoading, invalidateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
