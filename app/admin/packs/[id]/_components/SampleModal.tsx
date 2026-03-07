'use client'

import { Sample } from './SampleRow'
import SampleForm from './SampleForm'

type SampleModalProps = {
  mode: 'create' | 'edit'
  sample?: Sample | null
  packId: string
  onClose: () => void
  onMutate: () => void
}

export default function SampleModal({ mode, sample, packId, onClose, onMutate }: SampleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-neutral-100 text-lg font-semibold">
            {mode === 'create' ? 'New Sample' : `Edit — ${sample?.title}`}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-100 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <SampleForm
          mode={mode}
          sample={sample}
          packId={packId}
          onSuccess={onMutate}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
