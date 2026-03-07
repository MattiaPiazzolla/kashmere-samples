// app/(main)/download/[token]/page.tsx
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import DownloadPageClient from "./DownloadPageClient";

type Props = {
    params: Promise<{ token: string }>;
};

export default async function GuestDownloadPage({ params }: Props) {
    const supabase = createServiceClient();
    const { token } = await params;

    // 1. Look up token
    const { data: tokenRow, error: tokenError } = await supabase
        .from("guest_download_tokens")
        .select("id, order_id, expires_at")
        .eq("token", token)
        .maybeSingle();

    if (tokenError || !tokenRow) {
        notFound();
    }

    // 2. Check expiry
    const isExpired = new Date(tokenRow.expires_at) < new Date();
    if (isExpired) {
        return (
            <main className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-white text-2xl font-bold mb-4">Link Expired</h1>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        This download link has expired (links are valid for 7 days).
                        Please contact support with your order ID to get a new link.
                    </p>
                </div>
            </main>
        );
    }

    // 3. Fetch library_access rows for this order
    const { data: libraryRows, error: libraryError } = await supabase
        .from("library_access")
        .select(`
      id,
      beat_id,
      pack_id,
      beats ( id, title, filename_secure ),
      packs ( id, title )
    `)
        .eq("source", `ORDER:${tokenRow.order_id}`);

    if (libraryError || !libraryRows || libraryRows.length === 0) {
        return (
            <main className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-white text-2xl font-bold mb-4">No Files Found</h1>
                    <p className="text-zinc-400 text-sm">
                        We could not find any files for this order. Please contact support.
                    </p>
                </div>
            </main>
        );
    }

    // 4. Shape items for the client component
    const items = libraryRows.map((row: any) => {
        if (row.beat_id && row.beats) {
            return {
                id: row.id,
                type: "beat" as const,
                title: row.beats.title,
                filename: row.beats.filename_secure,
            };
        }
        if (row.pack_id && row.packs) {
            return {
                id: row.id,
                type: "pack" as const,
                title: row.packs.title,
                filename: null,
            };
        }
        return null;
    }).filter(Boolean) as {
        id: string;
        type: "beat" | "pack";
        title: string;
        filename: string | null;
    }[];

    return <DownloadPageClient items={items} expiresAt={tokenRow.expires_at} />;
}