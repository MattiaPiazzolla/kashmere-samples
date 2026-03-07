"use client";

import { Pack } from "./PackRow";
import PackForm from "./PackForm";

type PackModalProps = {
  mode: "create" | "edit";
  pack?: Pack | null;
  onClose: () => void;
  onMutate: () => void;
};

export default function PackModal({ mode, pack, onClose, onMutate }: PackModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-semibold">
            {mode === "create" ? "New Pack" : `Edit — ${pack?.title}`}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <PackForm
          mode={mode}
          pack={pack}
          onSuccess={onMutate}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
