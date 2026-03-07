'use client'

import { useEffect } from 'react'
import BeatForm from './BeatForm'
import type { BeatInitialData } from './BeatForm'

export default function BeatModal({
    open,
    onClose,
    onSuccess,
    initialData,
}: {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: BeatInitialData
}) {
    const isEdit = !!initialData

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 sticky top-0 bg-neutral-950 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-neutral-100">
                            {isEdit ? 'Edit Beat' : 'New Beat'}
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {isEdit
                                ? 'Changes are saved immediately.'
                                : 'Saved as draft — publish from the beats table.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 transition text-neutral-400 hover:text-white"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-6">
                    <BeatForm
                        onSuccess={onSuccess}
                        initialData={initialData}
                    />
                </div>
            </div>
        </div>
    )
}