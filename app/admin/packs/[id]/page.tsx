'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import SamplesTable from './_components/SamplesTable'
import SampleModal from './_components/SampleModal'
import { Sample } from './_components/SampleRow'

type PackDetail = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  price_full: number
  license_type: 'ROYALTY_FREE' | 'EXCLUSIVE'
  is_published: boolean
  slug: string
}

type Collaborator = {
  collaborator_id: string
  role: string | null
  split_percentage: number | null
  collaborators: { name: string }
}

export default function PackDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [pack, setPack] = useState<PackDetail | null>(null)
  const [activeSamples, setActiveSamples] = useState<Sample[]>([])
  const [deletedSamples, setDeletedSamples] = useState<Sample[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'samples' | 'info'>('samples')
  const [deletedOpen, setDeletedOpen] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null)

  // ── Fetch pack ─────────────────────────────────────────────────────────
  const fetchPack = useCallback(async () => {
    const { data, error } = await supabase
      .from('packs')
      .select('id, title, description, cover_image_url, price_full, license_type, is_published, slug')
      .eq('id', id)
      .single()
    if (error) { console.error(error.message); return }
    setPack(data)
  }, [id, supabase])

  // ── Fetch samples via bridge table ─────────────────────────────────────
  // Query sample_packs for this pack, then join samples + their full pack list
  const fetchSamples = useCallback(async () => {
    const { data, error } = await supabase
      .from('sample_packs')
      .select(`
        samples (
          id, title, type, subtype, bpm, key, duration_sec,
          price_individual, has_midi, is_published, is_deleted,
          filename_preview, filename_secure, midi_filename_secure, created_at,
          sample_packs (
            pack_id,
            packs ( id, title )
          )
        )
      `)
      .eq('pack_id', id)
    if (error) { console.error(error.message); return }

    // Unwrap the nested samples from the join
    const samples = (data ?? [])
      .map((row: any) => row.samples)
      .filter(Boolean) as Sample[]

    setActiveSamples(samples.filter(s => !s.is_deleted))
    setDeletedSamples(samples.filter(s => s.is_deleted))
  }, [id, supabase])

  // ── Fetch collaborators ────────────────────────────────────────────────
  const fetchCollaborators = useCallback(async () => {
    const { data } = await supabase
      .from('packs_collaborators')
      .select('collaborator_id, role, split_percentage, collaborators(name)')
      .eq('pack_id', id)
    setCollaborators((data as any) ?? [])
  }, [id, supabase])

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      await Promise.all([fetchPack(), fetchSamples(), fetchCollaborators()])
      setLoading(false)
    }
    load()
  }, [fetchPack, fetchSamples, fetchCollaborators])

  // ── Modal helpers ──────────────────────────────────────────────────────
  function openCreate() {
    setSelectedSample(null)
    setModalMode('create')
    setModalOpen(true)
  }

  function openEdit(sample: Sample) {
    setSelectedSample(sample)
    setModalMode('edit')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedSample(null)
  }

  function handleMutate() {
    closeModal()
    fetchSamples()
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 text-neutral-600 text-sm text-center">Loading…</div>
    )
  }

  if (!pack) {
    return (
      <div className="p-6 text-neutral-600 text-sm text-center">Pack not found.</div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Back */}
      <button
        onClick={() => router.push('/admin/packs')}
        className="text-xs text-neutral-500 hover:text-neutral-300 transition mb-5 flex items-center gap-1"
      >
        ← Back to Packs
      </button>

      {/* Pack header */}
      <div className="flex items-center gap-5 mb-8">
        {pack.cover_image_url ? (
          <img
            src={pack.cover_image_url}
            alt={pack.title}
            className="w-20 h-20 rounded-xl object-cover border border-neutral-800 shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 text-xs shrink-0">
            No cover
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-white text-2xl font-bold truncate">{pack.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pack.license_type === 'EXCLUSIVE'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/20 text-blue-400'
              }`}>
              {pack.license_type === 'EXCLUSIVE' ? 'Exclusive' : 'Royalty Free'}
            </span>
            <span className="text-neutral-400 text-sm">${pack.price_full.toFixed(2)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${pack.is_published
                ? 'bg-green-600/20 text-green-400'
                : 'bg-neutral-800 text-neutral-500'
              }`}>
              {pack.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-800 mb-6">
        {(['samples', 'info'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${tab === t
                ? 'text-white border-white'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
          >
            {t === 'samples' ? `Samples (${activeSamples.length})` : 'Info'}
          </button>
        ))}
      </div>

      {/* ── Samples tab ── */}
      {tab === 'samples' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-neutral-500 text-sm">
              {activeSamples.length === 0
                ? 'No samples in this pack yet.'
                : `${activeSamples.length} sample${activeSamples.length !== 1 ? 's' : ''}`}
            </p>
            <button
              onClick={openCreate}
              className="bg-white hover:bg-neutral-200 text-neutral-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              + Add Sample
            </button>
          </div>

          <SamplesTable
            samples={activeSamples}
            onEdit={openEdit}
            onMutate={fetchSamples}
          />

          {/* Deleted samples */}
          {deletedSamples.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setDeletedOpen(prev => !prev)}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition mb-3"
              >
                <span className={`inline-block transition-transform text-xs ${deletedOpen ? 'rotate-90' : ''}`}>▶</span>
                Deleted Samples ({deletedSamples.length})
              </button>
              {deletedOpen && (
                <SamplesTable
                  samples={deletedSamples}
                  onEdit={() => { }}
                  onMutate={fetchSamples}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Info tab ── */}
      {tab === 'info' && (
        <div className="space-y-6 max-w-lg">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-neutral-300 text-sm leading-relaxed">
              {pack.description?.trim() || <span className="text-neutral-600 italic">No description.</span>}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Collaborators</p>
            {collaborators.length === 0 ? (
              <p className="text-neutral-600 text-sm italic">None assigned.</p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-neutral-200 font-medium">{c.collaborators?.name}</span>
                    {c.role && <span className="text-neutral-500">{c.role}</span>}
                    {c.split_percentage != null && (
                      <span className="text-neutral-600 text-xs">{c.split_percentage}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample modal */}
      {modalOpen && (
        <SampleModal
          mode={modalMode}
          sample={selectedSample}
          packId={id}
          onClose={closeModal}
          onMutate={handleMutate}
        />
      )}
    </div>
  )
}