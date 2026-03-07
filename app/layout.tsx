import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'KashmereSamples',
    description: 'Premium beats, sample packs, and stems by Kashmere.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-neutral-950 text-white antialiased`}>
                {children}
            </body>
        </html>
    )
}