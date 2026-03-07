'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { BeatRow } from './BeatRow'

const TYPE_LABELS: Record<string, string> = {
    FULL_BEAT: 'Full Beat',
    LOOP: 'Loop',
    STEM: 'Stem',
    ONE_SHOT: 'One Shot',
}

export default function DeletedBeats({
    beats,
    onRestored,
}: {
    beats: BeatRow[]
    onRestored: (id: string) => void
}) {
    const [restoring, setRestoring] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function handleRestore(id: string) {
        setRestoring(id)
        const { error } = await supabase
            .from('beats')
            .update({ is_deleted: false })
            .eq('id', id)
        if (!error) onRestored(id)
        else setRestoring(null)
    }

    if (beats.length === 0) return null

    return (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                Deleted ({beats.length})
            </h2>

            <div className="rounded-xl border border-neutral-800 overflow-hidden opacity-60">
                <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-800">
                        {beats.map(beat => (
                            <tr key={beat.id} className="hover:bg-neutral-900/50 transition">
                                <td className="px-4 py-3">
                                    <p className="text-neutral-400 font-medium truncate max-w-[200px] line-through">
                                        {beat.title}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-neutral-600 text-xs">
                                    {TYPE_LABELS[beat.type] ?? beat.type}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleRestore(beat.id)}
                                        disabled={restoring === beat.id}
                                        className="text-xs text-neutral-500 hover:text-emerald-400 transition disabled:opacity-40"
                                    >
                                        {restoring === beat.id ? 'Restoring…' : 'Restore'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}