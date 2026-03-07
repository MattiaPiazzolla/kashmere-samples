// app/actions/getSignedDownloadUrl.ts
"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function getSignedDownloadUrl(
  filename: string,
  downloadName?: string
): Promise<{ url: string } | { error: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from("secure-assets")
    .createSignedUrl(filename, 60 * 60, {
      download: downloadName ?? true,
    });

  if (error || !data?.signedUrl) {
    return { error: "Could not generate download link. Please try again." };
  }

  return { url: data.signedUrl };
}