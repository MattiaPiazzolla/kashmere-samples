// components/beats/ShareButton.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Share2, Check } from "lucide-react";

interface Props {
    title: string;
    slug: string;
}

function buildTweetUrl(title: string, slug: string) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/beats/${slug}`;
    const text = encodeURIComponent(`Check out "${title}" on KashmereSamples`);
    return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
}

export default function ShareButton({ title, slug }: Props) {
    const [state, setState] = useState<"idle" | "copied" | "instagram">("idle");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const getUrl = () =>
        `${window.location.origin}/beats/${slug}`;

    const copyLink = useCallback(async () => {
        await navigator.clipboard.writeText(getUrl());
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
        setOpen(false);
    }, [slug]);

    const shareInstagram = useCallback(async () => {
        await navigator.clipboard.writeText(getUrl());
        setState("instagram");
        setTimeout(() => setState("idle"), 3000);
        setOpen(false);
    }, [slug]);

    const onMainClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: `Check out "${title}" on KashmereSamples`,
                    url: getUrl(),
                });
            } catch {
                // User dismissed
            }
            return;
        }
        setOpen((prev) => !prev);
    };

    return (
        <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
            <button
                onClick={onMainClick}
                title="Share"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
                <Share2 size={13} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900 border border-zinc-700 shadow-xl z-50 overflow-hidden">
                    <button
                        onClick={copyLink}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-zinc-800 transition-colors"
                    >
                        <Check
                            size={14}
                            className={state === "copied" ? "text-emerald-400" : "text-zinc-500"}
                        />
                        {state === "copied" ? "Link copied!" : "Copy link"}
                    </button>

                    <button
                        onClick={() => {
                            window.open(buildTweetUrl(title, slug), "_blank", "noopener,noreferrer");
                            setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-zinc-800 transition-colors"
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="text-zinc-400">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Share on X
                    </button>

                    <button
                        onClick={shareInstagram}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-zinc-800 transition-colors border-t border-zinc-800"
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="text-zinc-400">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        {state === "instagram" ? "Link copied — paste in Instagram" : "Share on Instagram"}
                    </button>
                </div>
            )}
        </div>
    );
}