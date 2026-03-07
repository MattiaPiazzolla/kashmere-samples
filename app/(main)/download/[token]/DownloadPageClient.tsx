// app/(main)/download/[token]/DownloadPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { getSignedDownloadUrl } from "@/app/actions/getSignedDownloadUrl";

type DownloadItem = {
    id: string;
    type: "beat" | "pack";
    title: string;
    filename: string | null;
};

type Props = {
    items: DownloadItem[];
    expiresAt: string;
};

type DownloadState = "idle" | "loading" | "done" | "error";

function useCountdown(expiresAt: string) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        function calc() {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft("Expired"); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            if (d > 0) setTimeLeft(`${d}d ${h}h remaining`);
            else if (h > 0) setTimeLeft(`${h}h ${m}m remaining`);
            else setTimeLeft(`${m}m remaining`);
        }
        calc();
        const id = setInterval(calc, 60000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return timeLeft;
}

export default function DownloadPageClient({ items, expiresAt }: Props) {
    const [states, setStates] = useState<Record<string, DownloadState>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [downloadingAll, setDownloadingAll] = useState(false);
    const timeLeft = useCountdown(expiresAt);
    const isExpiringSoon = new Date(expiresAt).getTime() - Date.now() < 86400000 * 2;

    async function handleDownload(item: DownloadItem): Promise<boolean> {
        if (!item.filename) {
            setErrors((prev) => ({ ...prev, [item.id]: "No file available." }));
            return false;
        }
        setStates((prev) => ({ ...prev, [item.id]: "loading" }));
        setErrors((prev) => ({ ...prev, [item.id]: "" }));

        // Preserve original file extension, use item title as name
        const ext = item.filename.split(".").pop();
        const cleanName = `${item.title}${ext ? `.${ext}` : ""}`;
        const result = await getSignedDownloadUrl(item.filename, cleanName);

        if ("error" in result) {
            setErrors((prev) => ({ ...prev, [item.id]: result.error }));
            setStates((prev) => ({ ...prev, [item.id]: "error" }));
            return false;
        }

        const a = document.createElement("a");
        a.href = result.url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setStates((prev) => ({ ...prev, [item.id]: "done" }));
        return true;
    }

    async function handleDownloadAll() {
        setDownloadingAll(true);
        for (const item of items) {
            const current = states[item.id] ?? "idle";
            if (current === "done" || !item.filename) continue;

            // Pre-fetch the signed URL
            const ext = item.filename.split(".").pop();
            const cleanName = `${item.title}${ext ? `.${ext}` : ""}`;
            const result = await getSignedDownloadUrl(item.filename, cleanName);

            if ("error" in result) {
                setErrors((prev) => ({ ...prev, [item.id]: result.error }));
                setStates((prev) => ({ ...prev, [item.id]: "error" }));
                continue;
            }

            setStates((prev) => ({ ...prev, [item.id]: "loading" }));

            // Use a temporary anchor with a blob to force download
            const response = await fetch(result.url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = cleanName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Revoke blob URL after a short delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

            setStates((prev) => ({ ...prev, [item.id]: "done" }));

            // Wait between files so browser processes each download
            await new Promise((r) => setTimeout(r, 1500));
        }
        setDownloadingAll(false);
    }

    const allDone = items.every((item) => (states[item.id] ?? "idle") === "done");
    const downloadableItems = items.filter((item) => item.filename);

    return (
        <>
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .dl-fade {
          opacity: 0;
          animation: fadeUp 0.6s ease forwards;
        }
        .dl-underline {
          position: relative;
        }
        .dl-underline::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 0;
          height: 1px;
          background: rgba(255,255,255,0.4);
          transition: width 0.3s ease;
        }
        .dl-underline:hover::after {
          width: 100%;
        }
        .expiry-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          margin-right: 6px;
          vertical-align: middle;
          position: relative;
          top: -1px;
          animation: pulse-dot 2s ease-in-out infinite;
        }
      `}</style>

            <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6 py-20">
                <div className="w-full max-w-lg">

                    {/* Header */}
                    <div className="dl-fade mb-3" style={{ animationDelay: "0.05s" }}>
                        <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mb-4">
                            KashmereSamples
                        </p>
                        <h1 className="text-white font-black text-2xl tracking-tighter mb-3">
                            YOUR FILES ARE READY
                        </h1>
                        <p className="text-neutral-500 text-xs tracking-wide">
                            {items.length} {items.length === 1 ? "item" : "items"}
                        </p>
                    </div>

                    {/* Expiry banner */}
                    <div
                        className="dl-fade mb-8 mt-5 px-4 py-3 rounded border flex items-center gap-2"
                        style={{
                            animationDelay: "0.08s",
                            backgroundColor: isExpiringSoon ? "rgba(120,40,40,0.15)" : "rgba(255,255,255,0.03)",
                            borderColor: isExpiringSoon ? "rgba(180,60,60,0.3)" : "rgba(255,255,255,0.06)",
                        }}
                    >
                        <span
                            className="expiry-dot"
                            style={{ backgroundColor: isExpiringSoon ? "#e05c5c" : "#737373" }}
                        />
                        <p
                            className="text-[11px] tracking-[0.08em] uppercase"
                            style={{ color: isExpiringSoon ? "#e05c5c" : "#737373" }}
                        >
                            {timeLeft}
                        </p>
                        {isExpiringSoon && (
                            <p className="text-[11px] text-red-800 tracking-wide ml-1">
                                — download soon
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="dl-fade border-t border-neutral-800/60" style={{ animationDelay: "0.1s" }} />

                    {/* Items */}
                    {items.map((item, i) => {
                        const state = states[item.id] ?? "idle";
                        return (
                            <div
                                key={item.id}
                                className="dl-fade border-b border-neutral-800/60 flex items-center justify-between py-5 gap-4"
                                style={{ animationDelay: `${0.15 + i * 0.07}s` }}
                            >
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="text-sm font-black tracking-tighter truncate transition-colors duration-300"
                                        style={{ color: state === "done" ? "#404040" : "#ffffff" }}
                                    >
                                        {item.title}
                                    </p>
                                    <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em] mt-0.5">
                                        {item.type}
                                    </p>
                                    {errors[item.id] && (
                                        <p className="text-red-800 text-[10px] tracking-wide mt-1">
                                            {errors[item.id]}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDownload(item)}
                                    disabled={state === "loading" || state === "done" || !item.filename}
                                    className="dl-underline flex-shrink-0 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200 disabled:cursor-default"
                                    style={{
                                        color:
                                            state === "idle" ? "#737373" :
                                                state === "loading" ? "#404040" :
                                                    state === "done" ? "#2a2a2a" :
                                                        state === "error" ? "#e05c5c" : "#737373",
                                    }}
                                >
                                    {state === "idle" && "Download"}
                                    {state === "loading" && "Preparing..."}
                                    {state === "done" && "Saved ✓"}
                                    {state === "error" && "Retry"}
                                </button>
                            </div>
                        );
                    })}

                    {/* Download All button */}
                    {downloadableItems.length > 1 && (
                        <div
                            className="dl-fade mt-6"
                            style={{ animationDelay: `${0.15 + items.length * 0.07}s` }}
                        >
                            <button
                                onClick={handleDownloadAll}
                                disabled={downloadingAll || allDone}
                                className="w-full py-3.5 border border-neutral-700 text-neutral-300 text-[11px] uppercase tracking-[0.2em] font-bold transition-all duration-200 hover:border-white hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {allDone
                                    ? "All Files Saved ✓"
                                    : downloadingAll
                                        ? "Downloading..."
                                        : `Download All ${downloadableItems.length} Files`}
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div
                        className="dl-fade mt-10"
                        style={{ animationDelay: `${0.15 + items.length * 0.07 + 0.15}s` }}
                    >
                        <p className="text-neutral-700 text-[11px] tracking-wide leading-relaxed">
                            {"Want permanent access? "}
                            <a href="/sign-up" className="dl-underline text-neutral-500 hover:text-white transition-colors duration-200">Create a free account</a>
                            {" with this email and your library will be waiting."}
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}