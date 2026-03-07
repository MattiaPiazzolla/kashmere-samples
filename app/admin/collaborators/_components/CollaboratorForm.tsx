'use client'

import { useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition'
const labelCls =
  'block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1'

export type CollaboratorData = {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
  default_split_percentage: number | null
}

type CollaboratorFormProps = {
  mode: 'create' | 'edit'
  collaborator?: CollaboratorData | null
  onSuccess: () => void
  onCancel: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toFolderSlug(name: string) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function CollaboratorForm({ mode, collaborator, onSuccess, onCancel }: CollaboratorFormProps) {
  const isEdit = mode === 'edit'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [name, setName] = useState(collaborator?.name ?? '')
  const [bio, setBio] = useState(collaborator?.bio ?? '')
  const [splitPct, setSplitPct] = useState(
    collaborator?.default_split_percentage?.toString() ?? ''
  )

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    collaborator?.avatar_url ?? null
  )
  const avatarRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    setFormError(null)
    if (!name.trim()) { setFormError('Name is required.'); return }

    setSaving(true)
    try {
      let avatarUrl = collaborator?.avatar_url ?? null

      if (avatarFile) {
        // Delete old avatar from storage if replacing
        if (isEdit && collaborator?.avatar_url) {
          const oldPath = extractStoragePath(collaborator.avatar_url)
          if (oldPath) {
            await supabase.storage.from('covers').remove([oldPath])
          }
        }

        const ext = avatarFile.name.split('.').pop()
        const folder = 'collaborators/' + toFolderSlug(name.trim())
        const path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(path, avatarFile, { upsert: false })
        if (uploadError) throw new Error('Avatar upload failed: ' + uploadError.message)
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      }

      const payload = {
        name: name.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        default_split_percentage: splitPct ? parseFloat(splitPct) : null,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('collaborators')
          .update(payload)
          .eq('id', collaborator!.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('collaborators')
          .insert(payload)
        if (error) throw new Error(error.message)
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
        <div className="shrink-0">
          <label className={labelCls}>Avatar</label>
          <div
            onClick={() => avatarRef.current?.click()}
            className="w-20 h-20 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 cursor-pointer hover:border-neutral-500 transition flex items-center justify-center"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
          {avatarFile && (
            <p className="text-xs text-neutral-600 mt-1 max-w-[80px] truncate">{formatBytes(avatarFile.size)}</p>
          )}
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <label className={labelCls}>Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. DJ Kashmere"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Default Split %
              <span className="ml-1.5 normal-case font-normal text-neutral-600">— offline accounting only</span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={splitPct}
              onChange={e => setSplitPct(e.target.value)}
              placeholder="e.g. 30"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Bio
          <span className="ml-1.5 normal-case font-normal text-neutral-600">— optional</span>
        </label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Short bio about this collaborator…"
          rows={3}
          className={inputCls + ' resize-none'}
        />
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
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Collaborator'}
        </button>
      </div>
    </div>
  )
}

// ── Shared util — extract storage path from public URL ─────────────────────
// e.g. https://xxx.supabase.co/storage/v1/object/public/covers/collaborators/name/file.jpg
// → collaborators/name/file.jpg
export function extractStoragePath(publicUrl: string): string | null {
  try {
    const marker = '/object/public/covers/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    return publicUrl.slice(idx + marker.length)
  } catch {
    return null
  }
}
