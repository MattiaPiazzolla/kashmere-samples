// app/(main)/account/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AccountForm from './AccountForm'

export const metadata = {
    title: 'Account — Kashmere',
}

export default async function AccountPage() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/signin')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email')
        .eq('id', user.id)
        .single()

    return (
        <main className="max-w-xl mx-auto px-6 py-16">
            <h1 className="text-white text-2xl font-black tracking-tight mb-8">Account</h1>
            <AccountForm
                userId={user.id}
                initialName={profile?.full_name ?? ''}
                email={profile?.email ?? user.email ?? ''}
                avatarUrl={profile?.avatar_url ?? null}
            />
        </main>
    )
}