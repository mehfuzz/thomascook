'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2B5B] via-[#1a4178] to-[#0F2B5B] p-4">
        <Card className="w-full max-w-md shadow-2xl text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
            <p className="text-gray-500 text-sm">
              We sent a password reset link to <span className="font-medium text-gray-700">{email}</span>.
              The link expires in 1 hour.
            </p>
            <p className="text-xs text-gray-400">
              Didn't receive it? Check your spam folder or{' '}
              <button
                className="text-[#0F2B5B] underline"
                onClick={() => setSent(false)}
              >
                try again
              </button>.
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-2 w-full">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
              </Button>
            </Link>
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
          <CardTitle className="text-2xl font-bold text-[#0F2B5B]">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="gm@thomascook.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#0F2B5B] hover:bg-[#1a4178] text-white font-semibold"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-[#0F2B5B] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
