import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import SamplesTable from "./_components/SamplesTable";
import DeletedSamples from "./_components/DeletedSamples";

export const metadata = { title: "Samples — Kashmere Admin" };

export default async function AdminSamplesPage() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const sampleSelect = `
    id, title, type, subtype, bpm, key, duration_sec,
    price_individual, has_midi, is_published, is_deleted,
    filename_preview, filename_secure, midi_filename_secure, created_at,
    sample_packs (
      pack_id,
      packs ( id, title, cover_image_url )
    )
  `;

    // Fetch all active samples with their packs via bridge table
    const { data: activeSamples } = await supabase
        .from("samples")
        .select(sampleSelect)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

    // Fetch soft-deleted samples
    const { data: deletedSamples } = await supabase
        .from("samples")
        .select(sampleSelect)
        .eq("is_deleted", true)
        .order("created_at", { ascending: false });

    // Fetch all packs for the form pack selector
    const { data: packs } = await supabase
        .from("packs")
        .select("id, title")
        .eq("is_deleted", false)
        .order("title", { ascending: true });

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Samples</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        All samples across all packs.
                    </p>
                </div>
            </div>

            {/* Active samples */}
            <SamplesTable
                samples={(activeSamples as any) ?? []}
                packs={packs ?? []}
            />

            {/* Deleted samples */}
            {(deletedSamples?.length ?? 0) > 0 && (
                <DeletedSamples
                    samples={(deletedSamples as any) ?? []}
                    packs={packs ?? []}
                />
            )}
        </div>
    );
}