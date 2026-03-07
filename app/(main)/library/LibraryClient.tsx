// app/(main)/library/LibraryClient.tsx
"use client";

import { useState } from "react";
import { getSignedDownloadUrl } from "@/app/actions/getSignedDownloadUrl";

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

function coverUrl(path: string | null) {
    if (!path) return null;
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

function CoverImage({ src, title, size = 48 }: { src: string | null; title: string; size?: number }) {
    const [err, setErr] = useState(false);
    if (!src || err) {
        return (
            <div
                className="flex-shrink-0 bg-neutral-800 flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <span className="text-neutral-600 text-[10px] font-black tracking-tighter">K</span>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={title}
            width={size}
            height={size}
            onError={() => setErr(true)}
            className="flex-shrink-0 object-cover"
            style={{ width: size, height: size }}
        />
    );
}

export default function LibraryClient({ orders }: Props) {
    const [states, setStates] = useState<Record<string, DownloadState>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [view, setView] = useState<ViewMode>("grid");

    // Flatten all items for grid/list views
    const allItems = orders.flatMap((o) =>
        o.order_items.map((item) => ({ ...item, orderDate: o.created_at, orderId: o.id }))
    );

    async function handleDownload(item: OrderItem) {
        const filename = item.beats?.filename_secure ?? null;
        if (!filename) {
            setErrors((prev) => ({ ...prev, [item.id]: "No file available." }));
            return;
        }
        setStates((prev) => ({ ...prev, [item.id]: "loading" }));
        setErrors((prev) => ({ ...prev, [item.id]: "" }));

        const title = item.beats?.title ?? item.packs?.title ?? "file";
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
        a.href = blobUrl;
        a.download = cleanName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                    <a href="/beats" className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-700 hover:text-white hover:border-white transition-colors duration-200">Browse Beats</a>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .lib-fade { opacity: 0; animation: fadeUp 0.5s ease forwards; }

        /* Grid card */
        .lib-card {
          position: relative;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lib-card:hover { transform: translateY(-4px); }
        .lib-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 12px;
        }
        .lib-card:hover .lib-card-overlay { opacity: 1; }

        /* Download fill animation */
        .dl-fill {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: #c8a96e;
          width: 0%;
        }
        .dl-fill.loading { animation: fillBar 1.8s ease-in-out infinite alternate; }
        .dl-fill.done { width: 100%; background: #4a9e6b; }

        /* View toggle */
        .view-btn {
          padding: 6px 12px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          cursor: pointer;
          background: transparent;
        }
        .view-btn.active {
          border-color: #333;
          color: #fff;
        }
        .view-btn:not(.active) { color: #444; }
        .view-btn:not(.active):hover { color: #888; }

        /* List row hover */
        .lib-list-row {
          transition: background 0.2s ease;
        }
        .lib-list-row:hover { background: rgba(255,255,255,0.02); }
      `}</style>

            <div className="min-h-screen bg-neutral-950 px-6 py-20">
                <div className="max-w-5xl mx-auto">

                    {/* Page header */}
                    <div className="lib-fade flex items-end justify-between mb-10" style={{ animationDelay: "0.05s" }}>
                        <div>
                            <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mb-3">KashmereSamples</p>
                            <h1 className="text-white font-black text-2xl tracking-tighter mb-1">MY LIBRARY</h1>
                            <p className="text-neutral-500 text-xs tracking-wide">
                                {allItems.length} {allItems.length === 1 ? "item" : "items"} · {orders.length} {orders.length === 1 ? "order" : "orders"}
                            </p>
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center gap-1 border border-neutral-800 p-1">
                            {(["grid", "list", "crates"] as ViewMode[]).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`view-btn ${view === v ? "active" : ""}`}
                                >
                                    {v === "grid" && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                            <rect x="0" y="0" width="5" height="5" /><rect x="7" y="0" width="5" height="5" />
                                            <rect x="0" y="7" width="5" height="5" /><rect x="7" y="7" width="5" height="5" />
                                        </svg>
                                    )}
                                    {v === "list" && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                            <rect x="0" y="1" width="12" height="2" /><rect x="0" y="5" width="12" height="2" />
                                            <rect x="0" y="9" width="12" height="2" />
                                        </svg>
                                    )}
                                    {v === "crates" && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                            <rect x="0" y="0" width="12" height="3" /><rect x="0" y="4.5" width="12" height="3" />
                                            <rect x="0" y="9" width="12" height="3" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── GRID VIEW ─── */}
                    {view === "grid" && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {allItems.map((item, i) => {
                                const state = states[item.id] ?? "idle";
                                const title = item.beats?.title ?? item.packs?.title ?? "Unknown";
                                const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);
                                const isDownloadable = !!item.beats?.filename_secure;

                                return (
                                    <div
                                        key={item.id}
                                        className="lib-fade lib-card"
                                        style={{ animationDelay: `${0.08 + i * 0.04}s` }}
                                    >
                                        {/* Cover */}
                                        <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                                            <CoverImage src={cover} title={title} size={300} />
                                            <div className="lib-card-overlay">
                                                {isDownloadable && (
                                                    <button
                                                        onClick={() => handleDownload(item)}
                                                        disabled={state === "loading" || state === "done"}
                                                        className="text-[9px] uppercase tracking-[0.2em] text-white border border-white/30 px-3 py-1.5 hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-40 w-full text-center cursor-pointer"
                                                    >
                                                        {state === "idle" && "Download"}
                                                        {state === "loading" && "Preparing..."}
                                                        {state === "done" && "Saved ✓"}
                                                        {state === "error" && "Retry"}
                                                    </button>
                                                )}
                                            </div>
                                            {/* Progress bar */}
                                            <div className={`dl-fill ${state === "loading" ? "loading" : state === "done" ? "done" : ""}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="pt-2.5 pb-1">
                                            <p className="text-white text-xs font-black tracking-tighter truncate">{title}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <LicenseBadge type={item.license_type} />
                                                <span className="text-neutral-600 text-[9px] font-mono">${Number(item.price_paid).toFixed(2)}</span>
                                            </div>
                                            {errors[item.id] && (
                                                <p className="text-red-700 text-[9px] mt-1">{errors[item.id]}</p>
                                            )}
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
                                const title = item.beats?.title ?? item.packs?.title ?? "Unknown";
                                const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);
                                const isDownloadable = !!item.beats?.filename_secure;

                                return (
                                    <div
                                        key={item.id}
                                        className="lib-fade lib-list-row flex items-center gap-4 py-3 px-2 border-b border-neutral-800/40"
                                        style={{ animationDelay: `${0.08 + i * 0.03}s` }}
                                    >
                                        <CoverImage src={cover} title={title} size={44} />

                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-black tracking-tighter truncate">{title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <LicenseBadge type={item.license_type} />
                                                <span className="text-neutral-600 text-[9px] font-mono">{formatDate(item.orderDate)}</span>
                                            </div>
                                        </div>

                                        <span className="text-neutral-600 text-[10px] font-mono hidden sm:block">
                                            ${Number(item.price_paid).toFixed(2)}
                                        </span>

                                        {isDownloadable ? (
                                            <button
                                                onClick={() => handleDownload(item)}
                                                disabled={state === "loading" || state === "done"}
                                                className="flex-shrink-0 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200 disabled:cursor-default cursor-pointer"
                                                style={{
                                                    color: state === "idle" ? "#737373" : state === "loading" ? "#404040" : state === "done" ? "#2a2a2a" : "#e05c5c",
                                                }}
                                            >
                                                {state === "idle" && "Download"}
                                                {state === "loading" && "Preparing..."}
                                                {state === "done" && "Saved ✓"}
                                                {state === "error" && "Retry"}
                                            </button>
                                        ) : (
                                            <span className="text-neutral-700 text-[10px] uppercase tracking-[0.15em]">Pack</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── CRATES VIEW ─── */}
                    {view === "crates" && (
                        <div className="space-y-12">
                            {orders.map((order, oi) => (
                                <div
                                    key={order.id}
                                    className="lib-fade"
                                    style={{ animationDelay: `${0.08 + oi * 0.08}s` }}
                                >
                                    {/* Crate header */}
                                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60 mb-0">
                                        <div className="flex items-center gap-4">
                                            {/* Stacked covers preview */}
                                            <div className="relative h-10 flex items-center" style={{ width: `${Math.min(order.order_items.length, 3) * 28 + 16}px` }}>
                                                {order.order_items.slice(0, 3).map((item, idx) => {
                                                    const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="absolute border border-neutral-800"
                                                            style={{ left: `${idx * 28}px`, zIndex: idx, width: 36, height: 36 }}
                                                        >
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

                                    {/* Items in crate */}
                                    {order.order_items.map((item) => {
                                        const state = states[item.id] ?? "idle";
                                        const title = item.beats?.title ?? item.packs?.title ?? "Unknown";
                                        const cover = coverUrl(item.beats?.cover_image_url ?? item.packs?.cover_image_url ?? null);
                                        const isDownloadable = !!item.beats?.filename_secure;

                                        return (
                                            <div
                                                key={item.id}
                                                className="lib-list-row flex items-center gap-4 py-4 border-b border-neutral-800/30 px-1"
                                            >
                                                <CoverImage src={cover} title={title} size={48} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-black tracking-tighter truncate mb-1">{title}</p>
                                                    <div className="flex items-center gap-3">
                                                        <LicenseBadge type={item.license_type} />
                                                        <span className="text-neutral-600 text-[9px] font-mono">${Number(item.price_paid).toFixed(2)}</span>
                                                    </div>
                                                    {errors[item.id] && (
                                                        <p className="text-red-700 text-[9px] mt-1">{errors[item.id]}</p>
                                                    )}
                                                </div>

                                                {isDownloadable ? (
                                                    <button
                                                        onClick={() => handleDownload(item)}
                                                        disabled={state === "loading" || state === "done"}
                                                        className="flex-shrink-0 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200 disabled:cursor-default cursor-pointer"
                                                        style={{
                                                            color: state === "idle" ? "#737373" : state === "loading" ? "#404040" : state === "done" ? "#2a2a2a" : "#e05c5c",
                                                        }}
                                                    >
                                                        {state === "idle" && "Download"}
                                                        {state === "loading" && "Preparing..."}
                                                        {state === "done" && "Saved ✓"}
                                                        {state === "error" && "Retry"}
                                                    </button>
                                                ) : (
                                                    <span className="text-neutral-700 text-[10px] uppercase tracking-[0.15em]">Pack</span>
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