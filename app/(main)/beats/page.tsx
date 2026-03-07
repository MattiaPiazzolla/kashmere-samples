"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BeatCard, { BeatCardData } from "@/components/beats/BeatCard";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const COVERS_BASE = `${SUPABASE_URL}/storage/v1/object/public/covers`
const PREVIEWS_BASE = `${SUPABASE_URL}/storage/v1/object/public/public-previews`

function coverUrl(filename: string | null): string | null {
    if (!filename) return null
    if (filename.startsWith('http')) return filename
    return `${COVERS_BASE}/${filename}`
}

const BEAT_TYPES = ["FULL_BEAT", "LOOP", "STEM", "ONE_SHOT"] as const;
const BPM_RANGES = [
    { label: "60 – 89", min: 60, max: 89 },
    { label: "90 – 109", min: 90, max: 109 },
    { label: "110 – 129", min: 110, max: 129 },
    { label: "130 – 160", min: 130, max: 160 },
];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface Filters {
    type: string;
    license: string;
    bpmRange: string;
    key: string;
}

const DEFAULT_FILTERS: Filters = {
    type: "",
    license: "",
    bpmRange: "",
    key: "",
};

export default function BeatsPage() {
    const supabase = createClient();

    const [beats, setBeats] = useState<BeatCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

    useEffect(() => {
        const fetchBeats = async () => {
            setLoading(true);

            let query = supabase
                .from("beats")
                .select(
                    "id, title, slug, cover_image_url, bpm, key, type, license_type, price_lease, price_exclusive, price_individual, filename_preview"
                )
                .eq("is_published", true)
                .eq("is_deleted", false)
                .order("created_at", { ascending: false });

            if (filters.type) query = query.eq("type", filters.type);
            if (filters.license) query = query.eq("license_type", filters.license);
            if (filters.key) query = query.eq("key", filters.key);

            if (filters.bpmRange) {
                const range = BPM_RANGES.find((r) => r.label === filters.bpmRange);
                if (range) {
                    query = query.gte("bpm", range.min).lte("bpm", range.max);
                }
            }

            const { data } = await query;

            // Normalise cover URLs
            const normalised: BeatCardData[] = (data ?? []).map((b) => ({
                ...b,
                cover_image_url: coverUrl(b.cover_image_url),
            }))

            setBeats(normalised);
            setLoading(false);
        };

        fetchBeats();
    }, [filters]);

    const setFilter = (key: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== "");

    return (
        <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">

            {/* PAGE HEADER */}
            <div className="mb-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">Beats</h1>
                <p className="text-neutral-400">
                    Browse all available beats. Click to preview and purchase.
                </p>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
                <select
                    value={filters.type}
                    onChange={(e) => setFilter("type", e.target.value)}
                    className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
                >
                    <option value="">All Types</option>
                    {BEAT_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t.replace("_", " ")}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.license}
                    onChange={(e) => setFilter("license", e.target.value)}
                    className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
                >
                    <option value="">All Licenses</option>
                    <option value="ROYALTY_FREE">Royalty Free</option>
                    <option value="EXCLUSIVE">Exclusive</option>
                </select>

                <select
                    value={filters.bpmRange}
                    onChange={(e) => setFilter("bpmRange", e.target.value)}
                    className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
                >
                    <option value="">Any BPM</option>
                    {BPM_RANGES.map((r) => (
                        <option key={r.label} value={r.label}>
                            {r.label}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.key}
                    onChange={(e) => setFilter("key", e.target.value)}
                    className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
                >
                    <option value="">Any Key</option>
                    {KEYS.map((k) => (
                        <option key={k} value={k}>
                            {k}
                        </option>
                    ))}
                </select>

                {hasActiveFilters && (
                    <button
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="text-xs text-zinc-400 underline hover:text-white transition-colors"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* BEATS GRID */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse rounded-2xl bg-zinc-800/50 aspect-[3/4]"
                        />
                    ))}
                </div>
            ) : beats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <p className="text-neutral-500 text-lg mb-2">
                        {hasActiveFilters
                            ? "No beats match your filters."
                            : "No beats available yet."}
                    </p>
                    <p className="text-neutral-600 text-sm">
                        {hasActiveFilters
                            ? "Try adjusting or clearing your filters."
                            : "Check back soon — new beats dropping regularly."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={() => setFilters(DEFAULT_FILTERS)}
                            className="mt-4 text-sm text-amber-400 underline hover:text-amber-300"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {beats.map((beat) => (
                        <BeatCard
                            key={beat.id}
                            beat={beat}
                            allBeats={beats}
                            previewBaseUrl={PREVIEWS_BASE}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}