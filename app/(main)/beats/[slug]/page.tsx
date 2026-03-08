// app/(main)/beats/[slug]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BeatDetailClient from "./BeatDetailClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const COVERS_BASE = `${SUPABASE_URL}/storage/v1/object/public/covers`;
const PREVIEWS_BASE = `${SUPABASE_URL}/storage/v1/object/public/public-previews`;

function coverUrl(filename: string | null): string | null {
    if (!filename) return null;
    if (filename.startsWith("http")) return filename;
    return `${COVERS_BASE}/${filename}`;
}

function previewUrl(filename: string): string {
    if (filename.startsWith("http")) return filename;
    return `${PREVIEWS_BASE}/${filename}`;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: beat } = await supabase
        .from("beats")
        .select("title, bpm, key, license_type, cover_image_url")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .maybeSingle();

    if (!beat) return { title: "Beat Not Found" };

    return {
        title: `${beat.title} — KashmereSamples`,
        description: `${beat.license_type === "EXCLUSIVE" ? "Exclusive" : "Royalty Free"} beat${beat.bpm ? ` · ${beat.bpm} BPM` : ""}${beat.key ? ` · ${beat.key}` : ""}`,
        openGraph: {
            title: beat.title,
            images: beat.cover_image_url ? [coverUrl(beat.cover_image_url)] : [],
        },
    };
}

export default async function BeatDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: beat } = await supabase
        .from("beats")
        .select(
            "id, title, slug, cover_image_url, filename_preview, bpm, key, type, license_type, price_lease, price_exclusive, price_individual, has_stems, pack_id, created_at"
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .maybeSingle();

    if (!beat) notFound();

    // Resolve pack title if beat belongs to a pack
    let packTitle: string | null = null;
    let packSlug: string | null = null;
    if (beat.pack_id) {
        const { data: pack } = await supabase
            .from("packs")
            .select("title, slug")
            .eq("id", beat.pack_id)
            .maybeSingle();
        packTitle = pack?.title ?? null;
        packSlug = pack?.slug ?? null;
    }

    const resolvedBeat = {
        ...beat,
        cover_image_url: coverUrl(beat.cover_image_url),
        filename_preview: previewUrl(beat.filename_preview),
    };

    return (
        <BeatDetailClient
            beat={resolvedBeat}
            packTitle={packTitle}
            packSlug={packSlug}
        />
    );
}