// lib/tokens/guestDownloadToken.ts
import { createServiceClient } from "@/lib/supabase/service";

export async function createGuestDownloadToken(
  orderId: string
): Promise<string> {
  const supabase = createServiceClient();

  // Generate a secure random token
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("guest_download_tokens").insert({
    token,
    order_id: orderId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create guest download token: ${error.message}`);
  }

  return token;
}