"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import SampleRow from "./SampleRow";
import SampleModal from "./SampleModal";

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

export default function DeletedSamples({
    samples,
    packs,
}: {
    samples: Sample[];
    packs: Pack[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [expanded, setExpanded] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSample, setEditingSample] = useState<Sample | null>(null);

    function refresh() {
        startTransition(() => router.refresh());
    }

    return (
        <section>
            <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                Deleted ({samples.length})
            </button>

            {expanded && (
                <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 opacity-60">
                    <table className="w-full text-left">
                        <thead className="border-b border-zinc-800 bg-zinc-900">
                            <tr>
                                {["Title / Pack", "Type", "BPM / Key", "Duration", "Price", "MIDI", "", ""].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                                        >
                                            {h}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {samples.map((sample) => (
                                <SampleRow
                                    key={sample.id}
                                    sample={sample}
                                    onEdit={(s) => {
                                        setEditingSample(s);
                                        setModalOpen(true);
                                    }}
                                    onRefresh={refresh}
                                    deleted
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <SampleModal
                    sample={editingSample}
                    packs={packs}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => {
                        setModalOpen(false);
                        refresh();
                    }}
                />
            )}
        </section>
    );
}