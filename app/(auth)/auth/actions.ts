'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const getURL = () => {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000'
  return url.startsWith('http') ? url : `https://${url}`
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getURL()}/auth/callback`,
    },
  })
  if (error) redirect('/auth/signin?error=Could not sign in with Google.')
  if (data.url) redirect(data.url)
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/auth/signin?error=${encodeURIComponent(error.message)}`)
  redirect('/')
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${getURL()}/auth/callback`,
    },
  })

  if (error) redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)
  redirect('/auth/verify')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}