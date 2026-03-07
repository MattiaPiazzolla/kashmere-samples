// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
});

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}



export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  // TEMP DEBUG — remove after fix
  console.log("webhookSecret loaded:", webhookSecret ? `${webhookSecret.slice(0, 10)}...` : "MISSING");
  console.log("signature present:", !!signature);


  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutCompleted(session);
    } catch (err) {
      console.error("Error handling checkout.session.completed:", err);
      return NextResponse.json(
        { error: "Webhook handler failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

// Matches the shape cartMeta.push() builds in the checkout route
type CartMetaItem = {
  type: "beat" | "pack";
  beatId?: string;
  packId?: string;
  licenseType: "ROYALTY_FREE" | "EXCLUSIVE";
  pricePaid: number;
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  const guestEmail = session.customer_details?.email ?? null;
  const stripeSessionId = session.id;
  const totalAmount = (session.amount_total ?? 0) / 100;

  // Checkout route stores items under "cart" key
  const rawCart = session.metadata?.cart;
  if (!rawCart) {
    console.warn("No cart metadata on session:", stripeSessionId);
    return;
  }

  let items: CartMetaItem[];
  try {
    items = JSON.parse(rawCart);
  } catch {
    console.error("Failed to parse cart metadata:", rawCart);
    return;
  }

  // Resolve user_id from email if they have a profile
  let userId: string | null = session.metadata?.user_id || null;
  if (!userId && guestEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", guestEmail)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  // 1. Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId ?? null,
      guest_email: userId ? null : guestEmail,
      stripe_session_id: stripeSessionId,
      total_amount: totalAmount,
      status: "PAID",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message}`);
  }

  const orderId = order.id;

  // 2. Insert order_items + library_access per item
  for (const item of items) {
    const isBeat = item.type === "beat";
    const isPack = item.type === "pack";

    const orderItemPayload = {
      order_id: orderId,
      beat_id: isBeat ? item.beatId : null,
      pack_id: isPack ? item.packId : null,
      sample_id: null,
      license_type: item.licenseType,
      price_paid: item.pricePaid,
    };

    const libraryPayload = {
      user_id: userId ?? null,
      guest_email: userId ? null : guestEmail,
      beat_id: isBeat ? item.beatId : null,
      pack_id: isPack ? item.packId : null,
      sample_id: null,
      source: `ORDER:${orderId}`,
      claimed: false,
    };

    const { error: itemError } = await supabase
      .from("order_items")
      .insert(orderItemPayload);

    if (itemError) {
      throw new Error(`Failed to create order_item: ${itemError.message}`);
    }

    const { error: libraryError } = await supabase
      .from("library_access")
      .insert(libraryPayload);

    if (libraryError) {
      throw new Error(`Failed to create library_access: ${libraryError.message}`);
    }

    // 3. Exclusive beat — unpublish after confirmed purchase
    if (isBeat && item.licenseType === "EXCLUSIVE" && item.beatId) {
      await supabase
        .from("beats")
        .update({ is_published: false })
        .eq("id", item.beatId);
    }
  }

  console.log(
    `✅ Order ${orderId} created — ${items.length} item(s) — ${guestEmail ?? userId}`
  );
}