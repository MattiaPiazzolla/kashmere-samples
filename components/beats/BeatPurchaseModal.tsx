"use client";

import { useEffect, useRef, useState } from "react";
import { X, ShoppingCart, Check, Loader2 } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { useCartStore, LicenseType } from "@/store/cartStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BeatModalData {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string | null;
    bpm: number | null;
    key: string | null;
    type: string;
    licenseType: "ROYALTY_FREE" | "EXCLUSIVE";
    priceLease: number | null;
    priceExclusive: number | null;
    priceIndividual: number | null;
    previewUrl: string | null; // full public URL to watermarked MP3
}

interface Props {
    beat: BeatModalData | null;
    onClose: () => void;
}

// ─── License option ───────────────────────────────────────────────────────────

function LicenseOption({
    label,
    description,
    price,
    selected,
    disabled,
    onClick,
}: {
    label: string;
    description: string;
    price: number | null;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${disabled
                    ? "cursor-not-allowed border-zinc-800 opacity-40"
                    : selected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-zinc-700 hover:border-zinc-500"
                }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                    {price !== null ? (
                        <span className="text-base font-bold text-white">
                            ${price.toFixed(2)}
                        </span>
                    ) : (
                        <span className="text-xs text-zinc-500">N/A</span>
                    )}
                    {selected && (
                        <Check size={16} className="flex-shrink-0 text-amber-400" />
                    )}
                </div>
            </div>
        </button>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function BeatPurchaseModal({ beat, onClose }: Props) {
    const { addItem, openCart, hasItem } = useCartStore();

    const waveContainerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    const [isWaveReady, setIsWaveReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedLicense, setSelectedLicense] =
        useState<LicenseType>("ROYALTY_FREE");
    const [added, setAdded] = useState(false);

    // Default license selection based on beat config
    useEffect(() => {
        if (!beat) return;
        if (beat.licenseType === "EXCLUSIVE" || !beat.priceLease) {
            setSelectedLicense("EXCLUSIVE");
        } else {
            setSelectedLicense("ROYALTY_FREE");
        }
        setAdded(false);
        setIsWaveReady(false);
        setIsPlaying(false);
    }, [beat]);

    // Wavesurfer init
    useEffect(() => {
        if (!beat?.previewUrl || !waveContainerRef.current) return;

        const ws = WaveSurfer.create({
            container: waveContainerRef.current,
            waveColor: "#52525b",
            progressColor: "#f59e0b",
            cursorColor: "#f59e0b",
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 56,
            normalize: true,
            url: beat.previewUrl,
        });

        ws.on("ready", () => setIsWaveReady(true));
        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
            wavesurferRef.current = null;
        };
    }, [beat?.previewUrl]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    });

    const handleClose = () => {
        wavesurferRef.current?.pause();
        onClose();
    };

    const handlePlayPause = () => {
        wavesurferRef.current?.playPause();
    };

    const selectedPrice =
        selectedLicense === "EXCLUSIVE"
            ? beat?.priceExclusive ?? null
            : beat?.priceLease ?? null;

    const alreadyInCart = beat ? hasItem(beat.id, selectedLicense) : false;

    const handleAddToCart = () => {
        if (!beat || selectedPrice === null) return;

        addItem({
            kind: "beat",
            id: beat.id,
            title: beat.title,
            slug: beat.slug,
            coverImageUrl: beat.coverImageUrl,
            bpm: beat.bpm,
            key: beat.key,
            licenseType: selectedLicense,
            pricePaid: selectedPrice,
        });

        setAdded(true);
        wavesurferRef.current?.pause();

        setTimeout(() => {
            onClose();
            openCart();
        }, 600);
    };

    if (!beat) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Purchase ${beat.title}`}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <div
                    className="relative w-full max-w-lg rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close */}
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>

                    {/* Cover + info */}
                    <div className="flex gap-4 p-6 pb-4">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                            {beat.coverImageUrl ? (
                                <img
                                    src={beat.coverImageUrl}
                                    alt={beat.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                                    No Cover
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-center gap-1 min-w-0">
                            <h2 className="text-lg font-bold text-white truncate pr-8">
                                {beat.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                                <span className="capitalize">
                                    {beat.type.replace("_", " ").toLowerCase()}
                                </span>
                                {beat.bpm && <span>· {beat.bpm} BPM</span>}
                                {beat.key && <span>· {beat.key}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Waveform */}
                    <div className="px-6 pb-4">
                        <div className="relative rounded-xl bg-zinc-800/60 px-4 pt-4 pb-3">
                            {/* Loading shimmer */}
                            {!isWaveReady && beat.previewUrl && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                                    <Loader2 size={20} className="animate-spin text-zinc-500" />
                                </div>
                            )}

                            {!beat.previewUrl && (
                                <div className="flex h-14 items-center justify-center text-xs text-zinc-500">
                                    No preview available
                                </div>
                            )}

                            <div
                                ref={waveContainerRef}
                                className={beat.previewUrl ? "block" : "hidden"}
                            />

                            {/* Play/pause button */}
                            {beat.previewUrl && isWaveReady && (
                                <div className="mt-2 flex justify-center">
                                    <button
                                        onClick={handlePlayPause}
                                        className="flex items-center gap-2 rounded-full bg-zinc-700 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-600"
                                    >
                                        {isPlaying ? (
                                            <>
                                                <span className="flex gap-0.5">
                                                    <span className="h-3 w-0.5 animate-pulse bg-amber-400 rounded-full" />
                                                    <span className="h-3 w-0.5 animate-pulse bg-amber-400 rounded-full delay-75" />
                                                    <span className="h-3 w-0.5 animate-pulse bg-amber-400 rounded-full delay-150" />
                                                </span>
                                                Pause Preview
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="h-3 w-3 fill-white"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                Play Preview
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* License picker */}
                    <div className="px-6 pb-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                            Select License
                        </p>

                        <LicenseOption
                            label="Lease License"
                            description="Use in your music. Non-exclusive, subject to terms."
                            price={beat.priceLease}
                            selected={selectedLicense === "ROYALTY_FREE"}
                            disabled={!beat.priceLease}
                            onClick={() => setSelectedLicense("ROYALTY_FREE")}
                        />

                        <LicenseOption
                            label="Exclusive License"
                            description="Full buyout. Beat removed from store after purchase."
                            price={beat.priceExclusive}
                            selected={selectedLicense === "EXCLUSIVE"}
                            disabled={!beat.priceExclusive}
                            onClick={() => setSelectedLicense("EXCLUSIVE")}
                        />
                    </div>

                    {/* Add to cart */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={handleAddToCart}
                            disabled={selectedPrice === null || added}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${added
                                    ? "bg-emerald-500 text-white"
                                    : selectedPrice === null
                                        ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
                                        : "bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600"
                                }`}
                        >
                            {added ? (
                                <>
                                    <Check size={16} />
                                    Added to Cart
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={16} />
                                    {selectedPrice !== null
                                        ? `Add to Cart — $${selectedPrice.toFixed(2)}`
                                        : "Not Available"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}