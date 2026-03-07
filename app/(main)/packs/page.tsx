import { createClient } from '@/lib/supabase/server'

export default async function PacksPage() {
    const supabase = await createClient()

    const { data: packs } = await supabase
        .from('packs')
        .select('id, title, slug, cover_image_url, description, price_full, license_type')
        .eq('is_published', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    return (
        <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">

            {/* PAGE HEADER */}
            <div className="mb-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">Sample Packs</h1>
                <p className="text-neutral-400">Complete packs with samples, loops, and stems ready to flip.</p>
            </div>

            {/* FILTERS — static UI for now, wired in Phase 3 */}
            <div className="flex flex-wrap gap-3 mb-10">
                <select className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none">
                    <option value="">All Licenses</option>
                    <option value="ROYALTY_FREE">Royalty Free</option>
                    <option value="EXCLUSIVE">Exclusive</option>
                </select>

                <select className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none">
                    <option value="">Sort: Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>

            {/* PACKS GRID */}
            {!packs || packs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <p className="text-neutral-500 text-lg mb-2">No packs available yet.</p>
                    <p className="text-neutral-600 text-sm">Check back soon — new packs dropping regularly.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {packs.map((pack) => (
                        <a key={pack.id} href={`/packs/${pack.slug}`} className="bg-neutral-900 rounded-xl p-4 hover:bg-neutral-800 transition group">

                            {/* COVER */}
                            <div className="w-full aspect-square bg-neutral-800 rounded-lg mb-4 overflow-hidden relative">
                                {pack.cover_image_url ? (
                                    <img src={pack.cover_image_url} alt={pack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">
                                        No Cover
                                    </div>
                                )}
                            </div>

                            {/* INFO */}
                            <h3 className="font-semibold text-white truncate">{pack.title}</h3>

                            {pack.description && (
                                <p className="text-neutral-500 text-sm mt-1 line-clamp-2">{pack.description}</p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-700 text-neutral-300">
                                    {pack.license_type === 'EXCLUSIVE' ? 'Exclusive' : 'Royalty Free'}
                                </span>
                                <span className="text-white font-bold text-sm">
                                    ${pack.price_full}
                                </span>
                            </div>

                        </a>
                    ))}
                </div>
            )}

        </main>
    )
}