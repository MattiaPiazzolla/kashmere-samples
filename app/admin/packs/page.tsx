"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PacksTable from "./_components/PacksTable";
import DeletedPacks from "./_components/DeletedPacks";
import PackModal from "./_components/PackModal";
import { Pack } from "./_components/PackRow";

export default function AdminPacksPage() {
  const supabase = createClient();
  const [activePacks, setActivePacks] = useState<Pack[]>([]);
  const [deletedPacks, setDeletedPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("packs")
      .select("id, title, slug, price_full, license_type, is_published, is_deleted, cover_image_url, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error("Failed to fetch packs:", error.message); setLoading(false); return; }
    setActivePacks((data ?? []).filter((p) => !p.is_deleted));
    setDeletedPacks((data ?? []).filter((p) => p.is_deleted));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  function openCreate() { setSelectedPack(null); setModalMode("create"); setModalOpen(true); }
  function openEdit(pack: Pack) { setSelectedPack(pack); setModalMode("edit"); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelectedPack(null); }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Packs</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Manage sample packs available in the store.</p>
        </div>
        <button onClick={openCreate} className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + New Pack
        </button>
      </div>
      {loading ? (
        <div className="text-zinc-600 text-sm py-12 text-center">Loading packs…</div>
      ) : (
        <>
          <PacksTable packs={activePacks} onEdit={openEdit} onMutate={fetchPacks} />
          <DeletedPacks packs={deletedPacks} onMutate={fetchPacks} />
        </>
      )}
      {modalOpen && (
        <PackModal mode={modalMode} pack={selectedPack} onClose={closeModal} onMutate={() => { closeModal(); fetchPacks(); }} />
      )}
    </div>
  );
}
