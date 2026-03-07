"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

type SessionStatus = "loading" | "success" | "cancelled" | "error";

export default function OrderConfirmationPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const cancelled = searchParams.get("cancelled");
    const { clearCart } = useCartStore();

    const [status, setStatus] = useState<SessionStatus>("loading");
    const [customerEmail, setCustomerEmail] = useState<string | null>(null);

    useEffect(() => {
        if (cancelled) {
            setStatus("cancelled");
            return;
        }

        if (!sessionId) {
            setStatus("error");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(
                    `/api/checkout/stripe/confirm?session_id=${sessionId}`
                );
                const data = await res.json();

                if (!res.ok) {
                    setStatus("error");
                    return;
                }

                setCustomerEmail(data.customerEmail ?? null);
                setStatus("success");
                clearCart();
            } catch {
                setStatus("error");
            }
        };

        verify();
    }, [sessionId, cancelled, clearCart]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4 text-zinc-400">
                    <Loader2 size={36} className="animate-spin text-amber-400" />
                    <p className="text-sm">Confirming your order…</p>
                </div>
            </div>
        );
    }

    // ── Cancelled ────────────────────────────────────────────────────────────
    if (status === "cancelled") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
                <div className="flex max-w-md flex-col items-center gap-6 text-center">
                    <XCircle size={56} className="text-zinc-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Checkout Cancelled</h1>
                        <p className="mt-2 text-sm text-zinc-400">
                            No worries — your cart is still saved. Head back whenever you're ready.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/beats"
                            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
                        >
                            Back to Beats
                        </Link>
                        <Link
                            href="/packs"
                            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                        >
                            Browse Packs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (status === "error") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
                <div className="flex max-w-md flex-col items-center gap-6 text-center">
                    <XCircle size={56} className="text-red-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                        <p className="mt-2 text-sm text-zinc-400">
                            We couldn't verify your order. If you were charged, please contact
                            support and we'll sort it out immediately.
                        </p>
                    </div>
                    <Link
                        href="/beats"
                        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
                    >
                        Back to Beats
                    </Link>
                </div>
            </div>
        );
    }

    // ── Success ──────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="flex max-w-md flex-col items-center gap-6 text-center">
                <CheckCircle2 size={56} className="text-emerald-400" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Order Confirmed!</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        {customerEmail ? (
                            <>
                                A confirmation and your download links have been sent to{" "}
                                <span className="font-medium text-white">{customerEmail}</span>.
                            </>
                        ) : (
                            "Your purchase is confirmed. Check your email for download links."
                        )}
                    </p>
                </div>

                <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-left">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        What's next
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-400">✓</span>
                            Check your email for your license and download link.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-400">✓</span>
                            Registered? Your files are also in your{" "}
                            <Link href="/library" className="underline hover:text-white">
                                library
                            </Link>
                            .
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-400">✓</span>
                            Questions? Reply to your confirmation email.
                        </li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/library"
                        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
                    >
                        Go to My Library
                    </Link>
                    <Link
                        href="/beats"
                        className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    >
                        Keep Browsing
                    </Link>
                </div>
            </div>
        </div>
    );
}