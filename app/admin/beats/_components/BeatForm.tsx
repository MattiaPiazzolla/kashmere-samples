'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const BEAT_TYPES = ['FULL_BEAT', 'LOOP', 'STEM', 'ONE_SHOT'] as const
const LICENSE_TYPES = ['ROYALTY_FREE', 'EXCLUSIVE'] as const
const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

type BeatFormData = {
    title: string
    slug: string
    bpm: string
    key: string
    type: typeof BEAT_TYPES[number]
    license_type: typeof LICENSE_TYPES[number]
    price_lease: string
    price_exclusive: string
    price_individual: string
    has_stems: boolean
}

export type BeatInitialData = {
    id: string
    title: string
    slug: string
    bpm: number | null
    key: string | null
    type: typeof BEAT_TYPES[number]
    license_type: typeof LICENSE_TYPES[number]
    price_lease: number | null
    price_exclusive: number | null
    price_individual: number | null
    has_stems: boolean
    cover_image_url: string | null
    filename_preview: string | null
    filename_secure: string | null
    stems_filename_secure: string | null
    preview_cover_url: string | null
    preview_mp3_url: string | null
    preview_wav_url: string | null
}

function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
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

function makeExistingUpload(existingPath: string | null, existingUrl: string | null = null): UploadState {
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

const inputCls =
    'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition'
const labelCls = 'block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1'

// ── FileField ─────────────────────────────────────────────────────
type FileFieldProps = {
    label: string
    accept: string
    hint?: string
    kind: 'image' | 'audio' | 'zip'
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

        const localUrl = kind === 'image' || kind === 'audio'
            ? URL.createObjectURL(file)
            : null

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
                                    <span className="text-xs text-neutral-600 px-2 text-center truncate max-w-full">
                                        {existingName}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

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
                            <span className="text-xs text-neutral-600 shrink-0">
                                {formatBytes(state.file!.size)}
                            </span>
                        )}
                        {hasExisting && (
                            <span className="text-xs text-emerald-400 shrink-0">Current</span>
                        )}
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

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── BeatForm ──────────────────────────────────────────────────────
export default function BeatForm({
    onSuccess,
    initialData,
}: {
    onSuccess: () => void
    initialData?: BeatInitialData
}) {
    const isEdit = !!initialData

    const [form, setForm] = useState<BeatFormData>({
        title: initialData?.title ?? '',
        slug: initialData?.slug ?? '',
        bpm: initialData?.bpm?.toString() ?? '',
        key: initialData?.key ?? '',
        type: initialData?.type ?? 'FULL_BEAT',
        license_type: initialData?.license_type ?? 'ROYALTY_FREE',
        price_lease: initialData?.price_lease?.toString() ?? '',
        price_exclusive: initialData?.price_exclusive?.toString() ?? '',
        price_individual: initialData?.price_individual?.toString() ?? '',
        has_stems: initialData?.has_stems ?? false,
    })

    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const [cover, setCover] = useState<UploadState>(
        makeExistingUpload(initialData?.cover_image_url ?? null, initialData?.preview_cover_url ?? null)
    )
    const [preview, setPreview] = useState<UploadState>(
        makeExistingUpload(initialData?.filename_preview ?? null, initialData?.preview_mp3_url ?? null)
    )
    const [secure, setSecure] = useState<UploadState>(
        makeExistingUpload(initialData?.filename_secure ?? null, initialData?.preview_wav_url ?? null)
    )
    const [stems, setStems] = useState<UploadState>(
        makeExistingUpload(initialData?.stems_filename_secure ?? null, null)
    )

    const coverRef = useRef<HTMLInputElement | null>(null)
    const previewRef = useRef<HTMLInputElement | null>(null)
    const secureRef = useRef<HTMLInputElement | null>(null)
    const stemsRef = useRef<HTMLInputElement | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    function handleField<K extends keyof BeatFormData>(key: K, value: BeatFormData[K]) {
        setForm(prev => {
            const next = { ...prev, [key]: value }
            if (key === 'title' && !isEdit) next.slug = slugify(value as string)
            return next
        })
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

        if (!form.title.trim()) return setFormError('Title is required.')

        if (!isEdit) {
            if (!cover.file) return setFormError('Cover image is required.')
            if (!preview.file) return setFormError('Preview MP3 is required.')
            if (!secure.file) return setFormError('Secure WAV is required.')
        }

        if (form.has_stems && !stems.file && !stems.existingPath) {
            return setFormError('Stems file is required.')
        }

        setSaving(true)

        try {
            const sp = form.slug || slugify(form.title) || 'beat'

            const [coverPath, previewPath, securePath, stemsPath] = await Promise.all([
                resolveFile(cover, 'covers', sp, setCover),
                resolveFile(preview, 'public-previews', sp, setPreview),
                resolveFile(secure, 'secure-assets', sp, setSecure),
                form.has_stems
                    ? resolveFile(stems, 'secure-assets', `${sp}/stems`, setStems)
                    : Promise.resolve(null),
            ])

            if (!coverPath || !previewPath || !securePath) {
                setFormError('One or more uploads failed.')
                setSaving(false)
                return
            }

            const payload = {
                title: form.title.trim(),
                bpm: form.bpm ? parseInt(form.bpm) : null,
                key: form.key || null,
                type: form.type,
                license_type: form.license_type,
                price_lease: form.price_lease ? parseFloat(form.price_lease) : null,
                price_exclusive: form.price_exclusive ? parseFloat(form.price_exclusive) : null,
                price_individual: form.price_individual ? parseFloat(form.price_individual) : null,
                cover_image_url: coverPath,
                filename_preview: previewPath,
                filename_secure: securePath,
                has_stems: form.has_stems,
                stems_filename_secure: stemsPath ?? null,
            }

            if (isEdit) {
                const { error } = await supabase.from('beats').update(payload).eq('id', initialData.id)
                if (error) {
                    setFormError(error.message)
                    setSaving(false)
                    return
                }
            } else {
                const { error } = await supabase
                    .from('beats')
                    .insert({ ...payload, slug: sp, is_published: false, is_deleted: false })

                if (error) {
                    setFormError(error.message)
                    setSaving(false)
                    return
                }
            }

            onSuccess()
        } catch {
            setFormError('Unexpected error. Please try again.')
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
                        <label className={labelCls}>
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => handleField('title', e.target.value)}
                            placeholder="Dark Trap Banger"
                            className={inputCls}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>BPM</label>
                            <input
                                type="number"
                                value={form.bpm}
                                onChange={e => handleField('bpm', e.target.value)}
                                placeholder="140"
                                min={40}
                                max={300}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Key</label>
                            <select
                                value={form.key}
                                onChange={e => handleField('key', e.target.value)}
                                className={inputCls}
                            >
                                <option value="">—</option>
                                {MUSICAL_KEYS.map(k => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Type</label>
                            <select
                                value={form.type}
                                onChange={e => handleField('type', e.target.value as typeof BEAT_TYPES[number])}
                                className={inputCls}
                            >
                                {BEAT_TYPES.map(t => (
                                    <option key={t} value={t}>
                                        {t.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>License</label>
                            <select
                                value={form.license_type}
                                onChange={e => handleField('license_type', e.target.value as typeof LICENSE_TYPES[number])}
                                className={inputCls}
                            >
                                {LICENSE_TYPES.map(l => (
                                    <option key={l} value={l}>
                                        {l.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-800" />

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className={labelCls}>Lease ($)</label>
                    <input
                        type="number"
                        value={form.price_lease}
                        onChange={e => handleField('price_lease', e.target.value)}
                        placeholder="29.99"
                        min={0}
                        step={0.01}
                        className={inputCls}
                    />
                </div>

                <div>
                    <label className={labelCls}>Exclusive ($)</label>
                    <input
                        type="number"
                        value={form.price_exclusive}
                        onChange={e => handleField('price_exclusive', e.target.value)}
                        placeholder="299.99"
                        min={0}
                        step={0.01}
                        className={inputCls}
                    />
                </div>

                <div>
                    <label className={labelCls}>Individual ($)</label>
                    <input
                        type="number"
                        value={form.price_individual}
                        onChange={e => handleField('price_individual', e.target.value)}
                        placeholder="9.99"
                        min={0}
                        step={0.01}
                        className={inputCls}
                    />
                </div>
            </div>

            <div className="border-t border-neutral-800" />

            <div className="grid grid-cols-2 gap-3">
                <FileField
                    label="Preview MP3"
                    accept=".mp3,audio/mpeg"
                    kind="audio"
                    hint="Watermarked"
                    state={preview}
                    inputRef={previewRef}
                    setter={setPreview}
                    required={!isEdit}
                />

                <FileField
                    label="Secure WAV"
                    accept=".wav,audio/wav"
                    kind="audio"
                    hint="Full quality"
                    state={secure}
                    inputRef={secureRef}
                    setter={setSecure}
                    required={!isEdit}
                />
            </div>

            <div className="flex items-start gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none mt-0.5">
                    <div
                        onClick={() => handleField('has_stems', !form.has_stems)}
                        className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${form.has_stems ? 'bg-white' : 'bg-neutral-700'
                            }`}
                    >
                        <div
                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-neutral-950 transition-transform ${form.has_stems ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                        />
                    </div>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">Has stems</span>
                </label>

                {form.has_stems && (
                    <div className="flex-1">
                        <FileField
                            label="Stems ZIP"
                            accept=".zip,application/zip"
                            kind="zip"
                            state={stems}
                            inputRef={stemsRef}
                            setter={setStems}
                            required={!isEdit}
                        />
                    </div>
                )}
            </div>

            {formError && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {formError}
                </p>
            )}

            <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-2.5 bg-white text-neutral-950 text-sm font-bold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Beat (Draft)'}
            </button>
        </div>
    )
}