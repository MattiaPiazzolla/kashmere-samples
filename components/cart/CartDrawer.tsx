"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore, CartItem, CartBeatItem } from "@/store/cartStore";

function LicenseBadge({ type }: { type: "ROYALTY_FREE" | "EXCLUSIVE" }) {
    return type === "EXCLUSIVE" ? (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-400/80 border border-amber-500/20 rounded">
            Exclusive
        </span>
    ) : (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-600 border border-neutral-800 rounded">
            RF
        </span>
    );
}

function CartRow({ item }: { item: CartItem }) {
    const { removeItem } = useCartStore();
    const [removing, setRemoving] = useState(false);
    const beat = item.kind === "beat" ? (item as CartBeatItem) : null;

    const handleRemove = () => {
        setRemoving(true);
        setTimeout(() => removeItem(item.id, item.licenseType), 300);
    };

    return (
        <div
            className="flex gap-3 py-4 border-b border-neutral-800/50 last:border-0"
            style={{
                opacity: removing ? 0 : 1,
                transform: removing ? "translateX(6px)" : "translateX(0)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
        >
            <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-900">
                {item.coverImageUrl ? (
                    <Image src={item.coverImageUrl} alt={item.title} fill className="object-cover" sizes="44px" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="w-3 h-3 rounded-full border border-neutral-700" />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                <p className="truncate text-[13px] font-medium text-white leading-none">{item.title}</p>
                <div className="flex items-center gap-2">
                    <LicenseBadge type={item.licenseType} />
                    {beat?.bpm && <span className="text-[11px] text-neutral-700">{beat.bpm} BPM</span>}
                    {beat?.key && <span className="text-[11px] text-neutral-700">{beat.key}</span>}
                </div>
            </div>

            <div className="flex flex-col items-end justify-between">
                <button
                    onClick={handleRemove}
                    className="p-1 text-neutral-800 transition-colors duration-200 hover:text-red-400"
                    aria-label="Remove item"
                >
                    <Trash2 size={12} />
                </button>
                <span className="text-[13px] font-semibold text-white tabular-nums">
                    ${item.pricePaid.toFixed(2)}
                </span>
            </div>
        </div>
    );
}

function EmptyCart() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-10 h-10 rounded-full border border-neutral-800 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-700" />
            </div>
            <div>
                <p className="text-sm font-medium text-neutral-400">Your cart is empty</p>
                <p className="mt-1 text-xs text-neutral-700 leading-relaxed">
                    Add beats or packs to get started.
                </p>
            </div>
        </div>
    );
}

export default function CartDrawer() {
    const { isOpen, closeCart, items, total, itemCount } = useCartStore();
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
        if (isOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, closeCart]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleCheckout = async () => {
        try {
            setIsCheckingOut(true);
            const payload = items.map((item) => {
                if (item.kind === "beat") return { type: "beat" as const, beatId: item.id, licenseType: item.licenseType };
                return { type: "pack" as const, packId: item.id };
            });
            const res = await fetch("/api/checkout/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: payload }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error ?? "Checkout failed."); return; }
            window.location.href = data.url;
        } catch {
            alert("Something went wrong. Please try again.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const safeItems = mounted ? items : [];
    const safeCount = mounted ? itemCount() : 0;
    const safeTotal = mounted ? total() : 0;

    return (
        <>
            <style>{`
                @keyframes rowIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .row-enter {
                    opacity: 0;
                    animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `}</style>

            {/* Backdrop */}
            <div
                ref={overlayRef}
                onClick={closeCart}
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                role="dialog"
                aria-label="Shopping cart"
                aria-modal="true"
                className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-neutral-950 border-l border-neutral-800/40 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/40">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xs font-semibold text-white uppercase tracking-[0.15em]">Cart</h2>
                        {safeCount > 0 && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black leading-none">
                                {safeCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeCart}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-600 transition-all duration-200 hover:bg-neutral-800/60 hover:text-white"
                        aria-label="Close cart"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5">
                    {safeItems.length === 0 ? (
                        <EmptyCart />
                    ) : (
                        <div>
                            {safeItems.map((item, i) => (
                                <div
                                    key={`${item.kind}:${item.id}:${item.licenseType}`}
                                    className="row-enter"
                                    style={{ animationDelay: `${i * 0.04}s` }}
                                >
                                    <CartRow item={item} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {safeItems.length > 0 && (
                    <div className="px-5 py-5 border-t border-neutral-800/40 space-y-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">Total</span>
                            <span className="text-xl font-black text-white tabular-nums tracking-tight">
                                ${safeTotal.toFixed(2)}
                            </span>
                        </div>

                        <p className="text-[11px] text-neutral-700 leading-relaxed">
                            License terms apply per item.{" "}
                            <a
                                href="/licensing"
                                onClick={closeCart}
                                className="text-neutral-500 underline underline-offset-2 hover:text-neutral-300 transition-colors duration-200"
                            >
                                View details
                            </a>
                        </p>

                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="group flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-black transition-all duration-200 hover:bg-neutral-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isCheckingOut ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Redirecting…
                                </>
                            ) : (
                                <>
                                    Checkout
                                    <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </aside >
        </>
    );
}