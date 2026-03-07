// app/admin/packs/[id]/_components/SampleForm.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Sample } from './SampleRow'

const SAMPLE_TYPES = ['LOOP', 'ONE_SHOT', 'STEM'] as const
const SAMPLE_SUBTYPES = ['DRUMS', 'MELODY', 'BASS', 'FX', 'OTHER'] as const
const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

type SampleFormProps = {
  mode: 'create' | 'edit'
  sample?: Sample | null
  packId: string           // pre-selected pack when used inside /admin/packs/[id]
  onSuccess: () => void
  onCancel: () => void
  packs?: { id: string; title: string }[]  // provided in standalone mode
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition'
const labelCls =
  'block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1'

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

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
    file: null, existingPath, existingUrl,
    uploading: false, path: null, error: null, localUrl: null,
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function getAudioDuration(file: File): Promise<number | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const audioCtx = new AudioContext()
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)
    await audioCtx.close()
    return Math.round(decoded.duration * 100) / 100
  } catch {
    return null
  }
}

type FileFieldProps = {
  label: string
  accept: string
  hint?: string
  kind: 'audio' | 'zip'
  state: UploadState
  inputRef: React.RefObject<HTMLInputElement>
  setter: React.Dispatch<React.SetStateAction<UploadState>>
  required?: boolean
  onFileSelected?: (file: File) => void
}

function FileField({ label, accept, hint, kind, state, inputRef, setter, required, onFileSelected }: FileFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (state.localUrl) URL.revokeObjectURL(state.localUrl)
    if (!file) {
      setter(prev => ({ ...prev, file: null, localUrl: null, path: null, error: null }))
      return
    }
    const localUrl = kind === 'audio' ? URL.createObjectURL(file) : null
    setter(prev => ({ ...prev, file, localUrl, path: null, error: null }))
    if (onFileSelected) onFileSelected(file)
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
    if (state.uploading) return (
      <svg className="w-3 h-3 text-neutral-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    )
    if (state.path || hasExisting) return (
      <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    )
    return (
      <svg className="w-3 h-3 text-neutral-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    )
  }

  return (
    <div>
      <label className={labelCls}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
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
          {kind === 'audio' && hasNewFile && state.localUrl && (
            <div className="px-3 pt-2.5">
              <audio controls src={state.localUrl} className="w-full h-8" style={{ colorScheme: 'dark' }} />
            </div>
          )}
          {kind === 'audio' && hasExisting && state.existingUrl && (
            <div className="px-3 pt-2.5">
              <audio controls src={state.existingUrl} className="w-full h-8" style={{ colorScheme: 'dark' }} />
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
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="text-xs text-neutral-500 hover:text-neutral-200 transition py-1">
                  Replace
                </button>
                {hasNewFile && (
                  <>
                    <span className="text-neutral-700 text-xs">·</span>
                    <button type="button" onClick={handleRemove}
                      className="text-xs text-neutral-500 hover:text-red-400 transition py-1">
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

// ─── Multi-pack pill toggle selector ──────────────────────────────────────────

function PackSelector({
  packs,
  selected,
  onChange,
}: {
  packs: { id: string; title: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {packs.map(p => {
        const active = selected.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active
                ? 'bg-white text-neutral-950 border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:border-neutral-500 hover:text-neutral-200'
              }`}
          >
            {p.title}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────────

export default function SampleForm({ mode, sample, packId, onSuccess, onCancel, packs }: SampleFormProps) {
  const isEdit = mode === 'edit'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Pre-populate from existing sample_packs on edit, or current packId on create
  const initialPackIds: string[] = isEdit
    ? (sample?.sample_packs?.map(sp => sp.pack_id) ?? [])
    : packId
      ? [packId]
      : []

  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(initialPackIds)

  const [title, setTitle] = useState(sample?.title ?? '')
  const [type, setType] = useState<typeof SAMPLE_TYPES[number]>(sample?.type ?? 'LOOP')
  const [subtype, setSubtype] = useState<typeof SAMPLE_SUBTYPES[number]>(sample?.subtype ?? 'DRUMS')
  const [bpm, setBpm] = useState(sample?.bpm?.toString() ?? '')
  const [key, setKey] = useState(sample?.key ?? '')
  const [durationSec, setDurationSec] = useState(sample?.duration_sec?.toString() ?? '')
  const [durationAuto, setDurationAuto] = useState(false)
  const [priceIndividual, setPriceIndividual] = useState(sample?.price_individual?.toString() ?? '')
  const [hasMidi, setHasMidi] = useState(sample?.has_midi ?? false)

  const [preview, setPreview] = useState<UploadState>(
    makeExistingUpload(sample?.filename_preview ?? null)
  )
  const [secure, setSecure] = useState<UploadState>(
    makeExistingUpload(sample?.filename_secure ?? null)
  )
  const [midi, setMidi] = useState<UploadState>(
    makeExistingUpload(sample?.midi_filename_secure ?? null)
  )

  const previewRef = useRef<HTMLInputElement>(null)
  const secureRef = useRef<HTMLInputElement>(null)
  const midiRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit) return
    async function resolveUrls() {
      if (sample?.filename_preview) {
        const { data } = await supabase.storage
          .from('public-previews')
          .createSignedUrl(sample.filename_preview, 3600)
        if (data) setPreview(prev => ({ ...prev, existingUrl: data.signedUrl }))
      }
      if (sample?.filename_secure) {
        const { data } = await supabase.storage
          .from('secure-assets')
          .createSignedUrl(sample.filename_secure, 3600)
        if (data) setSecure(prev => ({ ...prev, existingUrl: data.signedUrl }))
      }
    }
    resolveUrls()
  }, [isEdit, sample, supabase])

  async function handleSecureFileSelected(file: File) {
    const duration = await getAudioDuration(file)
    if (duration !== null) {
      setDurationSec(duration.toString())
      setDurationAuto(true)
    }
  }

  async function uploadFile(
    file: File,
    bucket: string,
    pathPrefix: string,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const filename = pathPrefix + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
    setter(prev => ({ ...prev, uploading: true, error: null }))
    const { error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: false })
    if (error) {
      setter(prev => ({ ...prev, uploading: false, error: error.message }))
      return null
    }
    setter(prev => ({ ...prev, uploading: false, path: filename }))
    return filename
  }

  async function resolveFile(
    state: UploadState,
    bucket: string,
    pathPrefix: string,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ): Promise<string | null> {
    if (state.file) return uploadFile(state.file, bucket, pathPrefix, setter)
    return state.existingPath
  }

  async function handleSubmit() {
    setFormError(null)

    if (!title.trim()) return setFormError('Title is required.')
    if (selectedPackIds.length === 0) return setFormError('Select at least one pack.')
    if (!isEdit && !preview.file) return setFormError('Preview file is required.')
    if (!isEdit && !secure.file) return setFormError('Secure file is required.')
    if (hasMidi && !midi.file && !midi.existingPath) return setFormError('MIDI file is required.')

    setSaving(true)
    try {
      const slug = slugify(title) || 'sample'
      const storagePath = selectedPackIds[0]

      const [previewPath, securePath, midiPath] = await Promise.all([
        resolveFile(preview, 'public-previews', storagePath + '/' + slug, setPreview),
        resolveFile(secure, 'secure-assets', storagePath + '/' + slug, setSecure),
        hasMidi
          ? resolveFile(midi, 'secure-assets', storagePath + '/' + slug + '/midi', setMidi)
          : Promise.resolve(null),
      ])

      if (!previewPath || !securePath) {
        setFormError('One or more uploads failed.')
        setSaving(false)
        return
      }

      const payload = {
        title: title.trim(),
        type,
        subtype,
        bpm: bpm ? parseInt(bpm) : null,
        key: key || null,
        duration_sec: durationSec ? parseFloat(durationSec) : null,
        price_individual: priceIndividual ? parseFloat(priceIndividual) : null,
        has_midi: hasMidi,
        filename_preview: previewPath,
        filename_secure: securePath,
        midi_filename_secure: midiPath ?? null,
      }

      let sampleId: string

      if (isEdit) {
        // 1. Update sample fields
        const { error } = await supabase
          .from('samples')
          .update(payload)
          .eq('id', sample!.id)
        if (error) throw new Error(error.message)
        sampleId = sample!.id

        // 2. Delete all existing bridge rows then re-insert
        const { error: delError } = await supabase
          .from('sample_packs')
          .delete()
          .eq('sample_id', sampleId)
        if (delError) throw new Error(delError.message)
      } else {
        // 1. Insert sample (no pack_id column)
        const { data, error } = await supabase
          .from('samples')
          .insert({ ...payload, is_published: false, is_deleted: false })
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        sampleId = data.id
      }

      // 3. Insert bridge rows for all selected packs
      const { error: bridgeError } = await supabase
        .from('sample_packs')
        .insert(selectedPackIds.map(pid => ({ sample_id: sampleId, pack_id: pid })))
      if (bridgeError) throw new Error(bridgeError.message)

      onSuccess()
    } catch (err: any) {
      setFormError(err.message ?? 'Something went wrong.')
      setSaving(false)
    }
  }

  // Pack list to display: standalone uses packs prop, inside pack detail shows only that pack
  const packList = packs ?? (packId ? [{ id: packId, title: 'Current pack' }] : [])

  return (
    <div className="space-y-4">

      {/* Pack selector */}
      {packList.length > 0 && (
        <div>
          <label className={labelCls}>
            Packs <span className="text-red-400">*</span>
            <span className="ml-1.5 normal-case font-normal text-neutral-600">— select one or more</span>
          </label>
          <PackSelector
            packs={packList}
            selected={selectedPackIds}
            onChange={setSelectedPackIds}
          />
          {selectedPackIds.length === 0 && (
            <p className="text-xs text-neutral-600 mt-1">No pack selected.</p>
          )}
        </div>
      )}

      <div>
        <label className={labelCls}>Title <span className="text-red-400">*</span></label>
        <input
          type="text" value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Dark Hi-Hat Loop" className={inputCls}
        />
      </div>

      <div className="border-t border-neutral-800" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select value={type} onChange={e => setType(e.target.value as typeof SAMPLE_TYPES[number])} className={inputCls}>
            {SAMPLE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Subtype</label>
          <select value={subtype} onChange={e => setSubtype(e.target.value as typeof SAMPLE_SUBTYPES[number])} className={inputCls}>
            {SAMPLE_SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>BPM</label>
          <input
            type="number" min={40} max={300} value={bpm}
            onChange={e => setBpm(e.target.value)}
            placeholder="140" className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Key</label>
          <select value={key} onChange={e => setKey(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Duration (sec)
            {durationAuto && (
              <span className="ml-2 normal-case font-normal text-emerald-400">— auto-detected</span>
            )}
          </label>
          <input
            type="number" min={0} step={0.01} value={durationSec}
            onChange={e => { setDurationSec(e.target.value); setDurationAuto(false) }}
            placeholder="Auto from secure file" className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Individual Price ($)</label>
          <input
            type="number" min={0} step={0.01} value={priceIndividual}
            onChange={e => setPriceIndividual(e.target.value)}
            placeholder="Pack only" className={inputCls}
          />
        </div>
      </div>

      <div className="border-t border-neutral-800" />

      <div className="grid grid-cols-2 gap-3">
        <FileField
          label="Preview" accept=".mp3,audio/mpeg" kind="audio" hint="Watermarked MP3"
          state={preview} inputRef={previewRef} setter={setPreview} required={!isEdit}
        />
        <FileField
          label="Secure File" accept=".wav,.mp3,audio/*" kind="audio" hint="Full quality"
          state={secure} inputRef={secureRef} setter={setSecure} required={!isEdit}
          onFileSelected={handleSecureFileSelected}
        />
      </div>

      <div className="flex items-start gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none mt-0.5">
          <div
            onClick={() => setHasMidi(prev => !prev)}
            className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${hasMidi ? 'bg-white' : 'bg-neutral-700'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-neutral-950 transition-transform ${hasMidi ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-neutral-400 whitespace-nowrap">Has MIDI</span>
        </label>
        {hasMidi && (
          <div className="flex-1">
            <FileField
              label="MIDI File" accept=".mid,.midi" kind="zip" hint=".mid / .midi"
              state={midi} inputRef={midiRef} setter={setMidi} required={!isEdit}
            />
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
          type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:text-neutral-200 hover:border-neutral-500 transition"
        >
          Cancel
        </button>
        <button
          type="button" onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 bg-white text-neutral-950 text-sm font-bold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Sample (Draft)'}
        </button>
      </div>

    </div>
  )
}