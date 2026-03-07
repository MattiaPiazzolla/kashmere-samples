// app/admin/beats/_components/BeatRow.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAudioStore } from '@/store/audioStore'
import type { PlayerTrack } from '@/store/audioStore'

const TYPE_LABELS: Record<string, string> = {
    FULL_BEAT: 'Full Beat',
    LOOP: 'Loop',
    STEM: 'Stem',
    ONE_SHOT: 'One Shot',
}

const LICENSE_LABELS: Record<string, string> = {
    ROYALTY_FREE: 'Royalty Free',
    EXCLUSIVE: 'Exclusive',
}

export type BeatRow = {
    id: string
    title: string
    slug: string
    bpm: number | null
    key: string | null
    type: string
    license_type: string
    price_lease: number | null
    price_exclusive: number | null
    price_individual: number | null
    is_published: boolean
    is_deleted: boolean
    created_at: string
    cover_image_url: string | null
    filename_preview: string | null
    filename_secure: string | null
    stems_filename_secure: string | null
    has_stems: boolean
}

function toTrack(beat: BeatRow): PlayerTrack {
    return {
        id: beat.id,
        title: beat.title,
        slug: beat.slug,
        coverImageUrl: beat.cover_image_url
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${beat.cover_image_url}`
            : null,
        previewUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-previews/${beat.filename_preview}`,
        bpm: beat.bpm,
        key: beat.key,
        type: beat.type,
        licenseType: beat.license_type as 'ROYALTY_FREE' | 'EXCLUSIVE',
    }
}

export default function BeatRow({
    beat,
    allBeats,
    onDeleted,
    onEdit,
}: {
    beat: BeatRow
    allBeats: BeatRow[]
    onDeleted: (id: string) => void
    onEdit: (beat: BeatRow) => void
}) {
    const [published, setPublished] = useState(beat.is_published)
    const [toggling, setToggling] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const { currentTrack, isPlaying, play, pause, resume } = useAudioStore()
    const isThisTrack = currentTrack?.id === beat.id
    const isThisPlaying = isThisTrack && isPlaying

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    function handlePlay() {
        if (!beat.filename_preview) return

        if (isThisTrack) {
            isPlaying ? pause() : resume()
            return
        }

        // Build queue from all beats that have a preview file
        const queue = allBeats
            .filter(b => b.filename_preview)
            .map(toTrack)

        play(toTrack(beat), queue)
    }

    async function togglePublish() {
        setToggling(true)
        const next = !published
        setPublished(next)
        const { error } = await supabase
            .from('beats')
            .update({ is_published: next })
            .eq('id', beat.id)
        if (error) setPublished(!next)
        setToggling(false)
    }

    async function handleDelete() {
        if (!confirm(`Soft-delete "${beat.title}"? It won't appear in the store.`)) return
        setDeleting(true)
        const { error } = await supabase
            .from('beats')
            .update({ is_deleted: true, is_published: false })
            .eq('id', beat.id)
        if (!error) onDeleted(beat.id)
        else setDeleting(false)
    }

    return (
        <tr className={`hover:bg-neutral-900/50 transition ${isThisTrack ? 'bg-neutral-900/30' : ''}`}>

            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePlay}
                        disabled={!beat.filename_preview}
                        aria-label={isThisPlaying ? 'Pause' : 'Play preview'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${!beat.filename_preview
                                ? 'bg-neutral-800 text-neutral-700 cursor-not-allowed'
                                : isThisTrack
                                    ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                    >
                        {isThisPlaying ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                    <div className="min-w-0">
                        <p className="text-neutral-100 font-medium truncate max-w-[160px]">{beat.title}</p>
                        <p className="text-neutral-600 text-xs truncate max-w-[160px] font-mono">{beat.slug}</p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 text-neutral-400 text-sm">{TYPE_LABELS[beat.type] ?? beat.type}</td>
            <td className="px-4 py-3 text-neutral-400 text-sm">{beat.bpm ?? '—'}</td>
            <td className="px-4 py-3 text-neutral-400 text-sm">{beat.key ?? '—'}</td>

            <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${beat.license_type === 'EXCLUSIVE'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                    {LICENSE_LABELS[beat.license_type] ?? beat.license_type}
                </span>
            </td>

            <td className="px-4 py-3 text-neutral-400 text-xs space-y-0.5">
                {beat.price_lease != null && <div>Lease: ${beat.price_lease}</div>}
                {beat.price_exclusive != null && <div>Excl: ${beat.price_exclusive}</div>}
                {beat.price_individual != null && <div>Indiv: ${beat.price_individual}</div>}
                {beat.price_lease == null && beat.price_exclusive == null && beat.price_individual == null && (
                    <span className="text-neutral-600">—</span>
                )}
            </td>

            <td className="px-4 py-3">
                <button
                    onClick={togglePublish}
                    disabled={toggling}
                    className="flex items-center gap-2 disabled:opacity-40"
                >
                    <div className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${published ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${published ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className={`text-xs ${published ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {published ? 'Live' : 'Draft'}
                    </span>
                </button>
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => onEdit(beat)} className="text-xs text-neutral-400 hover:text-white transition">Edit</button>
                    <span className="text-neutral-700 text-xs">·</span>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-xs text-neutral-400 hover:text-red-400 transition disabled:opacity-40"
                    >
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </td>

        </tr>
    )
}