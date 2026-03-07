'use client'

import { useCallback, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const CATEGORIES = ['MOOD', 'GENRE', 'INSTRUMENT'] as const
type Category = typeof CATEGORIES[number]

type Tag = {
  id: string
  name: string
  category: Category
  created_at: string
}

const categoryColors: Record<Category, string> = {
  MOOD:       'bg-violet-500/20 text-violet-300 border-violet-500/30',
  GENRE:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  INSTRUMENT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition'

export default function AdminTagsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  // Add form state
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('MOOD')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchTags = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, category, created_at')
      .order('name', { ascending: true })
    if (error) console.error('Failed to fetch tags:', error.message)
    setTags(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTags() }, [fetchTags])

  // ── Add tag ────────────────────────────────────────────────────────────
  async function handleAdd() {
    setAddError(null)
    if (!newName.trim()) { setAddError('Tag name is required.'); return }

    // Check for duplicate within same category
    const exists = tags.some(
      t => t.name.toLowerCase() === newName.trim().toLowerCase() && t.category === newCategory
    )
    if (exists) { setAddError('This tag already exists in that category.'); return }

    setAdding(true)
    const { error } = await supabase
      .from('tags')
      .insert({ name: newName.trim(), category: newCategory })
    if (error) {
      setAddError(error.message)
      setAdding(false)
      return
    }
    setNewName('')
    await fetchTags()
    setAdding(false)
  }

  // ── Delete tag ─────────────────────────────────────────────────────────
  async function handleDelete(tag: Tag) {
    if (!confirm('Delete tag "' + tag.name + '"? This will remove it from all beats and samples.')) return
    setDeletingId(tag.id)
    const { error } = await supabase.from('tags').delete().eq('id', tag.id)
    if (error) console.error('Delete failed:', error.message)
    await fetchTags()
    setDeletingId(null)
  }

  const tagsByCategory = (cat: Category) => tags.filter(t => t.category === cat)

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Tags</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Organize beats and samples by mood, genre, and instrument.
        </p>
      </div>

      {/* Add tag form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-8">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Add Tag</p>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddError(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="e.g. Dark, Trap, Piano"
              className={inputCls}
            />
          </div>
          <div className="w-40">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Category)}
              className={inputCls}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-4 py-2 bg-white text-neutral-950 text-sm font-bold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? 'Adding…' : '+ Add'}
          </button>
        </div>
        {addError && (
          <p className="text-xs text-red-400 mt-2">{addError}</p>
        )}
      </div>

      {/* Tag sections */}
      {loading ? (
        <div className="text-neutral-600 text-sm text-center py-12">Loading tags…</div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{cat}</h2>
                <span className="text-xs text-neutral-700">{tagsByCategory(cat).length}</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              {tagsByCategory(cat).length === 0 ? (
                <p className="text-neutral-700 text-sm italic">No {cat.toLowerCase()} tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tagsByCategory(cat).map(tag => (
                    <div
                      key={tag.id}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${categoryColors[cat]}`}
                    >
                      <span>{tag.name}</span>
                      <button
                        onClick={() => handleDelete(tag)}
                        disabled={deletingId === tag.id}
                        className="ml-0.5 opacity-50 hover:opacity-100 transition leading-none"
                      >
                        {deletingId === tag.id ? '…' : '×'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
