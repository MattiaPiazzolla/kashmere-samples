"use client";

import { useState } from "react";
import PackRow, { Pack } from "./PackRow";

type DeletedPacksProps = {
    packs: Pack[];
    onMutate: () => void;
};

export default function DeletedPacks({ packs, onMutate }: DeletedPacksProps) {
    const [open, setOpen] = useState(false);

    if (packs.length === 0) return null;

    return (
        <div className="mt-8">
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-3"
            >
                <span
                    className={`inline-block transition-transform text-xs ${open ? "rotate-90" : ""}`}
                >
                    ▶
                </span>
                Deleted Packs ({packs.length})
            </button>

            {open && (
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
                            {packs.map((pack) => (
                                <PackRow
                                    key={pack.id}
                                    pack={pack}
                                    onEdit={() => { }} // no edit for deleted packs
                                    onMutate={onMutate}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}