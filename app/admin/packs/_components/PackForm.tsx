'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

import { Pack } from './PackRow'

// ── Types ──────────────────────────────────────────────────────────────────
type Collaborator = {
  id: string
  name: string
}

type CollaboratorAssignment = {
  collaborator_id: string
  role: string
  split_percentage: string
}

type PackFormProps = {
  mode: 'create' | 'edit'
  pack?: Pack | null
  onSuccess: () => void
  onCancel: () => void
}

// ── Styles (match BeatForm exactly) ───────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition'
const labelCls =
  'block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1'

// ── Slug helper ────────────────────────────────────────────────────────────
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── UploadState ────────────────────────────────────────────────────────────
type UploadState = {
  file: File | null
  existingPath: string | null
  existingUrl: string | null
  uploading: boolean
  path: string | null
  error: string | null
  localUrl: string | null
}

function makeExistingUpload(
  existingPath: string | null,
  existingUrl: string | null = null
): UploadState {
  return {
    file: null,
    existingPath,
    existingUrl,
    uploading: false,
    path: null,
    error: null,
    localUrl: null,
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── FileField (identical pattern to BeatForm) ─────────────────────────────
type FileFieldProps = {
  label: string
  accept: string
  hint?: string
  kind: 'image'
  state: UploadState
  inputRef: React.RefObject<HTMLInputElement | null>
  setter: React.Dispatch<React.SetStateAction<UploadState>>
  required?: boolean
}

function FileField({ label, accept, hint, kind, state, inputRef, setter, required }: FileFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null

    if (state.localUrl) URL.revokeObjectURL(state.localUrl)

    if (!file) {
      setter(prev => ({ ...prev, file: null, localUrl: null, path: null, error: null }))
      return
    }

    const localUrl = URL.createObjectURL(file)
    setter(prev => ({ ...prev, file, localUrl, path: null, error: null }))
  }

  function handleRemove() {
    if (state.localUrl) URL.revokeObjectURL(state.localUrl)
    setter(prev => ({ ...prev, file: null, localUrl: null, path: null, error: null }))
    if (inputRef.current) inputRef.current.value = ''
  }

  const hasNewFile = !!state.file
  const hasExisting = !state.file && !!state.existingPath
  const isEmpty = !state.file && !state.existingPath
  const existingName = state.existingPath?.split('/').pop() ?? ''

  const StatusIcon = () => {
    if (state.uploading) {
      return (
        <svg className="w-3 h-3 text-neutral-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )
    }

    if (state.path || hasExisting) {
      return (
        <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )
    }

    return (
      <svg className="w-3 h-3 text-neutral-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    )
  }

  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {hint && <span className="ml-1.5 normal-case font-normal text-neutral-600">— {hint}</span>}
      </label>

      {isEmpty ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-neutral-700 bg-neutral-900 cursor-pointer hover:border-neutral-500 transition"
        >
          <svg className="w-3.5 h-3.5 text-neutral-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-xs text-neutral-500">Choose file…</span>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900 overflow-hidden">
          {kind === 'image' && hasNewFile && state.localUrl && (
            <div className="aspect-square w-full overflow-hidden">
              <img src={state.localUrl} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}

          {kind === 'image' && hasExisting && (
            <div className="aspect-square w-full overflow-hidden bg-neutral-800">
              {state.existingUrl ? (
                <img src={state.existingUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                  </svg>
                  <span className="text-xs text-neutral-600 px-2 text-center truncate max-w-full">{existingName}</span>
                </div>
              )}
            </div>
          )}

          <div className="px-3 py-2 border-t border-neutral-800 flex items-center gap-2">
            <StatusIcon />
            <span className="text-xs text-neutral-300 truncate flex-1 min-w-0">
              {hasNewFile ? state.file!.name : existingName}
            </span>
            {hasNewFile && (
              <span className="text-xs text-neutral-600 shrink-0">{formatBytes(state.file!.size)}</span>
            )}
            {hasExisting && <span className="text-xs text-emerald-400 shrink-0">Current</span>}
          </div>

          <div className="px-3 pb-2 flex items-center gap-3 border-t border-neutral-800/60">
            {state.uploading ? (
              <span className="text-xs text-neutral-500">Uploading…</span>
            ) : (
              <>
                {state.path && <span className="text-xs text-emerald-400 mr-auto">Uploaded ✓</span>}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs text-neutral-500 hover:text-neutral-200 transition py-1"
                >
                  Replace
                </button>
                {hasNewFile && (
                  <>
                    <span className="text-neutral-700 text-xs">·</span>
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="text-xs text-neutral-500 hover:text-red-400 transition py-1"
                    >
                      Remove
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {state.error && <p className="text-xs text-red-400 mt-1">{state.error}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  )
}

// ── PackForm ───────────────────────────────────────────────────────────────
export default function PackForm({ mode, pack, onSuccess, onCancel }: PackFormProps) {
  const isEdit = mode === 'edit'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [title, setTitle] = useState(pack?.title ?? '')
  const [description, setDescription] = useState('')
  const [priceFull, setPriceFull] = useState(pack?.price_full?.toString() ?? '')
  const [licenseType, setLicenseType] = useState<'ROYALTY_FREE' | 'EXCLUSIVE'>(
    pack?.license_type ?? 'ROYALTY_FREE'
  )

  const [cover, setCover] = useState<UploadState>(
    makeExistingUpload(pack?.cover_image_url ?? null, pack?.cover_image_url ?? null)
  )
  const coverRef = useRef<HTMLInputElement | null>(null)

  const [allCollaborators, setAllCollaborators] = useState<Collaborator[]>([])
  const [assignments, setAssignments] = useState<CollaboratorAssignment[]>([])

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !pack) return

    async function load() {
      const { data } = await supabase
        .from('packs')
        .select('description')
        .eq('id', pack.id)
        .single()

      if (data) setDescription(data.description ?? '')

      const { data: cd } = await supabase
        .from('packs_collaborators')
        .select('collaborator_id, role, split_percentage')
        .eq('pack_id', pack.id)

      if (cd) {
        setAssignments(
          cd.map(c => ({
            collaborator_id: c.collaborator_id,
            role: c.role ?? '',
            split_percentage: c.split_percentage?.toString() ?? '',
          }))
        )
      }
    }

    load()
  }, [isEdit, pack, supabase])

  useEffect(() => {
    supabase
      .from('collaborators')
      .select('id, name')
      .order('name')
      .then(({ data }) => setAllCollaborators(data ?? []))
  }, [supabase])

  function addCollaborator() {
    setAssignments(prev => [...prev, { collaborator_id: '', role: '', split_percentage: '' }])
  }

  function removeCollaborator(i: number) {
    setAssignments(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAssignment(i: number, field: keyof CollaboratorAssignment, value: string) {
    setAssignments(prev => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)))
  }

  async function uploadFile(
    file: File,
    bucket: string,
    pathPrefix: string,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const filename = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    setter(prev => ({ ...prev, uploading: true, error: null }))

    const { error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: false })

    if (error) {
      setter(prev => ({ ...prev, uploading: false, error: error.message }))
      return null
    }

    setter(prev => ({ ...prev, uploading: false, path: filename }))
    return filename
  }

  async function handleSubmit() {
    setFormError(null)

    if (!title.trim()) return setFormError('Title is required.')
    if (!priceFull || isNaN(parseFloat(priceFull))) return setFormError('A valid price is required.')
    if (!isEdit && !cover.file) return setFormError('Cover image is required.')

    setSaving(true)

    try {
      const slug = slugify(title) || 'pack'

      let coverImageUrl = pack?.cover_image_url ?? null
      if (cover.file) {
        const path = await uploadFile(cover.file, 'covers', slug, setCover)
        if (!path) {
          setSaving(false)
          return
        }

        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
        coverImageUrl = urlData.publicUrl
      }

      const packPayload = {
        title: title.trim(),
        slug,
        description: description.trim(),
        price_full: parseFloat(priceFull),
        license_type: licenseType,
        cover_image_url: coverImageUrl,
      }

      let packId = pack?.id

      if (!isEdit) {
        const { data, error } = await supabase
          .from('packs')
          .insert({ ...packPayload, is_published: false, is_deleted: false })
          .select('id')
          .single()

        if (error) throw new Error(error.message)
        packId = data.id
      } else {
        const { error } = await supabase
          .from('packs')
          .update(packPayload)
          .eq('id', pack!.id)

        if (error) throw new Error(error.message)
      }

      if (packId) {
        await supabase.from('packs_collaborators').delete().eq('pack_id', packId)

        const valid = assignments.filter(a => a.collaborator_id)
        if (valid.length > 0) {
          const { error } = await supabase.from('packs_collaborators').insert(
            valid.map(a => ({
              pack_id: packId,
              collaborator_id: a.collaborator_id,
              role: a.role || null,
              split_percentage: a.split_percentage ? parseFloat(a.split_percentage) : null,
            }))
          )

          if (error) throw new Error(error.message)
        }
      }

      onSuccess()
    } catch (err: any) {
      setFormError(err.message ?? 'Something went wrong.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        <div className="w-40 shrink-0">
          <FileField
            label="Cover"
            accept="image/*"
            kind="image"
            hint="JPG/PNG"
            state={cover}
            inputRef={coverRef}
            setter={setCover}
            required={!isEdit}
          />
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <label className={labelCls}>Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Dark Trap Vol. 1"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price ($) <span className="text-red-400">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceFull}
                onChange={e => setPriceFull(e.target.value)}
                placeholder="29.99"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>License</label>
              <select
                value={licenseType}
                onChange={e => setLicenseType(e.target.value as 'ROYALTY_FREE' | 'EXCLUSIVE')}
                className={inputCls}
              >
                <option value="ROYALTY_FREE">Royalty Free</option>
                <option value="EXCLUSIVE">Exclusive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800" />

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe this pack…"
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="border-t border-neutral-800" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>
            Collaborators
            <span className="ml-1.5 normal-case font-normal text-neutral-600">— optional</span>
          </label>

          {allCollaborators.length > 0 && (
            <button
              type="button"
              onClick={addCollaborator}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition"
            >
              + Add
            </button>
          )}
        </div>

        {allCollaborators.length === 0 ? (
          <p className="text-xs text-neutral-600 italic">
            No collaborators yet. Add them in the Collaborators section first.
          </p>
        ) : assignments.length === 0 ? (
          <p className="text-xs text-neutral-600 italic">
            None assigned.{` `}
            <button
              type="button"
              onClick={addCollaborator}
              className="text-neutral-400 hover:text-neutral-200 transition"
            >
              Add one
            </button>
          </p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={a.collaborator_id}
                  onChange={e => updateAssignment(i, 'collaborator_id', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-neutral-500 transition"
                >
                  <option value="">Select…</option>
                  {allCollaborators.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={a.role}
                  onChange={e => updateAssignment(i, 'role', e.target.value)}
                  placeholder="Role"
                  className="w-24 px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition"
                />

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={a.split_percentage}
                  onChange={e => updateAssignment(i, 'split_percentage', e.target.value)}
                  placeholder="%"
                  className="w-16 px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition"
                />

                <button
                  type="button"
                  onClick={() => removeCollaborator(i)}
                  className="text-neutral-600 hover:text-red-400 transition text-sm leading-none px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {formError && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {formError}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:text-neutral-200 hover:border-neutral-500 transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 bg-white text-neutral-950 text-sm font-bold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Pack (Draft)'}
        </button>
      </div>
    </div>
  )
}