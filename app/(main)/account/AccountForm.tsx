// app/(main)/account/AccountForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface Props {
    userId: string
    initialName: string
    email: string
    avatarUrl: string | null
}

export default function AccountForm({ userId, initialName, email, avatarUrl }: Props) {
    const [fullName, setFullName] = useState(initialName)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    function getInitials(name: string, fallback: string): string {
        const n = name.trim()
        if (!n) return fallback[0]?.toUpperCase() ?? '?'
        const parts = n.split(' ')
        return parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : parts[0][0].toUpperCase()
    }

    async function handleSave() {
        setSaving(true)
        setError(null)
        setSaved(false)

        const { error: err } = await supabase
            .from('profiles')
            .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
            .eq('id', userId)

        setSaving(false)

        if (err) {
            setError('Failed to save. Please try again.')
            return
        }

        setSaved(true)
        router.refresh()
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const initials = getInitials(fullName, email)

    return (
        <div className="flex flex-col gap-8">

            {/* AVATAR + EMAIL */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-neutral-700 shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white text-xl font-bold">{initials}</span>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{fullName || '—'}</p>
                    <p className="text-neutral-400 text-sm truncate">{email}</p>
                </div>
            </div>

            {/* DISPLAY NAME */}
            <div className="flex flex-col gap-2">
                <label className="text-neutral-400 text-xs font-semibold uppercase tracking-widest">
                    Display Name
                </label>
                <input
                    type="text"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setSaved(false) }}
                    placeholder="Your name"
                    className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition"
                />
            </div>

            {/* EMAIL (read-only) */}
            <div className="flex flex-col gap-2">
                <label className="text-neutral-400 text-xs font-semibold uppercase tracking-widest">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    disabled
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-500 text-sm cursor-not-allowed"
                />
                <p className="text-neutral-600 text-xs">Email cannot be changed here.</p>
            </div>

            {/* SAVE */}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {saved && <p className="text-green-400 text-sm">Changes saved.</p>}

            <button
                onClick={handleSave}
                disabled={saving || fullName.trim() === initialName}
                className="bg-white text-black text-sm font-bold px-6 py-3 rounded-full hover:bg-neutral-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {saving ? 'Saving…' : 'Save Changes'}
            </button>

            {/* DIVIDER */}
            <div className="border-t border-neutral-800 pt-6 flex flex-col gap-4">

                {/* Purchase history — Phase 3 */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white text-sm font-semibold">Purchase History</p>
                        <p className="text-neutral-500 text-xs">View your past orders and downloads</p>
                    </div>
                    <Link
                        href="/library"
                        className="text-sm text-neutral-400 hover:text-white border border-neutral-700 px-4 py-1.5 rounded-full transition"
                    >
                        My Library
                    </Link>
                </div>

                {/* Sign out */}
                <button
                    onClick={handleSignOut}
                    className="text-left text-sm text-red-400 hover:text-red-300 transition"
                >
                    Sign Out
                </button>

            </div>
        </div>
    )
}