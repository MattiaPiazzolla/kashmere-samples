"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Sample } from "./SamplesTable";

import SampleForm from "@/app/admin/packs/[id]/_components/SampleForm";

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

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <div
            ref={overlayRef}
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">
                        {sample ? "Edit Sample" : "New Sample"}
                    </h2>

                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5">
                    <SampleForm
                        mode={sample ? "edit" : "create"}
                        packId={getPackId(sample, packs)}
                        sample={sample ?? undefined}
                        onSuccess={onSaved}
                        onCancel={onClose}
                        packs={packs}
                    />
                </div>
            </div>
        </div>
    );
}

function getPackId(sample: Sample | null, packs: Pack[]): string {
    const raw = sample?.sample_packs?.[0]?.packs ?? null;
    const pack = Array.isArray(raw) ? raw[0] : raw;

    if (!pack?.title) return "";

    const match = packs.find((p) => p.title === pack.title);
    return match?.id ?? "";
}