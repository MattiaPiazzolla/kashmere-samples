'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

function WaveformBar({ delay }: { delay: number }) {
    return (
        <span
            className="inline-block w-px bg-neutral-600 rounded-full"
            style={{
                height: '12px',
                animation: `waveform 1.4s ease-in-out infinite`,
                animationDelay: `${delay}s`,
            }}
        />
    )
}

const socialLinks = [
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/kashmere.samples',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
        ),
    },
    {
        label: 'YouTube',
        href: 'https://www.youtube.com/kashmere.samples',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
    {
        label: 'TikTok',
        href: 'https://www.tiktok.com/@kashmere.samples',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
            </svg>
        ),
    },
]

export default function Footer() {
    return (
        <footer className="border-t border-neutral-800/60 bg-neutral-950 px-6 py-16 mt-24">
            <style>{`
                @keyframes waveform {
                    0%, 100% { transform: scaleY(0.3); opacity: 0.3; }
                    50% { transform: scaleY(1); opacity: 0.8; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .footer-col {
                    animation: fadeUp 0.6s ease forwards;
                    opacity: 0;
                }
                .footer-col:nth-child(1) { animation-delay: 0.05s; }
                .footer-col:nth-child(2) { animation-delay: 0.15s; }
                .footer-col:nth-child(3) { animation-delay: 0.25s; }
                .footer-col:nth-child(4) { animation-delay: 0.35s; }
                .social-link svg {
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .social-link:hover svg {
                    transform: scale(1.25);
                }
                .nav-link {
                    position: relative;
                }
                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 0;
                    height: 1px;
                    background: rgba(255,255,255,0.4);
                    transition: width 0.3s ease;
                }
                .nav-link:hover::after {
                    width: 100%;
                }
            `}</style>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* BRAND */}
                    <div className="footer-col">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-white font-black text-lg tracking-tighter">KASHMERE</span>
                            {/* Waveform animation */}
                            <div className="flex items-end gap-[3px] h-4">
                                {[0, 0.2, 0.1, 0.3, 0.15, 0.05, 0.25].map((d, i) => (
                                    <WaveformBar key={i} delay={d} />
                                ))}
                            </div>
                        </div>
                        <p className="text-neutral-500 text-xs leading-relaxed max-w-[180px]">
                            Premium beats, sample packs, and stems for producers who move different.
                        </p>
                    </div>

                    {/* INFO */}
                    <div className="footer-col">
                        <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mb-5">Info</p>
                        <ul className="space-y-3">
                            {[
                                { label: 'About', href: '/about' },
                                { label: 'Terms of Use', href: '/terms' },
                                { label: 'Privacy Policy', href: '/privacy' },
                            ].map(({ label, href }) => (
                                <li key={href}>
                                    <Link href={href} className="nav-link text-neutral-500 hover:text-white text-sm transition-colors duration-200">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SHOP */}
                    <div className="footer-col">
                        <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mb-5">Shop</p>
                        <ul className="space-y-3">
                            {[
                                { label: 'Beats', href: '/beats' },
                                { label: 'Sample Packs', href: '/packs' },
                                { label: 'Licensing Info', href: '/licensing' },
                            ].map(({ label, href }) => (
                                <li key={href}>
                                    <Link href={href} className="nav-link text-neutral-500 hover:text-white text-sm transition-colors duration-200">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SOCIAL */}
                    <div className="footer-col">
                        <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mb-5">Social</p>
                        <ul className="space-y-3">
                            {socialLinks.map(({ label, href, icon }) => (
                                <li key={label}>
                                    <Link
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="social-link flex items-center gap-2.5 text-neutral-500 hover:text-white text-sm transition-colors duration-200"
                                    >
                                        {icon}
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* BOTTOM BAR */}
                <div className="border-t border-neutral-800/50 mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-neutral-700 text-[11px] tracking-wide">
                        © {new Date().getFullYear()} KashmereSamples — All rights reserved.
                    </p>
                    <p className="text-neutral-800 text-[11px] tracking-wider uppercase">
                        Made for producers
                    </p>
                </div>
            </div>
        </footer>
    )
}