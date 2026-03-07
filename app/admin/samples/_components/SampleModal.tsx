"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

// Re-uses the SampleForm already built in /admin/packs/[id]/_components/SampleForm.tsx
// That form accepts packId as a prop — here we pass it from the pack dropdown selection.
import SampleForm from "@/app/admin/packs/[id]/_components/SampleForm";

interface Sample {
    id: string;
    title: string;
    type: string;
    subtype: string;
    bpm: number | null;
    key: string | null;
    duration_sec: number | null;
    price_individual: number | null;
    is_published: boolean;
    is_deleted: boolean;
    has_midi: boolean;
    packs: { title: string } | null;
}

interface Pack {
    id: string;
    title: string;
}

interface SampleModalProps {
    sample: Sample | null;
    packs: Pack[];
    onClose: () => void;
    onSaved: () => void;
}

export default function SampleModal({
    sample,
    packs,
    onClose,
    onSaved,
}: SampleModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 sticky top-0 bg-zinc-900 z-10">
                    <h2 className="text-lg font-semibold text-white">
                        {sample ? "Edit Sample" : "New Sample"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form body */}
                <div className="px-6 py-5">
                    {/*
            SampleForm expects:
              - packId: string  (the pack this sample belongs to)
              - sample?: existing sample for edit mode
              - onSaved: callback
              - packs?: pack list for dropdown (standalone mode)

            If your existing SampleForm doesn't accept a packs prop + pack selector,
            you'll need to add a pack <select> at the top of SampleForm.
            See the note below.
          */}
                    <SampleForm
                        packId={sample?.packs ? getPpackId(sample, packs) : ""}
                        sample={sample ?? undefined}
                        onSaved={onSaved}
                        packs={packs}
                    />
                </div>
            </div>
        </div>
    );
}

// Helper: find the pack id from the pack title stored in the sample join
function getPpackId(sample: Sample, packs: Pack[]): string {
    if (!sample.packs) return "";
    const match = packs.find((p) => p.title === sample.packs!.title);
    return match?.id ?? "";
}