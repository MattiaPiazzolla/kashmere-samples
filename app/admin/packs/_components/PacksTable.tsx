"use client";

import { useMemo, useState } from "react";
import PackRow, { Pack } from "./PackRow";

type PacksTableProps = {
    packs: Pack[];
    onEdit: (pack: Pack) => void;
    onMutate: () => void;
};

export default function PacksTable({ packs, onEdit, onMutate }: PacksTableProps) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<"all" | "published" | "draft">("all");

    const filteredPacks = useMemo(() => {
        const q = query.trim().toLowerCase();
        return packs.filter((pack) => {
            const matchesQuery =
                q.length === 0 ||
                pack.title.toLowerCase().includes(q) ||
                pack.slug.toLowerCase().includes(q) ||
                pack.license_type.toLowerCase().includes(q) ||
                (pack.search_tags ?? []).some((tag) => tag.toLowerCase().includes(q));

            const matchesStatus =
                status === "all" || (status === "published" ? pack.is_published : !pack.is_published);

            return matchesQuery && matchesStatus;
        });
    }, [packs, query, status]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">{filteredPacks.length} of {packs.length} active</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by title, slug, license, or tags..."
                        className="w-full sm:w-80 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
                    />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "all" | "published" | "draft")}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
                    >
                        <option value="all">All statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="py-3 px-4 w-12">Cover</th>
                            <th className="py-3 px-4">Title</th>
                            <th className="py-3 px-4">License</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Created</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-zinc-950">
                        {packs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-zinc-600 text-sm">
                                    No packs yet. Create your first pack above.
                                </td>
                            </tr>
                        ) : filteredPacks.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-zinc-600 text-sm">
                                    No packs match your search/filter.
                                </td>
                            </tr>
                        ) : (
                            filteredPacks.map((pack) => (
                                <PackRow
                                    key={pack.id}
                                    pack={pack}
                                    onEdit={onEdit}
                                    onMutate={onMutate}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}