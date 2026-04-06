// app/admin/beats/_components/BeatsTable.tsx
'use client'

import { useMemo, useState } from 'react'
import BeatRow from './BeatRow'
import type { BeatRow as BeatRowType } from './BeatRow'

export default function BeatsTable({
    beats,
    onNewBeat,
    onBeatDeleted,
    onBeatEdit,
}: {
    beats: BeatRowType[]
    onNewBeat: () => void
    onBeatDeleted: (id: string) => void
    onBeatEdit: (beat: BeatRowType) => void
}) {
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')

    const filteredBeats = useMemo(() => {
        const q = query.trim().toLowerCase()
        return beats.filter((beat) => {
            const matchesQuery =
                q.length === 0 ||
                beat.title.toLowerCase().includes(q) ||
                beat.slug.toLowerCase().includes(q) ||
                (beat.key ?? '').toLowerCase().includes(q) ||
                beat.type.toLowerCase().includes(q) ||
                beat.license_type.toLowerCase().includes(q) ||
                (beat.search_tags ?? []).some((tag) => tag.toLowerCase().includes(q))

            const matchesStatus =
                status === 'all' || (status === 'published' ? beat.is_published : !beat.is_published)

            return matchesQuery && matchesStatus
        })
    }, [beats, query, status])

    return (
        <div className="space-y-4">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-100">Beats</h1>
                    <p className="text-sm text-neutral-500 mt-1">{filteredBeats.length} of {beats.length} active</p>
                </div>
                <button
                    onClick={onNewBeat}
                    className="px-4 py-2 bg-white text-neutral-950 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition"
                >
                    + New Beat
                </button>
            </div>

            {beats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-700 px-8 py-16 text-center">
                    <p className="text-neutral-500 text-sm">No beats yet.</p>
                    <button
                        onClick={onNewBeat}
                        className="mt-4 inline-block text-sm text-white underline underline-offset-4 hover:text-neutral-300 transition"
                    >
                        Create your first beat
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by title, slug, key, type, license, or tags..."
                            className="w-full sm:max-w-md rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/40"
                        />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'all' | 'published' | 'draft')}
                            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500/40"
                        >
                            <option value="all">All statuses</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>

                    <div className="rounded-xl border border-neutral-800 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Title</th>
                                    <th className="px-4 py-3 text-left">Type</th>
                                    <th className="px-4 py-3 text-left">BPM</th>
                                    <th className="px-4 py-3 text-left">Key</th>
                                    <th className="px-4 py-3 text-left">License</th>
                                    <th className="px-4 py-3 text-left">Pricing</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {filteredBeats.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-neutral-500">
                                            No beats match your search/filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBeats.map(beat => (
                                        <BeatRow
                                            key={beat.id}
                                            beat={beat}
                                            allBeats={filteredBeats}
                                            onDeleted={onBeatDeleted}
                                            onEdit={onBeatEdit}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    )
}