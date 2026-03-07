"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Pack = {
    id: string;
    title: string;
    slug: string;
    price_full: number;
    license_type: "ROYALTY_FREE" | "EXCLUSIVE";
    is_published: boolean;
    is_deleted: boolean;
    cover_image_url: string | null;
    created_at: string;
};

type PackRowProps = {
    pack: Pack;
    onEdit: (pack: Pack) => void;
    onMutate: () => void;
};

export default function PackRow({ pack, onEdit, onMutate }: PackRowProps) {
    const supabase = createClient();
    const [loadingPublish, setLoadingPublish] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    async function handlePublishToggle() {
        setLoadingPublish(true);
        const { error } = await supabase
            .from("packs")
            .update({ is_published: !pack.is_published })
            .eq("id", pack.id);
        if (error) console.error("Publish toggle failed:", error.message);
        onMutate();
        setLoadingPublish(false);
    }

    async function handleDelete() {
        if (!confirm("Delete \"" + pack.title + "\"? It can be restored later.")) return;
        setLoadingDelete(true);
        const { error } = await supabase
            .from("packs")
            .update({ is_deleted: true, is_published: false })
            .eq("id", pack.id);
        if (error) console.error("Delete failed:", error.message);
        onMutate();
        setLoadingDelete(false);
    }

    async function handleRestore() {
        setLoadingDelete(true);
        const { error } = await supabase
            .from("packs")
            .update({ is_deleted: false })
            .eq("id", pack.id);
        if (error) console.error("Restore failed:", error.message);
        onMutate();
        setLoadingDelete(false);
    }

    const isDeleted = pack.is_deleted;
    const viewHref = "/admin/packs/" + pack.id;

    return (
        <tr className={`border-b border-zinc-800 text-sm ${isDeleted ? "opacity-50" : ""}`}>
            <td className="py-3 px-4 w-12">
                {pack.cover_image_url ? (
                    <img src={pack.cover_image_url} alt={pack.title} className="w-10 h-10 rounded object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">-</div>
                )}
            </td>
            <td className="py-3 px-4 text-white font-medium">{pack.title}</td>
            <td className="py-3 px-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pack.license_type === "EXCLUSIVE" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {pack.license_type === "EXCLUSIVE" ? "Exclusive" : "Royalty Free"}
                </span>
            </td>
            <td className="py-3 px-4 text-zinc-300">${pack.price_full.toFixed(2)}</td>
            <td className="py-3 px-4 text-zinc-500 text-xs">{new Date(pack.created_at).toLocaleDateString()}</td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    {!isDeleted ? (
                        <>
                            <button
                                onClick={handlePublishToggle}
                                disabled={loadingPublish}
                                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${pack.is_published ? "bg-green-600/20 text-green-400 hover:bg-green-600/30" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"}`}
                            >
                                {loadingPublish ? "..." : pack.is_published ? "Published" : "Draft"}
                            </button>
                            <a href={viewHref} className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">View</a>
                            <button
                                onClick={() => onEdit(pack)}
                                className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loadingDelete}
                                className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                            >
                                {loadingDelete ? "..." : "Delete"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleRestore}
                            disabled={loadingDelete}
                            className="text-xs px-2 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors"
                        >
                            {loadingDelete ? "..." : "Restore"}
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}