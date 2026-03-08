// app/admin/samples/_components/SampleRow.tsx
"use client";

import { useState } from "react";
import { Pencil, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAudioStore } from "@/store/audioStore";
import type { PlayerTrack } from "@/store/audioStore";
import type { Sample } from "./SamplesTable";

interface SampleRowProps {
    sample: Sample;
    allSamples: Sample[];
    onEdit: (sample: Sample) => void;
    onRefresh: () => void;
    deleted?: boolean;
}

function toTrack(s: Sample): PlayerTrack {
    const firstPackRaw = s.sample_packs?.[0]?.packs ?? null;
    const firstPack = Array.isArray(firstPackRaw) ? firstPackRaw[0] : firstPackRaw;

    return {
        id: s.id,
        title: s.title,
        slug: s.id,
        coverImageUrl: firstPack?.cover_image_url ?? null,
        previewUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-previews/${s.filename_preview}`,
        bpm: s.bpm,
        key: s.key,
        type: s.type,
        licenseType: "ROYALTY_FREE",
    };
}

export default function SampleRow({
    sample,
    allSamples,
    onEdit,
    onRefresh,
    deleted = false,
}: SampleRowProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const { currentTrack, isPlaying, play, pause, resume } = useAudioStore();
    const isThisTrack = currentTrack?.id === sample.id;
    const isThisPlaying = isThisTrack && isPlaying;

    function handlePlay() {
        if (!sample.filename_preview) return;

        if (isThisTrack) {
            isPlaying ? pause() : resume();
            return;
        }

        play(toTrack(sample), allSamples.map(toTrack));
    }

    async function togglePublish() {
        setLoading(true);
        await supabase.from("samples").update({ is_published: !sample.is_published }).eq("id", sample.id);
        setLoading(false);
        onRefresh();
    }

    async function softDelete() {
        setLoading(true);
        await supabase.from("samples").update({ is_deleted: true, is_published: false }).eq("id", sample.id);
        setLoading(false);
        onRefresh();
    }

    async function restore() {
        setLoading(true);
        await supabase.from("samples").update({ is_deleted: false }).eq("id", sample.id);
        setLoading(false);
        onRefresh();
    }

    function formatDuration(sec: number | null) {
        if (!sec) return "—";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    return (
        <tr
            className={`border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors ${isThisTrack ? "bg-zinc-800/30" : ""}`}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePlay}
                        disabled={!sample.filename_preview}
                        aria-label={isThisPlaying ? "Pause" : "Play preview"}
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${!sample.filename_preview
                                ? "bg-zinc-800 text-zinc-700 cursor-not-allowed"
                                : isThisTrack
                                    ? "bg-white text-zinc-950 hover:bg-zinc-200"
                                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                            }`}
                    >
                        {isThisPlaying ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    <div>
                        <p className="text-sm font-medium text-white">{sample.title}</p>
                        <p className="text-xs text-zinc-500">
                            {(() => {
                                const raw = sample.sample_packs?.[0]?.packs ?? null;
                                const pack = Array.isArray(raw) ? raw[0] : raw;
                                return pack?.title ?? "No pack";
                            })()}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3">
                <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">{sample.type}</span>
                <span className="ml-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{sample.subtype}</span>
            </td>

            <td className="px-4 py-3 text-sm text-zinc-400">
                {sample.bpm ?? "—"} / {sample.key ?? "—"}
            </td>

            <td className="px-4 py-3 text-sm text-zinc-400">{formatDuration(sample.duration_sec)}</td>

            <td className="px-4 py-3 text-sm text-zinc-400">
                {sample.price_individual != null ? `$${sample.price_individual.toFixed(2)}` : "Pack only"}
            </td>

            <td className="px-4 py-3 text-xs text-zinc-500">{sample.has_midi ? "✓" : "—"}</td>

            <td className="px-4 py-3">
                {!deleted && (
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${sample.is_published ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"
                            }`}
                    >
                        {sample.is_published ? "Live" : "Draft"}
                    </span>
                )}
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {!deleted ? (
                        <>
                            <button
                                onClick={togglePublish}
                                disabled={loading}
                                title={sample.is_published ? "Unpublish" : "Publish"}
                                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                            >
                                {sample.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                                onClick={() => onEdit(sample)}
                                title="Edit"
                                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={softDelete}
                                disabled={loading}
                                title="Delete"
                                className="rounded p-1.5 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={restore}
                            disabled={loading}
                            title="Restore"
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                            <RotateCcw size={14} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}