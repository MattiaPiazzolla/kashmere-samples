"use client";

import { useEffect, useState } from "react";
import { Play, Pause, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useAudioStore } from "@/store/audioStore";
import BeatPurchaseModal, { BeatModalData } from "./BeatPurchaseModal";
import ShareButton from "./ShareButton";
import { useCartStore } from "@/store/cartStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BeatCardData {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    bpm: number | null;
    key: string | null;
    type: string;
    license_type: "ROYALTY_FREE" | "EXCLUSIVE";
    price_lease: number | null;
    price_exclusive: number | null;
    price_individual: number | null;
    filename_preview: string | null;
}

interface Props {
    beat: BeatCardData;
    allBeats: BeatCardData[];
    previewBaseUrl: string;
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

// ─── BeatCard ─────────────────────────────────────────────────────────────────

export default function BeatCard({ beat, allBeats, previewBaseUrl }: Props) {
    const { currentTrack, isPlaying, pause, resume, setQueue } = useAudioStore();
    const { hasItem } = useCartStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const isCurrentTrack = currentTrack?.id === beat.id;
    const isThisPlaying = isCurrentTrack && isPlaying;
    const previewUrl = buildPreviewUrl(previewBaseUrl, beat.filename_preview);
    const inCart = mounted ? hasItem(beat.id) : false;

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCurrentTrack) {
            isPlaying ? pause() : resume();
            return;
        }
        const queue = allBeats.map((b) => toTrack(b, previewBaseUrl));
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

    const displayPrice = () => {
        if (beat.price_lease)
            return (
                <span className="text-xs text-zinc-400">
                    Lease{" "}
                    <span className="font-semibold text-white">
                        ${Number(beat.price_lease).toFixed(2)}
                    </span>
                </span>
            );
        if (beat.price_exclusive)
            return (
                <span className="text-xs text-zinc-400">
                    Excl.{" "}
                    <span className="font-semibold text-white">
                        ${Number(beat.price_exclusive).toFixed(2)}
                    </span>
                </span>
            );
        if (beat.price_individual)
            return (
                <span className="text-sm font-bold text-white">
                    ${Number(beat.price_individual).toFixed(2)}
                </span>
            );
        return <span className="text-xs text-zinc-500">Pack Only</span>;
    };

    return (
        <>
            <div className="group relative flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden transition hover:border-zinc-600">

                {/* Cover */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
                    {beat.cover_image_url ? (
                        <img
                            src={beat.cover_image_url}
                            alt={beat.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600 text-sm">
                            No Cover
                        </div>
                    )}

                    {/* Play button overlay */}
                    <button
                        onClick={handlePlayPause}
                        disabled={!previewUrl}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40 disabled:cursor-not-allowed"
                        aria-label={isThisPlaying ? "Pause" : "Play preview"}
                    >
                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200 ${isThisPlaying
                                    ? "opacity-100 scale-100"
                                    : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                                } ${!previewUrl ? "opacity-30" : ""}`}
                        >
                            {isThisPlaying ? (
                                <Pause size={20} className="text-black" />
                            ) : (
                                <Play size={20} className="ml-1 text-black" />
                            )}
                        </div>
                    </button>

                    {/* Detail page link — bottom-right corner of cover */}
                    <Link
                        href={`/beats/${beat.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold hover:bg-black/90"
                    >
                        View →
                    </Link>

                    {/* Playing indicator bar */}
                    {isThisPlaying && (
                        <div className="absolute bottom-0 left-0 right-0 flex h-1 gap-0.5 overflow-hidden">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex-1 animate-pulse bg-amber-400"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                />
                            ))}
                        </div>
                    )}

                    {/* License badge */}
                    <div className="absolute left-2 top-2">
                        {beat.license_type === "EXCLUSIVE" ? (
                            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                                Exclusive
                            </span>
                        ) : (
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300 backdrop-blur-sm">
                                Royalty Free
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-2 p-4">

                    {/* Title — links to detail page */}
                    <Link
                        href={`/beats/${beat.slug}`}
                        className="truncate text-sm font-semibold text-white hover:text-amber-400 hover:underline underline-offset-2 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {beat.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                        <span className="capitalize">
                            {beat.type.replace("_", " ").toLowerCase()}
                        </span>
                        {beat.bpm && <span>· {beat.bpm} BPM</span>}
                        {beat.key && <span>· {beat.key}</span>}
                    </div>

                    {/* Price + share + buy */}
                    <div className="mt-auto flex items-center justify-between pt-2">
                        {displayPrice()}

                        <div className="flex items-center gap-2">
                            <ShareButton title={beat.title} slug={beat.slug} />

                            <button
                                onClick={() => setModalOpen(true)}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${inCart
                                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                        : "bg-amber-500 text-black hover:bg-amber-400"
                                    }`}
                            >
                                <ShoppingCart size={12} />
                                {inCart ? "In Cart" : "Buy"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BeatPurchaseModal
                beat={modalOpen ? modalData : null}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}