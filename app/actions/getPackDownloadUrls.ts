// app/actions/getPackDownloadUrls.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type PackSampleDownload = {
  sampleId: string;
  title: string;
  filename: string;
  signedUrl: string;
};

export type GetPackDownloadUrlsResult =
  | { samples: PackSampleDownload[] }
  | { error: string };

export async function getPackDownloadUrls(
  packId: string
): Promise<GetPackDownloadUrlsResult> {
  // Verify the user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Use service client to bypass RLS — user identity already verified above
  const service = createServiceClient();

  // Fetch all library_access rows for this pack
  const { data: allRows, error: accessError } = await service
    .from("library_access")
    .select("id, user_id")
    .eq("pack_id", packId);

  if (accessError) return { error: accessError.message };

  // Verify ownership in JS — avoids potential UUID encoding issues with chained .eq()
  const access = (allRows ?? []).find(
    (row) => row.user_id.trim().toLowerCase() === user.id.trim().toLowerCase()
  );

  if (!access) return { error: "You do not own this pack." };

  // Fetch all samples in this pack via bridge table
  const { data: bridgeRows, error: bridgeError } = await service
    .from("sample_packs")
    .select(`
      sample_id,
      samples (
        id,
        title,
        filename_secure
      )
    `)
    .eq("pack_id", packId);

  if (bridgeError) return { error: bridgeError.message };

  const samples = (bridgeRows ?? [])
    .map((row: any) => row.samples)
    .filter((s: any) => s && s.filename_secure);

  if (samples.length === 0) return { error: "No downloadable files in this pack." };

  // Generate signed URLs for each sample
  const results: PackSampleDownload[] = [];

  for (const sample of samples) {
    const { data: signed, error: signError } = await service.storage
      .from("secure-assets")
      .createSignedUrl(sample.filename_secure, 60 * 30); // 30 min expiry

    if (signError || !signed?.signedUrl) continue;

    results.push({
      sampleId: sample.id,
      title: sample.title,
      filename: sample.filename_secure,
      signedUrl: signed.signedUrl,
    });
  }

  if (results.length === 0) return { error: "Failed to generate download links." };

  return { samples: results };
}