import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Redirect to /home after successful auth
  const homePath = '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // No proxy/lb in development
        return NextResponse.redirect(`${origin}${homePath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${homePath}`)
      } else {
        return NextResponse.redirect(`${origin}${homePath}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}