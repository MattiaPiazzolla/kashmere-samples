"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import SampleRow from "./SampleRow";
import SampleModal from "./SampleModal";

export interface Sample {
    id: string;
    title: string;
    type: "LOOP" | "STEM" | "ONE_SHOT";
    subtype: "DRUMS" | "MELODY" | "BASS" | "FX" | "OTHER";
    bpm: number | null;
    key: string | null;
    duration_sec: number | null;
    price_individual: number | null;
    is_published: boolean;
    is_deleted: boolean;
    has_midi: boolean;
    filename_preview: string | null;
    filename_secure: string | null;
    midi_filename_secure: string | null;
    created_at: string;
    sample_packs: {
        pack_id: string;
        packs:
        | { id: string; title: string; cover_image_url: string | null }
        | { id: string; title: string; cover_image_url: string | null }[]
        | null;
    }[];
}

interface Pack {
    id: string;
    title: string;
}

export default function SamplesTable({
    samples,
    packs,
}: {
    samples: Sample[];
    packs: Pack[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSample, setEditingSample] = useState<Sample | null>(null);

    function refresh() {
        startTransition(() => router.refresh());
    }

    function openCreate() {
        setEditingSample(null);
        setModalOpen(true);
    }

    function openEdit(sample: Sample) {
        setEditingSample(sample);
        setModalOpen(true);
    }

    const playableSamples = samples.filter((s) => s.filename_preview);

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                    Active{" "}
                    <span className="ml-1 text-sm font-normal text-zinc-500">
                        ({samples.length})
                    </span>
                </h2>

                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
                >
                    <Plus size={15} />
                    New Sample
                </button>
            </div>

            {samples.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 py-12 text-center text-sm text-zinc-500">
                    No samples yet. Click <strong>New Sample</strong> to add one.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-left">
                        <thead className="border-b border-zinc-800 bg-zinc-900">
                            <tr>
                                {["Title / Pack", "Type", "BPM / Key", "Duration", "Price", "MIDI", "Status", ""].map(
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
                                    allSamples={playableSamples}
                                    onEdit={openEdit}
                                    onRefresh={refresh}
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