import { createClient } from '@/lib/supabase/server'
import BeatRow from '@/components/beats/BeatRow'
import type { BeatCardData } from '@/components/beats/BeatCard'
import Link from 'next/link'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const COVERS_BASE = `${SUPABASE_URL}/storage/v1/object/public/covers`
const PREVIEWS_BASE = `${SUPABASE_URL}/storage/v1/object/public/public-previews`

function coverUrl(filename: string | null): string | null {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  return `${COVERS_BASE}/${filename}`
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: rawBeats } = await supabase
    .from('beats')
    .select('id, title, slug, cover_image_url, bpm, key, type, price_lease, price_exclusive, price_individual, license_type, filename_preview')
    .eq('is_published', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: packs } = await supabase
    .from('packs')
    .select('id, title, slug, cover_image_url, price_full, license_type')
    .eq('is_published', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(4)

  // Normalise cover URLs for beats
  const beats: BeatCardData[] = (rawBeats ?? []).map((b) => ({
    ...b,
    cover_image_url: coverUrl(b.cover_image_url),
  }))

  return (
    <main className="min-h-screen">

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 bg-neutral-950">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
          KASHMERE
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-xl mb-8">
          Premium beats, sample packs, and stems. Built for producers who move different.
        </p>
        <div className="flex gap-4">
          <Link
            href="/beats"
            className="bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-neutral-200 transition"
          >
            Browse Beats
          </Link>
          <Link
            href="/packs"
            className="border border-white text-white font-bold px-6 py-3 rounded-full hover:bg-white hover:text-black transition"
          >
            Browse Packs
          </Link>
        </div>
      </section>

      {/* FEATURED BEATS */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Beats</h2>
          <Link href="/beats" className="text-sm text-zinc-400 hover:text-white transition-colors">
            View all →
          </Link>
        </div>

        {beats.length === 0 ? (
          <p className="text-neutral-500">No beats available yet. Check back soon.</p>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60">
            {beats.map((beat, i) => (
              <BeatRow
                key={beat.id}
                beat={beat}
                allBeats={beats}
                previewBaseUrl={PREVIEWS_BASE}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* FEATURED PACKS */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Packs</h2>
          <Link href="/packs" className="text-sm text-zinc-400 hover:text-white transition-colors">
            View all →
          </Link>
        </div>

        {!packs || packs.length === 0 ? (
          <p className="text-neutral-500">No packs available yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packs.map((pack) => (
              <Link
                key={pack.id}
                href={`/packs/${pack.slug}`}
                className="bg-neutral-900 rounded-xl p-4 hover:bg-neutral-800 transition group"
              >
                <div className="w-full aspect-square bg-neutral-800 rounded-lg mb-4 overflow-hidden">
                  {pack.cover_image_url ? (
                    <img
                      src={coverUrl(pack.cover_image_url) ?? ''}
                      alt={pack.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">
                      No Cover
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-white truncate">{pack.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-700 text-neutral-300">
                    {pack.license_type === 'EXCLUSIVE' ? 'Exclusive' : 'Royalty Free'}
                  </span>
                  <span className="text-white font-bold text-sm">
                    ${Number(pack.price_full).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </main>
  )
}