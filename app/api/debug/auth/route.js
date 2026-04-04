import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ 
        status: 'auth_error',
        error: authError.message,
        user: null 
      })
    }

    if (!user) {
      return NextResponse.json({ 
        status: 'no_user',
        message: 'No authenticated user found',
        user: null 
      })
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      status: 'success',
      auth_user: {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role
      },
      profile_exists: !profileError,
      profile: profile,
      profile_error: profileError?.message
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 })
  }
}
