"use client";

import PackRow, { Pack } from "./PackRow";

type PacksTableProps = {
    packs: Pack[];
    onEdit: (pack: Pack) => void;
    onMutate: () => void;
};

export default function PacksTable({ packs, onEdit, onMutate }: PacksTableProps) {
    return (
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
                    ) : (
                        packs.map((pack) => (
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
    );
}