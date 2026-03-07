'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import BeatsTable from './_components/BeatsTable'
import DeletedBeats from './_components/DeletedBeats'
import BeatModal from './_components/BeatModal'
import type { BeatRow } from './_components/BeatRow'
import type { BeatInitialData } from './_components/BeatForm'

export default function AdminBeatsPage() {
    const [beats, setBeats] = useState<BeatRow[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<BeatInitialData | undefined>(undefined)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchBeats = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('beats')
            .select(`
        id, title, slug, bpm, key, type, license_type,
        price_lease, price_exclusive, price_individual,
        is_published, is_deleted, created_at,
        cover_image_url, filename_preview, filename_secure,
        stems_filename_secure, has_stems
      `)
            .order('created_at', { ascending: false })
        setBeats(data ?? [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchBeats() }, [fetchBeats])

    function handleNewBeat() {
        setEditTarget(undefined)
        setModalOpen(true)
    }

    async function handleEditBeat(beat: BeatRow) {
        // Resolve cover public URL
        const coverUrl = beat.cover_image_url
            ? supabase.storage.from('covers').getPublicUrl(beat.cover_image_url).data.publicUrl
            : null

        // Resolve signed URLs for audio files
        const [mp3Result, wavResult] = await Promise.all([
            beat.filename_preview
                ? supabase.storage.from('public-previews').createSignedUrl(beat.filename_preview, 3600)
                : Promise.resolve({ data: null }),
            beat.filename_secure
                ? supabase.storage.from('secure-assets').createSignedUrl(beat.filename_secure, 3600)
                : Promise.resolve({ data: null }),
        ])

        setEditTarget({
            id: beat.id,
            title: beat.title,
            slug: beat.slug,
            bpm: beat.bpm,
            key: beat.key,
            type: beat.type as BeatInitialData['type'],
            license_type: beat.license_type as BeatInitialData['license_type'],
            price_lease: beat.price_lease,
            price_exclusive: beat.price_exclusive,
            price_individual: beat.price_individual,
            has_stems: beat.has_stems,
            cover_image_url: beat.cover_image_url,
            filename_preview: beat.filename_preview,
            filename_secure: beat.filename_secure,
            stems_filename_secure: beat.stems_filename_secure,
            preview_cover_url: coverUrl,
            preview_mp3_url: mp3Result.data?.signedUrl ?? null,
            preview_wav_url: wavResult.data?.signedUrl ?? null,
        })
        setModalOpen(true)
    }

    function handleBeatDeleted(id: string) {
        setBeats(prev =>
            prev.map(b => b.id === id ? { ...b, is_deleted: true, is_published: false } : b)
        )
    }

    function handleBeatRestored(id: string) {
        setBeats(prev =>
            prev.map(b => b.id === id ? { ...b, is_deleted: false } : b)
        )
    }

    function handleSuccess() {
        setModalOpen(false)
        setEditTarget(undefined)
        fetchBeats()
    }

    function handleClose() {
        setModalOpen(false)
        setEditTarget(undefined)
    }

    const active = beats.filter(b => !b.is_deleted)
    const deleted = beats.filter(b => b.is_deleted)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <p className="text-neutral-500 text-sm">Loading beats…</p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-8">
                <BeatsTable
                    beats={active}
                    onNewBeat={handleNewBeat}
                    onBeatDeleted={handleBeatDeleted}
                    onBeatEdit={handleEditBeat}
                />
                <DeletedBeats
                    beats={deleted}
                    onRestored={handleBeatRestored}
                />
            </div>

            <BeatModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                initialData={editTarget}
            />
        </>
    )
}