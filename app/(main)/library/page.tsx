// app/(main)/library/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./LibraryClient";

type LicenseType = "ROYALTY_FREE" | "EXCLUSIVE";

type BeatRow = {
  id: string;
  title: string;
  filename_secure: string;
  cover_image_url: string | null;
};

type PackRow = {
  id: string;
  title: string;
  cover_image_url: string | null;
};

type RawOrderItem = {
  id: string;
  license_type: string | null;
  price_paid: number;
  beat_id: string | null;
  pack_id: string | null;
  beats: BeatRow[] | BeatRow | null;
  packs: PackRow[] | PackRow | null;
};

type RawOrder = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_items: RawOrderItem[] | null;
};

function normalizeLicenseType(value: string | null): LicenseType {
  return value === "EXCLUSIVE" ? "EXCLUSIVE" : "ROYALTY_FREE";
}

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data, error } = await supabase
    .from("orders")
    .select(`
            id,
            created_at,
            total_amount,
            status,
            order_items (
                id,
                license_type,
                price_paid,
                beat_id,
                pack_id,
                beats ( id, title, filename_secure, cover_image_url ),
                packs ( id, title, cover_image_url )
            )
        `)
    .eq("user_id", user.id)
    .eq("status", "PAID")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Library fetch error:", error.message);
  }

  const rawOrders = (data ?? []) as RawOrder[];

  const orders = rawOrders.map((order) => ({
    ...order,
    order_items: (order.order_items ?? []).map((item) => ({
      ...item,
      license_type: normalizeLicenseType(item.license_type),
      beats: Array.isArray(item.beats) ? (item.beats[0] ?? null) : item.beats ?? null,
      packs: Array.isArray(item.packs) ? (item.packs[0] ?? null) : item.packs ?? null,
    })),
  }));

  return <LibraryClient orders={orders} />;
}