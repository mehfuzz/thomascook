'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Supabase emits an AUTH_TOKEN_REFRESHED / PASSWORD_RECOVERY event
  // when the user lands here from the reset email link.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if there's already an active session (PKCE flow sets it before this runs)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const passwordsMatch = password && confirm && password === confirm
  const passwordLongEnough = password.length >= 8

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!passwordLongEnough) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2B5B] via-[#1a4178] to-[#0F2B5B] p-4">
        <Card className="w-full max-w-md shadow-2xl text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Password updated!</h2>
            <p className="text-sm text-gray-500">Redirecting you to the dashboard…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2B5B] via-[#1a4178] to-[#0F2B5B] p-4">
        <Card className="w-full max-w-md shadow-2xl text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#0F2B5B] mx-auto" />
            <p className="text-sm text-gray-500">Verifying your reset link…</p>
            <p className="text-xs text-gray-400">
              If this takes too long, your link may have expired.{' '}
              <Link href="/forgot-password" className="text-[#0F2B5B] underline">
                Request a new one
              </Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2B5B] via-[#1a4178] to-[#0F2B5B] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#0F2B5B] to-[#F5A623] rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">TC</span>
          </div>
          <CardTitle className="text-2xl font-bold text-[#0F2B5B]">Set New Password</CardTitle>
          <CardDescription>Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && !passwordLongEnough && (
                <p className="text-xs text-red-500">Must be at least 8 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
              {confirm && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-green-600">Passwords match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#0F2B5B] hover:bg-[#1a4178] text-white font-semibold"
              disabled={loading || !passwordLongEnough || !passwordsMatch}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
