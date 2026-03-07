// app/(main)/library/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./LibraryClient";

export default async function LibraryPage() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/");

    // Fetch all orders for this user, newest first
    const { data: orders, error } = await supabase
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

    return <LibraryClient orders={orders ?? []} />;
}