// app/(main)/beats/[slug]/BeatDetailClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Share2, ShoppingCart, Check } from "lucide-react";

import { useAudioStore } from "@/store/audioStore";
import { useCartStore } from "@/store/cartStore";
import BeatPurchaseModal, { BeatModalData } from "@/components/beats/BeatPurchaseModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Beat {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    filename_preview: string;
    bpm: number | null;
    key: string | null;
    type: string;
    license_type: "ROYALTY_FREE" | "EXCLUSIVE";
    price_lease: number | null;
    price_exclusive: number | null;
    price_individual: number | null;
    has_stems: boolean;
    pack_id: string | null;
    created_at: string;
}

interface Props {
    beat: Beat;
    packTitle: string | null;
    packSlug: string | null;
}

// ─── Share logic ──────────────────────────────────────────────────────────────

async function handleShare(beat: Beat) {
    if (typeof window === "undefined") return null;
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return null;

    const url = window.location.href;
    const text = `Check out "${beat.title}" on KashmereSamples`;

    try {
        await navigator.share({ title: beat.title, text, url });
        return "shared";
    } catch {
        return null;
    }
}

function buildTweetUrl(beat: Beat) {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = encodeURIComponent(`Check out "${beat.title}" on KashmereSamples`);
    return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
}

// ─── Share button ─────────────────────────────────────────────────────────────

function ShareButton({ beat }: { beat: Beat }) {
    const [state, setState] = useState<"idle" | "copied" | "instagram">("idle");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const copyLink = async () => {
        if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.clipboard) return;

        await navigator.clipboard.writeText(window.location.href);
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
        setOpen(false);
    };

    const shareInstagram = async () => {
        if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.clipboard) return;

        await navigator.clipboard.writeText(window.location.href);
        setState("instagram");
        setTimeout(() => setState("idle"), 3000);
        setOpen(false);
    };

    const onMainClick = async () => {
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            await handleShare(beat);
            return;
        }

        setOpen((prev) => !prev);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={onMainClick}
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
                <Share2 size={15} />
                Share
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                    <button
                        onClick={copyLink}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white transition-colors hover:bg-zinc-800"
                    >
                        <Check size={14} className={state === "copied" ? "text-emerald-400" : "text-zinc-500"} />
                        {state === "copied" ? "Link copied!" : "Copy link"}
                    </button>

                    <button
                        onClick={() => {
                            if (typeof window !== "undefined") {
                                window.open(buildTweetUrl(beat), "_blank", "noopener,noreferrer");
                            }
                            setOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white transition-colors hover:bg-zinc-800"
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="text-zinc-400">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Share on X
                    </button>

                    <button
                        onClick={shareInstagram}
                        className="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-3 text-sm text-white transition-colors hover:bg-zinc-800"
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="text-zinc-400">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        {state === "instagram" ? "Link copied — paste in Instagram" : "Share on Instagram"}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({
    url,
    isPlaying,
    onReady,
}: {
    url: string;
    isPlaying: boolean;
    onReady: (duration: number) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "#3f3f46",
            progressColor: "#f59e0b",
            cursorColor: "#f59e0b",
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 64,
            normalize: true,
            interact: true,
        });

        let destroyed = false;

        ws.on("ready", () => {
            if (!destroyed) onReady(ws.getDuration());
        });

        ws.load(url).catch(() => {
            // Swallow AbortError from cleanup destroying mid-load
        });

        wsRef.current = ws;

        return () => {
            destroyed = true;
            ws.destroy();
            wsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    useEffect(() => {
        const ws = wsRef.current;
        if (!ws) return;

        if (isPlaying) {
            if (!ws.isPlaying()) ws.play();
        } else {
            if (ws.isPlaying()) ws.pause();
        }
    }, [isPlaying]);

    return <div ref={containerRef} className="w-full cursor-pointer overflow-hidden rounded-lg" />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BeatDetailClient({ beat, packTitle, packSlug }: Props) {
    const { currentTrack, isPlaying, setQueue, pause, resume } = useAudioStore();
    const { hasItem } = useCartStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isCurrentTrack = currentTrack?.id === beat.id;
    const isThisPlaying = isCurrentTrack && isPlaying;
    const inCart = mounted ? hasItem(beat.id) : false;

    const track = {
        id: beat.id,
        title: beat.title,
        slug: beat.slug,
        coverImageUrl: beat.cover_image_url,
        previewUrl: beat.filename_preview,
        bpm: beat.bpm,
        key: beat.key,
        type: beat.type,
        licenseType: beat.license_type,
    };

    const handlePlayPause = () => {
        if (isCurrentTrack) {
            isThisPlaying ? pause() : resume();
            return;
        }

        setQueue([track], 0);
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
        previewUrl: beat.filename_preview,
    };

    const formatDuration = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <>
            <div className="relative">
                {beat.cover_image_url && (
                    <div
                        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[600px] overflow-hidden"
                        style={{
                            maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: "-40px",
                                backgroundImage: `url(${beat.cover_image_url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center top",
                                filter: "blur(60px) saturate(2) brightness(0.45)",
                                transform: "scale(1.2)",
                            }}
                        />
                    </div>
                )}

                <main className="relative z-10 mx-auto min-h-screen max-w-5xl px-6 py-16">
                    <Link
                        href="/beats"
                        className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                        ← Back to Beats
                    </Link>

                    <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900">
                            {beat.cover_image_url ? (
                                <img
                                    src={beat.cover_image_url}
                                    alt={beat.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                    No Cover
                                </div>
                            )}

                            <div className="absolute left-3 top-3">
                                {beat.license_type === "EXCLUSIVE" ? (
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

                        <div className="flex flex-col gap-6">
                            {packTitle && packSlug && (
                                <Link
                                    href={`/packs/${packSlug}`}
                                    className="text-xs font-semibold uppercase tracking-widest text-amber-400 transition-colors hover:text-amber-300"
                                >
                                    ↑ {packTitle}
                                </Link>
                            )}

                            <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
                                {beat.title}
                            </h1>

                            <div className="flex flex-wrap gap-2">
                                {beat.type && (
                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs capitalize text-zinc-300">
                                        {beat.type.replace("_", " ").toLowerCase()}
                                    </span>
                                )}

                                {beat.bpm && (
                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                                        {beat.bpm} BPM
                                    </span>
                                )}

                                {beat.key && (
                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                                        {beat.key}
                                    </span>
                                )}

                                {beat.has_stems && (
                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-emerald-400">
                                        Stems Included
                                    </span>
                                )}

                                {duration !== null && (
                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                                        {formatDuration(duration)}
                                    </span>
                                )}
                            </div>

                            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                                <Waveform
                                    url={beat.filename_preview}
                                    isPlaying={isThisPlaying}
                                    onReady={setDuration}
                                />

                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={handlePlayPause}
                                        className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-neutral-200"
                                    >
                                        {isThisPlaying ? (
                                            <>
                                                <Pause size={14} />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play size={14} className="ml-0.5" />
                                                Play Preview
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                                {beat.price_lease && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Lease License</p>
                                            <p className="text-xs text-zinc-500">Non-exclusive · Royalty Free use</p>
                                        </div>
                                        <span className="text-xl font-black text-white">
                                            ${Number(beat.price_lease).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {beat.price_lease && beat.price_exclusive && <div className="border-t border-zinc-800" />}

                                {beat.price_exclusive && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-amber-400">Exclusive License</p>
                                            <p className="text-xs text-zinc-500">Full buyout · Removed from store</p>
                                        </div>
                                        <span className="text-xl font-black text-amber-400">
                                            ${Number(beat.price_exclusive).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {!beat.price_lease && !beat.price_exclusive && beat.price_individual && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-white">Price</p>
                                        <span className="text-xl font-black text-white">
                                            ${Number(beat.price_individual).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {!beat.price_lease && !beat.price_exclusive && !beat.price_individual && (
                                    <p className="text-sm text-zinc-500">Available as part of a pack only.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors ${inCart
                                            ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                            : "bg-amber-500 text-black hover:bg-amber-400"
                                        }`}
                                >
                                    <ShoppingCart size={15} />
                                    {inCart ? "In Cart" : "Add to Cart"}
                                </button>

                                <ShareButton beat={beat} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <BeatPurchaseModal
                beat={modalOpen ? modalData : null}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}