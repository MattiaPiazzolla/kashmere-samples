// app/(main)/packs/[slug]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PackDetailClient from "./PackDetailClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const COVERS_BASE = `${SUPABASE_URL}/storage/v1/object/public/covers`;
const PREVIEWS_BASE = `${SUPABASE_URL}/storage/v1/object/public/public-previews`;

function coverUrl(filename: string | null): string | null {
    if (!filename) return null;
    if (filename.startsWith("http")) return filename;
    return `${COVERS_BASE}/${filename}`;
}

function previewUrl(filename: string | null): string | null {
    if (!filename) return null;
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

    const { data: pack } = await supabase
        .from("packs")
        .select("title, description, license_type, cover_image_url")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .maybeSingle();

    if (!pack) return { title: "Pack Not Found" };

    return {
        title: `${pack.title} — KashmereSamples`,
        description: pack.description ?? `${pack.license_type === "EXCLUSIVE" ? "Exclusive" : "Royalty Free"} sample pack`,
        openGraph: {
            title: pack.title,
            description: pack.description ?? undefined,
            images: pack.cover_image_url ? [coverUrl(pack.cover_image_url)] : [],
        },
    };
}

export default async function PackDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch pack
    const { data: pack } = await supabase
        .from("packs")
        .select("id, title, slug, description, cover_image_url, price_full, license_type")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .maybeSingle();

    if (!pack) notFound();

    // Fetch samples via bridge table
    const { data: bridgeRows } = await supabase
        .from("sample_packs")
        .select(`
      sample_id,
      samples (
        id,
        title,
        filename_preview,
        bpm,
        key,
        type,
        subtype,
        duration_sec,
        price_individual,
        has_midi,
        is_published,
        is_deleted
      )
    `)
        .eq("pack_id", pack.id);

    // Filter out unpublished/deleted samples and flatten
    const samples = (bridgeRows ?? [])
        .map((row: any) => row.samples)
        .filter(
            (s: any) => s && s.is_published === true && s.is_deleted === false
        )
        .map((s: any) => ({
            ...s,
            filename_preview: previewUrl(s.filename_preview),
        }));

    const resolvedPack = {
        ...pack,
        cover_image_url: coverUrl(pack.cover_image_url),
    };

    return (
        <PackDetailClient
            pack={resolvedPack}
            samples={samples}
            previewBaseUrl={PREVIEWS_BASE}
        />
    );
}