"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const COVERS_BASE = `${SUPABASE_URL}/storage/v1/object/public/covers`;

function coverUrl(filename: string | null): string | null {
    if (!filename) return null;
    if (filename.startsWith("http")) return filename;
    return `${COVERS_BASE}/${filename}`;
}

type PackCard = {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    description: string | null;
    price_full: number;
    license_type: "ROYALTY_FREE" | "EXCLUSIVE";
    created_at: string;
    search_tags: string[];
};

interface Filters {
    search: string;
    license: string;
    tag: string;
    sort: string;
}

const DEFAULT_FILTERS: Filters = {
    search: "",
    license: "",
    tag: "",
    sort: "newest",
};

export default function PacksPage() {
    const supabase = createClient();
    const [packs, setPacks] = useState<PackCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

    useEffect(() => {
        const fetchPacks = async () => {
            setLoading(true);

            const { data: packRows, error: packsError } = await supabase
                .from("packs")
                .select("id, title, slug, cover_image_url, description, price_full, license_type, created_at")
                .eq("is_published", true)
                .eq("is_deleted", false)
                .order("created_at", { ascending: false });

            if (packsError) {
                console.error("Failed to fetch packs:", packsError.message);
                setPacks([]);
                setLoading(false);
                return;
            }

            const packsList = packRows ?? [];
            const packIds = packsList.map((p) => p.id);

            const packTagMap = new Map<string, Set<string>>();
            for (const packId of packIds) {
                packTagMap.set(packId, new Set<string>());
            }

            if (packIds.length > 0) {
                const { data: bridgeRows, error: bridgeError } = await supabase
                    .from("sample_packs")
                    .select("pack_id, sample_id, samples(is_published, is_deleted)")
                    .in("pack_id", packIds);

                if (bridgeError) {
                    console.error("Failed to fetch pack samples:", bridgeError.message);
                } else {
                    const activeSampleIds = new Set<string>();
                    const sampleToPacks = new Map<string, string[]>();

                    for (const row of bridgeRows ?? []) {
                        const isActiveSample =
                            row.samples &&
                            (row.samples as any).is_published === true &&
                            (row.samples as any).is_deleted === false;
                        if (!isActiveSample) continue;

                        activeSampleIds.add(row.sample_id);
                        const existing = sampleToPacks.get(row.sample_id) ?? [];
                        existing.push(row.pack_id);
                        sampleToPacks.set(row.sample_id, existing);
                    }

                    if (activeSampleIds.size > 0) {
                        const { data: sampleTagRows, error: tagsError } = await supabase
                            .from("sample_tags")
                            .select("sample_id, tags(name)")
                            .in("sample_id", Array.from(activeSampleIds));

                        if (tagsError) {
                            console.error("Failed to fetch sample tags:", tagsError.message);
                        } else {
                            for (const row of sampleTagRows ?? []) {
                                const tagName = (row.tags as any)?.name;
                                if (!tagName) continue;
                                const parentPacks = sampleToPacks.get(row.sample_id) ?? [];
                                for (const packId of parentPacks) {
                                    packTagMap.get(packId)?.add(tagName);
                                }
                            }
                        }
                    }
                }
            }

            const normalized: PackCard[] = packsList.map((pack) => {
                const tagNames = packTagMap.get(pack.id) ?? new Set<string>();

                return {
                    ...pack,
                    cover_image_url: coverUrl(pack.cover_image_url),
                    search_tags: Array.from(tagNames),
                };
            });

            setPacks(normalized);
            setLoading(false);
        };

        fetchPacks();
    }, [supabase]);

    const setFilter = (key: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const availableTags = useMemo(() => {
        return Array.from(
            new Set(packs.flatMap((pack) => pack.search_tags ?? []))
        ).sort((a, b) => a.localeCompare(b));
    }, [packs]);

    const filteredPacks = useMemo(() => {
        const search = filters.search.trim().toLowerCase();
        const filtered = packs.filter((pack) => {
            const matchesSearch =
                search.length === 0 ||
                pack.title.toLowerCase().includes(search) ||
                pack.slug.toLowerCase().includes(search) ||
                (pack.description ?? "").toLowerCase().includes(search) ||
                pack.license_type.toLowerCase().includes(search) ||
                pack.search_tags.some((tag) => tag.toLowerCase().includes(search));

            const matchesLicense = !filters.license || pack.license_type === filters.license;
            const matchesTag = !filters.tag || pack.search_tags.includes(filters.tag);

            return matchesSearch && matchesLicense && matchesTag;
        });

        if (filters.sort === "price_asc") {
            return [...filtered].sort((a, b) => a.price_full - b.price_full);
        }
        if (filters.sort === "price_desc") {
            return [...filtered].sort((a, b) => b.price_full - a.price_full);
        }

        return [...filtered].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [packs, filters]);

    const hasActiveFilters = Object.entries(filters).some(
        ([key, value]) => key !== "sort" && value !== ""
    );

    return (
        <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
            <div className="mb-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">Sample Packs</h1>
                <p className="text-neutral-400">Complete packs with samples, loops, and stems ready to flip.</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-10 items-center">
                <input
                    value={filters.search}
                    onChange={(e) => setFilter("search", e.target.value)}
                    placeholder="Search packs or tags..."
                    className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors w-full sm:w-72"
                />

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
                    value={filters.tag}
                    onChange={(e) => setFilter("tag", e.target.value)}
                    className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
                >
                    <option value="">All Tags</option>
                    {availableTags.map((tag) => (
                        <option key={tag} value={tag}>
                            {tag}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.sort}
                    onChange={(e) => setFilter("sort", e.target.value)}
                    className="bg-neutral-800 text-white text-sm px-4 py-2 rounded-full border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
                >
                    <option value="newest">Sort: Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
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

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse rounded-2xl bg-zinc-800/50 aspect-3/4"
                        />
                    ))}
                </div>
            ) : filteredPacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <p className="text-neutral-500 text-lg mb-2">
                        {hasActiveFilters ? "No packs match your filters." : "No packs available yet."}
                    </p>
                    <p className="text-neutral-600 text-sm">
                        {hasActiveFilters
                            ? "Try adjusting or clearing your filters."
                            : "Check back soon — new packs dropping regularly."}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPacks.map((pack) => (
                        <a key={pack.id} href={`/packs/${pack.slug}`} className="bg-neutral-900 rounded-xl p-4 hover:bg-neutral-800 transition group">
                            <div className="w-full aspect-square bg-neutral-800 rounded-lg mb-4 overflow-hidden relative">
                                {pack.cover_image_url ? (
                                    <img src={pack.cover_image_url} alt={pack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">
                                        No Cover
                                    </div>
                                )}
                            </div>

                            <h3 className="font-semibold text-white truncate">{pack.title}</h3>

                            {pack.description && (
                                <p className="text-neutral-500 text-sm mt-1 line-clamp-2">{pack.description}</p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-700 text-neutral-300">
                                    {pack.license_type === "EXCLUSIVE" ? "Exclusive" : "Royalty Free"}
                                </span>
                                <span className="text-white font-bold text-sm">
                                    ${pack.price_full}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </main>
    );
}