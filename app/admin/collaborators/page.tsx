'use client'

import { useCallback, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import CollaboratorForm, { CollaboratorData, extractStoragePath } from './_components/CollaboratorForm'

export default function AdminCollaboratorsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selected, setSelected] = useState<CollaboratorData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCollaborators = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('collaborators')
      .select('id, name, bio, avatar_url, default_split_percentage')
      .order('name', { ascending: true })
    if (error) console.error('Failed to fetch collaborators:', error.message)
    setCollaborators(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchCollaborators() }, [fetchCollaborators])

  async function handleDelete(c: CollaboratorData) {
    if (!confirm('Delete "' + c.name + '"? They will be removed from all pack credits.')) return
    setDeletingId(c.id)

    // Delete avatar from storage first
    if (c.avatar_url) {
      const path = extractStoragePath(c.avatar_url)
      if (path) {
        const { error } = await supabase.storage.from('covers').remove([path])
        if (error) console.error('Avatar storage delete failed:', error.message)
      }
    }

    const { error } = await supabase.from('collaborators').delete().eq('id', c.id)
    if (error) console.error('Delete failed:', error.message)
    await fetchCollaborators()
    setDeletingId(null)
  }

  function openCreate() { setSelected(null); setModalMode('create'); setModalOpen(true) }
  function openEdit(c: CollaboratorData) { setSelected(c); setModalMode('edit'); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setSelected(null) }
  function handleSuccess() { closeModal(); fetchCollaborators() }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Collaborators</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Credit collaborators on packs. For offline accounting only — they have no login access.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-white hover:bg-neutral-200 text-neutral-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + New Collaborator
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-600 text-sm text-center py-12">Loading…</div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-800 rounded-xl">
          <p className="text-neutral-600 text-sm">No collaborators yet.</p>
          <button
            onClick={openCreate}
            className="mt-3 text-sm text-neutral-400 hover:text-white transition underline underline-offset-2"
          >
            Add the first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collaborators.map(c => (
            <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.name} className="w-12 h-12 rounded-full object-cover border border-neutral-700 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-neutral-100 font-semibold text-sm truncate">{c.name}</p>
                  {c.default_split_percentage != null && (
                    <p className="text-xs text-neutral-500">{c.default_split_percentage}% default split</p>
                  )}
                </div>
              </div>
              {c.bio && (
                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{c.bio}</p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-1 border-t border-neutral-800">
                <button
                  onClick={() => openEdit(c)}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={deletingId === c.id}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50"
                >
                  {deletingId === c.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-neutral-100 text-lg font-semibold">
                {modalMode === 'create' ? 'New Collaborator' : 'Edit — ' + selected?.name}
              </h2>
              <button onClick={closeModal} className="text-neutral-500 hover:text-neutral-100 transition-colors text-xl leading-none">×</button>
            </div>
            <CollaboratorForm
              mode={modalMode}
              collaborator={selected}
              onSuccess={handleSuccess}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  )
}
