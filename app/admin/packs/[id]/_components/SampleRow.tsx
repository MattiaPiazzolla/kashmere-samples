// app/admin/packs/[id]/_components/SampleRow.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export type Sample = {
  id: string
  title: string
  type: 'LOOP' | 'ONE_SHOT' | 'STEM'
  subtype: 'DRUMS' | 'MELODY' | 'BASS' | 'FX' | 'OTHER'
  bpm: number | null
  key: string | null
  duration_sec: number | null
  price_individual: number | null
  has_midi: boolean
  is_published: boolean
  is_deleted: boolean
  filename_preview: string | null
  filename_secure: string | null
  midi_filename_secure: string | null
  created_at: string
  // Bridge table join — array of packs this sample belongs to
  sample_packs: { pack_id: string; packs: { id: string; title: string } }[]
}

type SampleRowProps = {
  sample: Sample
  onEdit: (sample: Sample) => void
  onMutate: () => void
}

export default function SampleRow({ sample, onEdit, onMutate }: SampleRowProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loadingPublish, setLoadingPublish] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  async function handlePublishToggle() {
    setLoadingPublish(true)
    const { error } = await supabase
      .from('samples')
      .update({ is_published: !sample.is_published })
      .eq('id', sample.id)
    if (error) console.error('Publish toggle failed:', error.message)
    onMutate()
    setLoadingPublish(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${sample.title}"? It can be restored later.`)) return
    setLoadingDelete(true)
    const { error } = await supabase
      .from('samples')
      .update({ is_deleted: true, is_published: false })
      .eq('id', sample.id)
    if (error) console.error('Delete failed:', error.message)
    onMutate()
    setLoadingDelete(false)
  }

  async function handleRestore() {
    setLoadingDelete(true)
    const { error } = await supabase
      .from('samples')
      .update({ is_deleted: false })
      .eq('id', sample.id)
    if (error) console.error('Restore failed:', error.message)
    onMutate()
    setLoadingDelete(false)
  }

  const isDeleted = sample.is_deleted

  // Derive pack names from the bridge join
  const packNames = sample.sample_packs?.map((sp) => sp.packs?.title).filter(Boolean) ?? []

  return (
    <tr className={`border-b border-neutral-800 text-sm ${isDeleted ? 'opacity-50' : ''}`}>
      <td className="py-3 px-4 text-neutral-100 font-medium">{sample.title}</td>

      {/* Packs column */}
      <td className="py-3 px-4">
        {packNames.length === 0 ? (
          <span className="text-xs text-neutral-600">No pack</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {packNames.map((name) => (
              <span
                key={name}
                className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </td>

      <td className="py-3 px-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-neutral-300">{sample.type}</span>
          <span className="text-xs text-neutral-600">{sample.subtype}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-neutral-400">{sample.bpm ? `${sample.bpm} BPM` : '—'}</span>
          <span className="text-xs text-neutral-600">{sample.key ?? '—'}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-neutral-400 text-xs">
        {sample.price_individual != null ? `$${sample.price_individual.toFixed(2)}` : 'Pack only'}
      </td>
      <td className="py-3 px-4">
        {sample.has_midi && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-medium">
            MIDI
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {!isDeleted ? (
            <>
              <button
                onClick={handlePublishToggle}
                disabled={loadingPublish}
                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${sample.is_published
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
              >
                {loadingPublish ? '...' : sample.is_published ? 'Published' : 'Draft'}
              </button>
              <button
                onClick={() => onEdit(sample)}
                className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
              >
                {loadingDelete ? '...' : 'Delete'}
              </button>
            </>
          ) : (
            <button
              onClick={handleRestore}
              disabled={loadingDelete}
              className="text-xs px-2 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors"
            >
              {loadingDelete ? '...' : 'Restore'}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}