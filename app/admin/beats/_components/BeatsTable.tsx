// app/admin/beats/_components/BeatsTable.tsx
'use client'

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
    return (
        <div className="space-y-4">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-100">Beats</h1>
                    <p className="text-sm text-neutral-500 mt-1">{beats.length} active</p>
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
                            {beats.map(beat => (
                                <BeatRow
                                    key={beat.id}
                                    beat={beat}
                                    allBeats={beats}
                                    onDeleted={onBeatDeleted}
                                    onEdit={onBeatEdit}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    )
}