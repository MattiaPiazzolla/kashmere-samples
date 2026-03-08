// app/(main)/packs/[slug]/PackDetailClient.tsx
"use client";

import { useEffect, useState } from "react";
import { Play, Pause, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useAudioStore } from "@/store/audioStore";
import { useCartStore } from "@/store/cartStore";
import ShareButton from "@/components/beats/ShareButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pack {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover_image_url: string | null;
    price_full: number;
    license_type: "ROYALTY_FREE" | "EXCLUSIVE";
}

interface Sample {
    id: string;
    title: string;
    filename_preview: string | null;
    bpm: number | null;
    key: string | null;
    type: string;
    subtype: string;
    duration_sec: number | null;
    price_individual: number | null;
    has_midi: boolean;
}

interface Props {
    pack: Pack;
    samples: Sample[];
    previewBaseUrl: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

function toTrack(sample: Sample, packTitle: string, coverUrl: string | null) {
    return {
        id: sample.id,
        title: sample.title,
        slug: sample.id,
        coverImageUrl: coverUrl,
        previewUrl: sample.filename_preview ?? "",
        bpm: sample.bpm,
        key: sample.key,
        type: sample.type,
        licenseType: "ROYALTY_FREE" as const,
    };
}

// ─── Sample Row ───────────────────────────────────────────────────────────────

function SampleRow({
    sample,
    index,
    isCurrentTrack,
    isThisPlaying,
    onPlayPause,
}: {
    sample: Sample;
    index: number;
    isCurrentTrack: boolean;
    isThisPlaying: boolean;
    onPlayPause: (e: React.MouseEvent) => void;
}) {
    const hasPreview = !!sample.filename_preview;

    return (
        <div
            className={`group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/60 ${isCurrentTrack ? "bg-zinc-800/40" : ""}`}
        >
            {/* Index / play */}
            <div className="flex w-8 flex-shrink-0 items-center justify-center">
                {isThisPlaying ? (
                    <button onClick={onPlayPause} className="text-amber-400" aria-label="Pause">
                        <Pause size={16} />
                    </button>
                ) : (
                    <>
                        <span className="text-sm text-zinc-500 group-hover:hidden">
                            {index + 1}
                        </span>
                        <button
                            onClick={onPlayPause}
                            disabled={!hasPreview}
                            className="hidden group-hover:block text-white hover:text-amber-400 transition disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Play preview"
                        >
                            <Play size={16} />
                        </button>
                    </>
                )}
            </div>

            {/* Title + meta */}
            <div className="flex min-w-0 flex-1 flex-col">
                <span className={`truncate text-sm font-medium ${isCurrentTrack ? "text-amber-400" : "text-white"}`}>
                    {sample.title}
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                    <span className="capitalize">{sample.type.replace("_", " ").toLowerCase()}</span>
                    {sample.subtype && <span className="capitalize">· {sample.subtype.toLowerCase()}</span>}
                    {sample.bpm && <span>· {sample.bpm} BPM</span>}
                    {sample.key && <span>· {sample.key}</span>}
                </div>
            </div>

            {/* MIDI badge */}
            {sample.has_midi && (
                <span className="hidden sm:inline-flex flex-shrink-0 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-semibold uppercase tracking-wide">
                    MIDI
                </span>
            )}

            {/* Duration */}
            {sample.duration_sec !== null && (
                <span className="hidden sm:block flex-shrink-0 text-xs text-zinc-500 tabular-nums font-mono w-10 text-right">
                    {fmt(sample.duration_sec)}
                </span>
            )}

            {/* Individual price */}
            <div className="flex-shrink-0 w-20 text-right">
                {sample.price_individual ? (
                    <span className="text-xs font-semibold text-white">
                        ${Number(sample.price_individual).toFixed(2)}
                    </span>
                ) : (
                    <span className="text-xs text-zinc-600">Pack only</span>
                )}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PackDetailClient({ pack, samples, previewBaseUrl }: Props) {
    const { currentTrack, isPlaying, pause, resume, setQueue } = useAudioStore();
    const { addItem, removeItem, openCart, items } = useCartStore();

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const inCart = mounted
        ? items.some((i) => i.id === pack.id && i.licenseType === pack.license_type)
        : false;

    const playableSamples = samples.filter((s) => !!s.filename_preview);

    const handleSamplePlayPause = (sample: Sample, e: React.MouseEvent) => {
        e.stopPropagation();
        const isCurrentTrackCheck = currentTrack?.id === sample.id;

        if (isCurrentTrackCheck) {
            isPlaying ? pause() : resume();
            return;
        }

        const queue = playableSamples.map((s) => toTrack(s, pack.title, pack.cover_image_url));
        const startIndex = queue.findIndex((t) => t.id === sample.id);
        setQueue(queue, startIndex >= 0 ? startIndex : 0);
    };

    const handleCartToggle = () => {
        if (inCart) {
            removeItem(pack.id, pack.license_type);
        } else {
            addItem({
                id: pack.id,
                kind: "pack",
                title: pack.title,
                slug: pack.slug,
                coverImageUrl: pack.cover_image_url,
                licenseType: pack.license_type,
                pricePaid: Number(pack.price_full),
            });
            openCart();
        }
    };

    return (
        <div className="relative">

            {/* CSS backdrop gradient — no canvas, no CORS, works on refresh */}
            {pack.cover_image_url && (
                <div
                    className="pointer-events-none fixed inset-x-0 top-0 h-[600px] z-0 overflow-hidden"
                    style={{
                        maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: "-40px",
                            backgroundImage: `url(${pack.cover_image_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center top",
                            filter: "blur(60px) saturate(2) brightness(0.45)",
                            transform: "scale(1.2)",
                        }}
                    />
                </div>
            )}

            <main className="relative z-10 min-h-screen max-w-5xl mx-auto px-6 py-16">

                {/* Back link */}
                <Link
                    href="/packs"
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10"
                >
                    ← Back to Packs
                </Link>

                {/* Pack header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-16">

                    {/* Cover */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900">
                        {pack.cover_image_url ? (
                            <img
                                src={pack.cover_image_url}
                                alt={pack.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                No Cover
                            </div>
                        )}
                        <div className="absolute top-3 left-3">
                            {pack.license_type === "EXCLUSIVE" ? (
                                <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
                                    Exclusive
                                </span>
                            ) : (
                                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-300 backdrop-blur-sm">
                                    Royalty Free
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white leading-tight mb-3">
                                {pack.title}
                            </h1>
                            {pack.description && (
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    {pack.description}
                                </p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                                {samples.length} sample{samples.length !== 1 ? "s" : ""}
                            </span>
                            {playableSamples.length > 0 && (
                                <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                                    {playableSamples.length} previews available
                                </span>
                            )}
                            {samples.some((s) => s.has_midi) && (
                                <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-xs text-violet-400">
                                    MIDI included
                                </span>
                            )}
                        </div>

                        {/* Price block */}
                        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">Full Pack</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {pack.license_type === "EXCLUSIVE"
                                            ? "Exclusive license · Full buyout"
                                            : "Royalty Free license · All samples included"}
                                    </p>
                                </div>
                                <span className="text-2xl font-black text-white">
                                    ${Number(pack.price_full).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCartToggle}
                                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors ${inCart
                                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                                    : "bg-amber-500 text-black hover:bg-amber-400"
                                    }`}
                            >
                                <ShoppingCart size={15} />
                                {inCart ? "In Cart" : "Add to Cart"}
                            </button>

                            <ShareButton title={pack.title} slug={`packs/${pack.slug}`} />
                        </div>
                    </div>
                </div>

                {/* Sample list */}
                {samples.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-zinc-500">No samples in this pack yet.</p>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4">
                            Samples — {samples.length} track{samples.length !== 1 ? "s" : ""}
                        </h2>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60">
                            {samples.map((sample, i) => {
                                const isCurrentTrackCheck = currentTrack?.id === sample.id;
                                const isThisPlaying = isCurrentTrackCheck && isPlaying;
                                return (
                                    <SampleRow
                                        key={sample.id}
                                        sample={sample}
                                        index={i}
                                        isCurrentTrack={isCurrentTrackCheck}
                                        isThisPlaying={isThisPlaying}
                                        onPlayPause={(e) => handleSamplePlayPause(sample, e)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}