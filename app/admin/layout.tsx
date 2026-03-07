import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GlobalPlayer from '@/components/player/GlobalPlayer'

const navItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Beats', href: '/admin/beats' },
    { label: 'Packs', href: '/admin/packs' },
    { label: 'Samples', href: '/admin/samples' },
    { label: 'Tags', href: '/admin/tags' },
    { label: 'Collaborators', href: '/admin/collaborators' },
    { label: 'Orders', href: '/admin/orders' },
]

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/')

    return (
        <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 border-r border-neutral-800 flex flex-col">
                <div className="px-6 py-5 border-b border-neutral-800">
                    <span className="text-sm font-semibold tracking-widest uppercase text-neutral-400">
                        Kashmere
                    </span>
                    <p className="text-xs text-neutral-600 mt-0.5">Admin Panel</p>
                </div>

                <nav className="flex-1 py-4">
                    <ul className="space-y-0.5 px-3">
                        {navItems.map(({ label, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className="block px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="px-6 py-4 border-t border-neutral-800">
                    <Link
                        href="/"
                        className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                        ← Back to store
                    </Link>
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto px-8 py-8">
                {children}
            </main>
            <GlobalPlayer />
        </div>
    )
}