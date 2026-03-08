"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function CartButton() {
    const { toggleCart, items } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const count = mounted ? items.length : 0;

    return (
        <button
            onClick={toggleCart}
            aria-label={`Open cart${count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
            className="relative w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 transition-all duration-200 hover:bg-neutral-800/70 hover:text-white"
        >
            <ShoppingBag size={16} strokeWidth={1.75} />
            {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black leading-none">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </button>
    );
}