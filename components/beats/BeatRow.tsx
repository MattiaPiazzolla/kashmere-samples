"use client";

import { useEffect, useState } from "react";
import { Play, Pause, ShoppingCart } from "lucide-react";
import { useAudioStore } from "@/store/audioStore";
import { useCartStore } from "@/store/cartStore";
import BeatPurchaseModal, { BeatModalData } from "./BeatPurchaseModal";
import type { BeatCardData } from "./BeatCard";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    beat: BeatCardData;
    allBeats: BeatCardData[];
    previewBaseUrl: string;
    index?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPreviewUrl(base: string, filename: string | null): string | null {
    if (!filename) return null;
    if (filename.startsWith("http")) return filename;
    return `${base}/${filename}`;
}

function toTrack(beat: BeatCardData, base: string) {
    return {
        id: beat.id,
        title: beat.title,
        slug: beat.slug,
        coverImageUrl: beat.cover_image_url,
        previewUrl: buildPreviewUrl(base, beat.filename_preview),
        bpm: beat.bpm,
        key: beat.key,
        type: beat.type,
        licenseType: beat.license_type,
    };
}

// ─── Price display ────────────────────────────────────────────────────────────

function PriceDisplay({ beat }: { beat: BeatCardData }) {
    if (beat.price_lease && beat.price_exclusive) {
        return (
            <div className="flex flex-col items-end">
                <span className="text-xs text-zinc-400">
                    Lease{" "}
                    <span className="font-semibold text-white">
                        ${Number(beat.price_lease).toFixed(2)}
                    </span>
                </span>
                <span className="text-xs text-zinc-500">
                    Excl.{" "}
                    <span className="text-zinc-300">
                        ${Number(beat.price_exclusive).toFixed(2)}
                    </span>
                </span>
            </div>
        );
    }
    if (beat.price_lease)
        return (
            <span className="text-sm font-bold text-white">
                ${Number(beat.price_lease).toFixed(2)}
            </span>
        );
    if (beat.price_exclusive)
        return (
            <span className="text-sm font-bold text-white">
                ${Number(beat.price_exclusive).toFixed(2)}
            </span>
        );
    if (beat.price_individual)
        return (
            <span className="text-sm font-bold text-white">
                ${Number(beat.price_individual).toFixed(2)}
            </span>
        );
    return <span className="text-xs text-zinc-500">Pack Only</span>;
}

// ─── BeatRow ──────────────────────────────────────────────────────────────────

export default function BeatRow({ beat, allBeats, previewBaseUrl, index }: Props) {
    const { currentTrack, isPlaying, play, pause, setQueue } = useAudioStore();
    const { hasItem } = useCartStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isCurrentTrack = currentTrack?.id === beat.id;
    const isThisPlaying = isCurrentTrack && isPlaying;
    const previewUrl = buildPreviewUrl(previewBaseUrl, beat.filename_preview);

    // Hydration-safe — always false on server
    const inCart = mounted ? hasItem(beat.id) : false;

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCurrentTrack) {
            isPlaying ? pause() : play(currentTrack!);
            return;
        }
        const queue = allBeats
            .map((b) => toTrack(b, previewBaseUrl))
            .filter((t) => t.previewUrl !== null) as ReturnType<typeof toTrack>[];
        const startIndex = queue.findIndex((t) => t.id === beat.id);
        setQueue(queue as any, startIndex >= 0 ? startIndex : 0);
    };

    const modalData: BeatModalData = {
        id: beat.id,
        title: beat.title,
        slug: beat.slug,
        coverImageUrl: beat.cover_image_url,
        bpm: beat.bpm,
        key: beat.key,
        type: beat.type,
        licenseType: beat.license_type,
        priceLease: beat.price_lease,
        priceExclusive: beat.price_exclusive,
        priceIndividual: beat.price_individual,
        previewUrl,
    };

    return (
        <>
            <div
                className={`group flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-zinc-800/60 ${isCurrentTrack ? "bg-zinc-800/40" : ""
                    }`}
            >
                {/* Index / play button */}
                <div className="flex w-8 flex-shrink-0 items-center justify-center">
                    {isThisPlaying ? (
                        <button
                            onClick={handlePlayPause}
                            className="text-amber-400"
                            aria-label="Pause"
                        >
                            <Pause size={16} />
                        </button>
                    ) : (
                        <>
                            {index !== undefined && (
                                <span className="text-sm text-zinc-500 group-hover:hidden">
                                    {index + 1}
                                </span>
                            )}
                            <button
                                onClick={handlePlayPause}
                                disabled={!previewUrl}
                                className={`text-white transition hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-30 ${index !== undefined ? "hidden group-hover:block" : "block"
                                    }`}
                                aria-label="Play preview"
                            >
                                <Play size={16} />
                            </button>
                        </>
                    )}
                </div>

                {/* Cover thumbnail */}
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {beat.cover_image_url ? (
                        <img
                            src={beat.cover_image_url}
                            alt={beat.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                            </svg>
                        </div>
                    )}
                    {isThisPlaying && (
                        <div className="absolute inset-0 rounded-lg ring-2 ring-amber-400/60 animate-pulse" />
                    )}
                </div>

                {/* Title + meta */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <span
                        className={`truncate text-sm font-medium ${isCurrentTrack ? "text-amber-400" : "text-white"
                            }`}
                    >
                        {beat.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                        <span className="capitalize">
                            {beat.type.replace("_", " ").toLowerCase()}
                        </span>
                        {beat.bpm && <span>· {beat.bpm} BPM</span>}
                        {beat.key && <span>· {beat.key}</span>}
                    </div>
                </div>

                {/* License badge */}
                <div className="hidden sm:block flex-shrink-0">
                    {beat.license_type === "EXCLUSIVE" ? (
                        <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                            Exclusive
                        </span>
                    ) : (
                        <span className="rounded-full bg-zinc-700/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                            Royalty Free
                        </span>
                    )}
                </div>

                {/* Price */}
                <div className="hidden sm:flex flex-shrink-0 w-28 justify-end">
                    <PriceDisplay beat={beat} />
                </div>

                {/* Buy button */}
                <button
                    onClick={() => setModalOpen(true)}
                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${inCart
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-amber-500 text-black hover:bg-amber-400"
                        }`}
                >
                    <ShoppingCart size={12} />
                    <span className="hidden sm:inline">{inCart ? "In Cart" : "Buy"}</span>
                </button>
            </div>

            <BeatPurchaseModal
                beat={modalOpen ? modalData : null}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}