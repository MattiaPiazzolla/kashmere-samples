// app/(main)/library/LibraryClient.tsx
"use client";

import { useState, useEffect } from "react";
import { getSignedDownloadUrl } from "@/app/actions/getSignedDownloadUrl";
import { getPackDownloadUrls, PackSampleDownload } from "@/app/actions/getPackDownloadUrls";

type Beat = {
    id: string;
    title: string;
    filename_secure: string | null;
    cover_image_url: string | null;
};

type Pack = {
    id: string;
    title: string;
    cover_image_url: string | null;
};

type OrderItem = {
    id: string;
    license_type: "ROYALTY_FREE" | "EXCLUSIVE";
    price_paid: number;
    beat_id: string | null;
    pack_id: string | null;
    beats: Beat | null;
    packs: Pack | null;
};

type Order = {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    order_items: OrderItem[];
};

type Props = { orders: Order[] };
type DownloadState = "idle" | "loading" | "done" | "error";
type ViewMode = "grid" | "list" | "crates";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function coverUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/covers/${path}`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
}

function LicenseBadge({ type }: { type: "ROYALTY_FREE" | "EXCLUSIVE" }) {
    return (
        <span className="text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 border"
            style={{
                color: type === "EXCLUSIVE" ? "#c8a96e" : "#555",
                borderColor: type === "EXCLUSIVE" ? "rgba(200,169,110,0.3)" : "#2a2a2a",
            }}>
            {type === "ROYALTY_FREE" ? "RF" : "Excl"}
        </span>
    );
}

function TypeBadge({ kind }: { kind: "beat" | "pack" }) {
    return (
        <span className="text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 border"
            style={{
                color: kind === "pack" ? "#7c6af7" : "#404040",
                borderColor: kind === "pack" ? "rgba(124,106,247,0.3)" : "#222",
            }}>
            {kind === "pack" ? "Pack" : "Beat"}
        </span>
    );
}

function CoverImage({ src, title, size = 48 }: { src: string | null; title: string; size?: number }) {
    const [err, setErr] = useState(false);
    if (!src || err) {
        return (
            <div className="flex-shrink-0 bg-neutral-800 flex items-center justify-center" style={{ width: size, height: size }}>
                <span className="text-neutral-600 text-[10px] font-black tracking-tighter">K</span>
            </div>
        );
    }
    return (
        <img src={src} alt={title} width={size} height={size} onError={() => setErr(true)}
            className="flex-shrink-0 object-cover" style={{ width: size, height: size }} />
    );
}

// ─── Pack Files Sheet Modal ───────────────────────────────────────────────────

type SheetProps = {
    item: OrderItem;
    onClose: () => void;
};

function PackFilesSheet({ item, onClose }: SheetProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [fetchState, setFetchState] = useState<"loading" | "ready" | "error">("loading");
    const [samples, setSamples] = useState<PackSampleDownload[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [dlStates, setDlStates] = useState<Record<string, DownloadState>>({});
    const [allState, setAllState] = useState<DownloadState>("idle");

    const title = item.packs?.title ?? "Pack";
    const cover = coverUrl(item.packs?.cover_image_url ?? null);

    // Mount → trigger slide-up animation
    useEffect(() => {
        setMounted(true);
        requestAnimationFrame(() => setVisible(true));
    }, []);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // Fetch samples on open
    useEffect(() => {
        if (!item.pack_id) return;
        getPackDownloadUrls(item.pack_id).then((result) => {
            if ("error" in result) {
                setFetchError(result.error);
                setFetchState("error");
            } else {
                setSamples(result.samples);
                setFetchState("ready");
            }
        });
    }, [item.pack_id]);

    function handleClose() {
        setVisible(false);
        setTimeout(onClose, 320);
    }

    async function downloadSample(sample: PackSampleDownload) {
        setDlStates((prev) => ({ ...prev, [sample.sampleId]: "loading" }));
        const ext = sample.filename.split(".").pop();
        const cleanName = `${sample.title}${ext ? `.${ext}` : ""}`;
        try {
            const res = await fetch(sample.signedUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = cleanName;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            setDlStates((prev) => ({ ...prev, [sample.sampleId]: "done" }));
        } catch {
            setDlStates((prev) => ({ ...prev, [sample.sampleId]: "error" }));
        }
    }

    async function downloadAll() {
        setAllState("loading");
        try {
            for (const sample of samples) {
                const ext = sample.filename.split(".").pop();
                const cleanName = `${sample.title}${ext ? `.${ext}` : ""}`;
                const res = await fetch(sample.signedUrl);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = cleanName;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                await new Promise((r) => setTimeout(r, 400));
                URL.revokeObjectURL(url);
                setDlStates((prev) => ({ ...prev, [sample.sampleId]: "done" }));
            }
            setAllState("done");
        } catch {
            setAllState("error");
        }
    }

    if (!mounted) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{
                background: visible ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0)",
                backdropFilter: visible ? "blur(6px)" : "blur(0px)",
                transition: "all 0.3s ease"
            }}
            onClick={handleClose}
        >
            {/* Modal */}
            <div
                className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: "#111",
                    border: "1px solid #2a2a2a",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(16px)",
                    transition: "all 0.32s cubic-bezier(0.2, 0.9, 0.3, 1)",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Pack header */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-neutral-800/60 flex-shrink-0 bg-neutral-900/30">
                    <CoverImage src={cover} title={title} size={52} />
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-base tracking-tighter truncate">{title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <TypeBadge kind="pack" />
                            <LicenseBadge type={item.license_type} />
                            <span className="text-neutral-600 text-[9px] font-mono">${Number(item.price_paid).toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer flex-shrink-0 w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                        </svg>
                    </button>
                </div>

                {/* Sample list — scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {fetchState === "loading" && (
                        <div className="flex items-center justify-center py-16">
                            <p className="text-neutral-600 text-[10px] uppercase tracking-[0.2em]">Loading files...</p>
                        </div>
                    )}
                    {fetchState === "error" && (
                        <div className="flex items-center justify-center py-16">
                            <p className="text-red-700 text-[10px]">{fetchError}</p>
                        </div>
                    )}
                    {fetchState === "ready" && (
                        <div>
                            {/* Count row */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/40">
                                <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em]">
                                    {samples.length} {samples.length === 1 ? "file" : "files"}
                                </p>
                            </div>
                            {/* Samples */}
                            {samples.map((sample, i) => {
                                const state = dlStates[sample.sampleId] ?? "idle";
                                return (
                                    <div
                                        key={sample.sampleId}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-800/30 transition-colors"
                                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                    >
                                        <span className="text-neutral-700 text-[10px] font-mono w-5 flex-shrink-0 text-right">{i + 1}</span>
                                        <span className="text-neutral-200 text-xs flex-1 truncate">{sample.title}</span>
                                        <button
                                            onClick={() => downloadSample(sample)}
                                            disabled={state === "loading" || state === "done"}
                                            className="cursor-pointer flex-shrink-0 text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded border transition-colors disabled:cursor-not-allowed flex items-center gap-1"
                                            style={{
                                                color: state === "done" ? "#2a6e42" : state === "error" ? "#e05c5c" : state === "loading" ? "#333" : "#737373",
                                                borderColor: state === "done" ? "rgba(42,110,66,0.3)" : state === "error" ? "rgba(224,92,92,0.3)" : "#2a2a2a",
                                            }}
                                        >
                                            {state === "idle" && (
                                                <>
                                                    <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-7 4h14v-2H5v2z" />
                                                    </svg>
                                                    <span>Save</span>
                                                </>
                                            )}
                                            {state === "loading" && "..."}
                                            {state === "done" && "✓"}
                                            {state === "error" && "Retry"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sticky footer — Download All */}
                {fetchState === "ready" && samples.length > 0 && (
                    <div className="flex-shrink-0 px-5 py-4 border-t border-neutral-800/60" style={{ background: "#111" }}>
                        <button
                            onClick={downloadAll}
                            disabled={allState === "loading" || allState === "done"}
                            className="cursor-pointer w-full py-3 text-[11px] uppercase tracking-[0.2em] font-black transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{
                                background: allState === "done" ? "rgba(42,110,66,0.15)" : "rgba(200,169,110,0.1)",
                                border: `1px solid ${allState === "done" ? "rgba(42,110,66,0.4)" : "rgba(200,169,110,0.3)"}`,
                                color: allState === "done" ? "#2a6e42" : "#c8a96e",
                            }}
                        >
                            {allState === "idle" && `↓ Download All ${samples.length} Files`}
                            {allState === "loading" && "Downloading..."}
                            {allState === "done" && "✓ All Files Saved"}
                            {allState === "error" && "Error — Retry"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Compact pack block for list/crates ──────────────────────────────────────

function PackDownloadBlock({ packId, item }: { packId: string; item: OrderItem }) {
    const [zipState, setZipState] = useState<DownloadState>("idle");
    const [expanded, setExpanded] = useState(false);
    const [samples, setSamples] = useState<PackSampleDownload[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    async function loadSamples() {
        if (samples !== null) {
            setExpanded((prev) => !prev);
            return;
        }
        setZipState("loading");
        const result = await getPackDownloadUrls(packId);
        if ("error" in result) {
            setLoadError(result.error);
            setZipState("error");
            return;
        }
        setSamples(result.samples);
        setZipState("idle");
        setExpanded(true);
    }

    async function downloadAll() {
        if (!samples) return;
        setZipState("loading");
        try {
            for (const sample of samples) {
                const ext = sample.filename.split(".").pop();
                const cleanName = `${sample.title}${ext ? `.${ext}` : ""}`;
                const response = await fetch(sample.signedUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl; a.download = cleanName;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                await new Promise((r) => setTimeout(r, 400));
                URL.revokeObjectURL(blobUrl);
            }
            setZipState("done");
        } catch {
            setZipState("error");
        }
    }

    return (
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
                {samples && (
                    <button
                        onClick={downloadAll}
                        disabled={zipState === "loading" || zipState === "done"}
                        className="cursor-pointer text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded border transition-colors disabled:cursor-not-allowed"
                        style={{
                            color: zipState === "done" ? "#2a6e42" : zipState === "error" ? "#e05c5c" : "#c8a96e",
                            borderColor: zipState === "done" ? "rgba(42,110,66,0.3)" : zipState === "error" ? "rgba(224,92,92,0.3)" : "rgba(200,169,110,0.2)",
                            background: "transparent",
                        }}
                    >
                        {zipState === "idle" && "↓ All"}
                        {zipState === "loading" && "Saving..."}
                        {zipState === "done" && "✓ Saved"}
                        {zipState === "error" && "Retry"}
                    </button>
                )}
                <button
                    onClick={loadSamples}
                    className="cursor-pointer text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 transition-colors flex items-center gap-1"
                >
                    {zipState === "loading" && !expanded ? "Loading..." : (
                        <>
                            <span>{expanded ? "Hide" : "Files"}</span>
                            <svg width="8" height="8" fill="currentColor" viewBox="0 0 24 24"
                                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                                <path d="M7 10l5 5 5-5z" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
            {loadError && <p className="text-red-700 text-[9px]">{loadError}</p>}
            {expanded && samples && (
                <div className="w-full mt-1 rounded border border-neutral-800 overflow-hidden">
                    {samples.map((sample, i) => {
                        const [dlState, setDlState] = useState<DownloadState>("idle");
                        async function dl() {
                            setDlState("loading");
                            const ext = sample.filename.split(".").pop();
                            const cleanName = `${sample.title}${ext ? `.${ext}` : ""}`;
                            try {
                                const res = await fetch(sample.signedUrl);
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url; a.download = cleanName;
                                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                setTimeout(() => URL.revokeObjectURL(url), 5000);
                                setDlState("done");
                            } catch { setDlState("error"); }
                        }
                        return (
                            <div key={sample.sampleId} className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-800/40 transition-colors"
                                style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-neutral-600 text-[9px] font-mono w-4 flex-shrink-0">{i + 1}</span>
                                    <span className="text-neutral-300 text-[11px] truncate">{sample.title}</span>
                                </div>
                                <button onClick={dl} disabled={dlState === "loading" || dlState === "done"}
                                    className="cursor-pointer flex-shrink-0 ml-3 text-[10px] uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed"
                                    style={{ color: dlState === "idle" ? "#555" : dlState === "loading" ? "#333" : dlState === "done" ? "#2a6e42" : "#e05c5c" }}>
                                    {dlState === "idle" && "↓"}
                                    {dlState === "loading" && "..."}
                                    {dlState === "done" && "✓"}
                                    {dlState === "error" && "!"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LibraryClient({ orders }: Props) {
    const [states, setStates] = useState<Record<string, DownloadState>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [view, setView] = useState<ViewMode>("grid");
    const [activePackItem, setActivePackItem] = useState<OrderItem | null>(null);

    const allItems = orders.flatMap((o) =>
        o.order_items.map((item) => ({ ...item, orderDate: o.created_at, orderId: o.id }))
    );

    async function handleBeatDownload(item: OrderItem) {
        const filename = item.beats?.filename_secure ?? null;
        if (!filename) { setErrors((prev) => ({ ...prev, [item.id]: "No file available." })); return; }
        setStates((prev) => ({ ...prev, [item.id]: "loading" }));
        setErrors((prev) => ({ ...prev, [item.id]: "" }));
        const title = item.beats?.title ?? "file";
        const ext = filename.split(".").pop();
        const cleanName = `${title}${ext ? `.${ext}` : ""}`;
        const result = await getSignedDownloadUrl(filename, cleanName);
        if ("error" in result) {
            setErrors((prev) => ({ ...prev, [item.id]: result.error }));
            setStates((prev) => ({ ...prev, [item.id]: "error" }));
            return;
        }
        const response = await fetch(result.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl; a.download = cleanName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        setStates((prev) => ({ ...prev, [item.id]: "done" }));
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
                <div>
                    <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mb-4">Library</p>
                    <h1 className="text-white font-black text-2xl tracking-tighter mb-3">NO PURCHASES YET</h1>
                    <p className="text-neutral-500 text-xs tracking-wide mb-8">Your purchased beats and packs will appear here.</p>
                    <a href="/beats" className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-700 hover:text-white hover:border-white transition-colors duration-200">Browse Beats</a>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .lib-fade { opacity: 0; animation: fadeUp 0.5s ease forwards; }
        .lib-card {
          position: relative;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lib-card:hover { transform: translateY(-4px); }
        .lib-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 10px;
          gap: 6px;
        }
        .lib-card:hover .lib-card-overlay { opacity: 1; }
        .dl-fill { position: absolute; bottom: 0; left: 0; height: 2px; background: #c8a96e; width: 0%; }
        .dl-fill.loading { animation: fillBar 1.8s ease-in-out infinite alternate; }
        .dl-fill.done { width: 100%; background: #4a9e6b; }
        .view-btn { padding: 6px 12px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid transparent; transition: all 0.2s ease; cursor: pointer; background: transparent; }
        .view-btn.active { border-color: #333; color: #fff; }
        .view-btn:not(.active) { color: #444; }
        .view-btn:not(.active):hover { color: #888; }
        .lib-list-row { transition: background 0.2s ease; }
        .lib-list-row:hover { background: rgba(255,255,255,0.02); }
      `}</style>

            {/* Pack Files Sheet */}
            {activePackItem && (
                <PackFilesSheet item={activePackItem} onClose={() => setActivePackItem(null)} />
            )}

            <div className="min-h-screen bg-neutral-950 px-6 py-20">
                <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    <div className="lib-fade flex items-end justify-between mb-10" style={{ animationDelay: "0.05s" }}>
                        <div>
                            <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mb-3">KashmereSamples</p>
                            <h1 className="text-white font-black text-2xl tracking-tighter mb-1">MY LIBRARY</h1>
                            <p className="text-neutral-500 text-xs tracking-wide">
                                {allItems.length} {allItems.length === 1 ? "item" : "items"} · {orders.length} {orders.length === 1 ? "order" : "orders"}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 border border-neutral-800 p-1">
                            {(["grid", "list", "crates"] as ViewMode[]).map((v) => (
                                <button key={v} onClick={() => setView(v)} className={`view-btn ${view === v ? "active" : ""}`}>
                                    {v === "grid" && <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5" /><rect x="7" y="0" width="5" height="5" /><rect x="0" y="7" width="5" height="5" /><rect x="7" y="7" width="5" height="5" /></svg>}
                                    {v === "list" && <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="1" width="12" height="2" /><rect x="0" y="5" width="12" height="2" /><rect x="0" y="9" width="12" height="2" /></svg>}
                                    {v === "crates" && <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="12" height="3" /><rect x="0" y="4.5" width="12" height="3" /><rect x="0" y="9" width="12" height="3" /></svg>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── GRID VIEW ─── */}
                    {view === "grid" && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {allItems.map((item, i) => {
                                const state = states[item.id] ?? "idle";
                                const isBeat = !!item.beat_id;
                                const isPack = !!item.pack_id;
                                const title = item.beats?.title ?? item.packs?.title ?? "Unknown";
                                const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);

                                return (
                                    <div key={item.id} className="lib-fade lib-card"
                                        style={{
                                            animationDelay: `${0.08 + i * 0.04}s`,
                                            borderLeft: isPack ? "2px solid rgba(124,106,247,0.4)" : "2px solid transparent",
                                        }}>
                                        <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                                            <CoverImage src={cover} title={title} size={300} />
                                            <div className="lib-card-overlay">
                                                {isBeat && item.beats?.filename_secure && (
                                                    <button
                                                        onClick={() => handleBeatDownload(item)}
                                                        disabled={state === "loading" || state === "done"}
                                                        className="cursor-pointer text-[9px] uppercase tracking-[0.2em] text-white border border-white/30 px-3 py-1.5 hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed w-full text-center"
                                                    >
                                                        {state === "idle" && "Download"}
                                                        {state === "loading" && "Preparing..."}
                                                        {state === "done" && "Saved ✓"}
                                                        {state === "error" && "Retry"}
                                                    </button>
                                                )}
                                                {isPack && (
                                                    <button
                                                        onClick={() => setActivePackItem(item)}
                                                        className="cursor-pointer text-[9px] uppercase tracking-[0.2em] text-white border border-white/30 px-3 py-1.5 hover:bg-white hover:text-black transition-all duration-200 w-full text-center flex items-center justify-center gap-1.5"
                                                    >
                                                        <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 0 0-6 0c0 .14.11.56.18 1H10a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />
                                                        </svg>
                                                        View Files
                                                    </button>
                                                )}
                                            </div>
                                            <div className={`dl-fill ${state === "loading" ? "loading" : state === "done" ? "done" : ""}`} />
                                        </div>
                                        <div className="pt-2.5 pb-1 px-0.5">
                                            <p className="text-white text-xs font-black tracking-tighter truncate">{title}</p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <TypeBadge kind={isPack ? "pack" : "beat"} />
                                                    <LicenseBadge type={item.license_type} />
                                                </div>
                                                <span className="text-neutral-600 text-[9px] font-mono">${Number(item.price_paid).toFixed(2)}</span>
                                            </div>
                                            {errors[item.id] && <p className="text-red-700 text-[9px] mt-1">{errors[item.id]}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── LIST VIEW ─── */}
                    {view === "list" && (
                        <div className="border-t border-neutral-800/60">
                            {allItems.map((item, i) => {
                                const state = states[item.id] ?? "idle";
                                const isBeat = !!item.beat_id;
                                const isPack = !!item.pack_id;
                                const title = item.beats?.title ?? item.packs?.title ?? "Unknown";
                                const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);

                                return (
                                    <div key={item.id} className="lib-fade lib-list-row border-b border-neutral-800/40"
                                        style={{
                                            animationDelay: `${0.08 + i * 0.03}s`,
                                            borderLeft: isPack ? "2px solid rgba(124,106,247,0.4)" : "2px solid transparent",
                                        }}>
                                        <div className="flex items-center gap-4 py-3 px-3">
                                            <CoverImage src={cover} title={title} size={44} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-black tracking-tighter truncate">{title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <TypeBadge kind={isPack ? "pack" : "beat"} />
                                                    <LicenseBadge type={item.license_type} />
                                                    <span className="text-neutral-600 text-[9px] font-mono">{formatDate(item.orderDate)}</span>
                                                </div>
                                            </div>
                                            <span className="text-neutral-600 text-[10px] font-mono hidden sm:block">${Number(item.price_paid).toFixed(2)}</span>
                                            {isBeat && item.beats?.filename_secure && (
                                                <button onClick={() => handleBeatDownload(item)}
                                                    disabled={state === "loading" || state === "done"}
                                                    className="cursor-pointer flex-shrink-0 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200 disabled:cursor-not-allowed"
                                                    style={{ color: state === "idle" ? "#737373" : state === "loading" ? "#404040" : state === "done" ? "#2a6e42" : "#e05c5c" }}>
                                                    {state === "idle" && "Download"}
                                                    {state === "loading" && "Preparing..."}
                                                    {state === "done" && "Saved ✓"}
                                                    {state === "error" && "Retry"}
                                                </button>
                                            )}
                                            {isPack && item.pack_id && (
                                                <PackDownloadBlock packId={item.pack_id} item={item} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── CRATES VIEW ─── */}
                    {view === "crates" && (
                        <div className="space-y-12">
                            {orders.map((order, oi) => (
                                <div key={order.id} className="lib-fade" style={{ animationDelay: `${0.08 + oi * 0.08}s` }}>
                                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60 mb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-10 flex items-center" style={{ width: `${Math.min(order.order_items.length, 3) * 28 + 16}px` }}>
                                                {order.order_items.slice(0, 3).map((item, idx) => {
                                                    const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);
                                                    return (
                                                        <div key={item.id} className="absolute border border-neutral-800" style={{ left: `${idx * 28}px`, zIndex: idx, width: 36, height: 36 }}>
                                                            <CoverImage src={cover} title="" size={36} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div>
                                                <p className="text-white text-xs font-black tracking-tight">{formatDate(order.created_at)}</p>
                                                <p className="text-neutral-600 text-[10px] font-mono mt-0.5">{order.id.slice(0, 8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <p className="text-neutral-500 text-xs font-mono">${Number(order.total_amount).toFixed(2)}</p>
                                    </div>

                                    {order.order_items.map((item) => {
                                        const state = states[item.id] ?? "idle";
                                        const isBeat = !!item.beat_id;
                                        const isPack = !!item.pack_id;
                                        const title = item.beats?.title ?? item.packs?.title ?? "Unknown";
                                        const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);

                                        return (
                                            <div key={item.id} className="lib-list-row flex items-center gap-4 py-4 border-b border-neutral-800/30 px-1"
                                                style={{ borderLeft: isPack ? "2px solid rgba(124,106,247,0.4)" : "2px solid transparent" }}>
                                                <CoverImage src={cover} title={title} size={48} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-black tracking-tighter truncate mb-1">{title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <TypeBadge kind={isPack ? "pack" : "beat"} />
                                                        <LicenseBadge type={item.license_type} />
                                                        <span className="text-neutral-600 text-[9px] font-mono">${Number(item.price_paid).toFixed(2)}</span>
                                                    </div>
                                                    {errors[item.id] && <p className="text-red-700 text-[9px] mt-1">{errors[item.id]}</p>}
                                                </div>
                                                {isBeat && item.beats?.filename_secure && (
                                                    <button onClick={() => handleBeatDownload(item)}
                                                        disabled={state === "loading" || state === "done"}
                                                        className="cursor-pointer flex-shrink-0 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200 disabled:cursor-not-allowed"
                                                        style={{ color: state === "idle" ? "#737373" : state === "loading" ? "#404040" : state === "done" ? "#2a6e42" : "#e05c5c" }}>
                                                        {state === "idle" && "Download"}
                                                        {state === "loading" && "Preparing..."}
                                                        {state === "done" && "Saved ✓"}
                                                        {state === "error" && "Retry"}
                                                    </button>
                                                )}
                                                {isPack && item.pack_id && (
                                                    <PackDownloadBlock packId={item.pack_id} item={item} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}