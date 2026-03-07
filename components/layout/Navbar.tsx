'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import CartButton from "@/components/cart/CartButton"

function WaveformBar({ delay }: { delay: number }) {
    return (
        <span
            className="inline-block w-px bg-neutral-500 rounded-full"
            style={{
                height: '10px',
                animation: `waveform 1.4s ease-in-out infinite`,
                animationDelay: `${delay}s`,
            }}
        />
    )
}

const NAV_LINKS = [
    { label: 'Beats', href: '/beats' },
    { label: 'Packs', href: '/packs' },
    { label: 'Licensing', href: '/licensing' },
    { label: 'About', href: '/about' },
]

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchIsAdmin(session.user.id)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchIsAdmin(session.user.id)
            else setIsAdmin(false)
        })
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    async function fetchIsAdmin(userId: string) {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
        setIsAdmin(data?.is_admin ?? false)
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    async function handleSignOut() {
        await supabase.auth.signOut()
        setDropdownOpen(false)
        setMenuOpen(false)
        setIsAdmin(false)
        router.push('/')
        router.refresh()
    }

    function getInitials(user: User): string {
        const name = user.user_metadata?.full_name as string | undefined
        if (name) {
            const parts = name.trim().split(' ')
            return parts.length >= 2
                ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                : parts[0][0].toUpperCase()
        }
        return (user.email?.[0] ?? '?').toUpperCase()
    }

    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
    const initials = user ? getInitials(user) : ''

    return (
        <>
            <style>{`
                @keyframes waveform {
                    0%, 100% { transform: scaleY(0.3); opacity: 0.3; }
                    50% { transform: scaleY(1); opacity: 0.9; }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .nav-link {
                    position: relative;
                }
                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 0;
                    height: 1px;
                    background: rgba(255,255,255,0.5);
                    transition: width 0.3s ease;
                }
                .nav-link:hover::after { width: 100%; }
                .dropdown-panel {
                    animation: slideDown 0.2s ease forwards;
                }
                .mobile-menu {
                    animation: slideDown 0.25s ease forwards;
                }
                .avatar-btn {
                    transition: box-shadow 0.2s ease, transform 0.2s ease;
                }
                .avatar-btn:hover {
                    box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
                    transform: scale(1.05);
                }
            `}</style>

            <nav className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
                ? 'bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 shadow-[0_1px_20px_rgba(0,0,0,0.4)]'
                : 'bg-neutral-950/80 backdrop-blur border-b border-neutral-800/40'
                }`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                    {/* LOGO */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <span className="text-white font-black text-lg tracking-tighter transition-opacity duration-200 group-hover:opacity-70">
                            KASHMERE
                        </span>
                        <div className="flex items-end gap-[3px] h-3.5">
                            {[0, 0.2, 0.1, 0.3, 0.15].map((d, i) => (
                                <WaveformBar key={i} delay={d} />
                            ))}
                        </div>
                    </Link>

                    {/* DESKTOP NAV */}
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map(({ label, href }) => (
                            <Link
                                key={href}
                                href={href}
                                className="nav-link text-neutral-400 hover:text-white text-sm transition-colors duration-200"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* DESKTOP ACTIONS */}
                    <div className="hidden md:flex items-center gap-3">
                        <CartButton />

                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    aria-label="Account menu"
                                    className="avatar-btn w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 focus:outline-none"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-[11px] font-bold">{initials}</span>
                                    )}
                                </button>

                                {dropdownOpen && (
                                    <div className="dropdown-panel absolute right-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-sm border border-neutral-800/80 rounded-xl shadow-2xl overflow-hidden">
                                        <div className="px-4 py-3 border-b border-neutral-800/80">
                                            <p className="text-white text-xs font-semibold truncate">
                                                {(user.user_metadata?.full_name as string) ?? 'Account'}
                                            </p>
                                            <p className="text-neutral-600 text-[11px] truncate mt-0.5">{user.email}</p>
                                        </div>

                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-neutral-800/60 transition border-b border-neutral-800/60"
                                            >
                                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Admin Panel
                                            </Link>
                                        )}

                                        {[
                                            { label: 'My Library', href: '/library' },
                                            { label: 'Account', href: '/account' },
                                        ].map(({ label, href }) => (
                                            <Link
                                                key={href}
                                                href={href}
                                                onClick={() => setDropdownOpen(false)}
                                                className="block px-4 py-2.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition"
                                            >
                                                {label}
                                            </Link>
                                        ))}

                                        <div className="border-t border-neutral-800/60">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left px-4 py-2.5 text-xs text-red-400/80 hover:text-red-300 hover:bg-neutral-800/60 transition"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="text-xs font-semibold text-white border border-neutral-700/80 px-4 py-1.5 rounded-full hover:bg-neutral-800/70 hover:border-neutral-600 transition-all duration-200"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* MOBILE MENU BUTTON */}
                    <button
                        className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800/70 transition"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <div className="relative w-4 h-3 flex flex-col justify-between">
                            <span className={`block h-px bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
                            <span className={`block h-px bg-white rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                            <span className={`block h-px bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
                        </div>
                    </button>
                </div>

                {/* MOBILE MENU */}
                {menuOpen && (
                    <div className="mobile-menu md:hidden border-t border-neutral-800/60 bg-neutral-950/98 backdrop-blur-md px-6 py-5 flex flex-col gap-1">
                        {NAV_LINKS.map(({ label, href }) => (
                            <Link
                                key={href}
                                href={href}
                                className="text-neutral-400 hover:text-white text-sm py-2 transition-colors duration-200"
                                onClick={() => setMenuOpen(false)}
                            >
                                {label}
                            </Link>
                        ))}

                        <div className="border-t border-neutral-800/60 mt-3 pt-4 flex flex-col gap-3">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 shrink-0">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white text-[11px] font-bold">{initials}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white text-xs font-semibold truncate">
                                                {(user.user_metadata?.full_name as string) ?? 'Account'}
                                            </p>
                                            <p className="text-neutral-600 text-[11px] truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <Link href="/admin" className="text-xs text-amber-400 hover:text-amber-300 transition py-1" onClick={() => setMenuOpen(false)}>
                                            ⚙ Admin Panel
                                        </Link>
                                    )}
                                    <Link href="/library" className="text-neutral-400 hover:text-white text-sm py-1 transition-colors" onClick={() => setMenuOpen(false)}>My Library</Link>
                                    <Link href="/account" className="text-neutral-400 hover:text-white text-sm py-1 transition-colors" onClick={() => setMenuOpen(false)}>Account</Link>
                                    <button onClick={handleSignOut} className="text-left text-xs text-red-400/80 hover:text-red-300 transition pt-1">
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/auth/signin"
                                    className="text-xs font-semibold text-white border border-neutral-700/80 px-4 py-2 rounded-full hover:bg-neutral-800/70 transition inline-block w-fit"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}