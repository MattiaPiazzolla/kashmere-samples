import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

const COVERS_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers`

function coverImageUrl(filename: string | null): string[] {
  if (!filename) return []
  if (filename.startsWith('http')) return [filename]
  return [`${COVERS_BASE}/${filename}`]
}

type CartBeatItem = {
  type: 'beat'
  beatId: string
  licenseType: 'ROYALTY_FREE' | 'EXCLUSIVE'
}

type CartPackItem = {
  type: 'pack'
  packId: string
}

type CartItem = CartBeatItem | CartPackItem

export async function POST(req: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Called from a Server Component — safe to ignore
            }
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const userId = session?.user?.id ?? null

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const cartMeta: object[] = []

    for (const item of items) {
      if (item.type === 'beat') {
        const { data: beat, error } = await supabase
          .from('beats')
          .select('id, title, price_lease, price_exclusive, license_type, is_published, is_deleted, cover_image_url, bpm, key')
          .eq('id', item.beatId)
          .eq('is_published', true)
          .eq('is_deleted', false)
          .single()

        if (error || !beat) {
          return NextResponse.json(
            { error: `Beat not found or unavailable: ${item.beatId}` },
            { status: 404 }
          )
        }

        if (beat.license_type === 'EXCLUSIVE' && item.licenseType !== 'EXCLUSIVE') {
          return NextResponse.json(
            { error: `Beat "${beat.title}" is exclusive only` },
            { status: 400 }
          )
        }

        const price =
          item.licenseType === 'EXCLUSIVE'
            ? beat.price_exclusive
            : beat.price_lease

        if (!price) {
          return NextResponse.json(
            { error: `No price set for "${beat.title}" (${item.licenseType})` },
            { status: 400 }
          )
        }

        const licenseName = item.licenseType === 'EXCLUSIVE' ? 'Exclusive' : 'Lease'

        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(price) * 100),
            product_data: {
              name: `${beat.title} – ${licenseName}`,
              description: [
                `License: ${licenseName}`,
                beat.bpm ? `${beat.bpm} BPM` : null,
                beat.key ? `Key: ${beat.key}` : null,
                'KashmereSamples beat.',
              ]
                .filter(Boolean)
                .join(' · '),
              images: coverImageUrl(beat.cover_image_url),
            },
          },
          quantity: 1,
        })

        cartMeta.push({
          type: 'beat',
          beatId: beat.id,
          licenseType: item.licenseType,
          pricePaid: Number(price),
        })
      }

      if (item.type === 'pack') {
        const { data: pack, error } = await supabase
          .from('packs')
          .select('id, title, price_full, license_type, is_published, is_deleted, cover_image_url')
          .eq('id', item.packId)
          .eq('is_published', true)
          .eq('is_deleted', false)
          .single()

        if (error || !pack) {
          return NextResponse.json(
            { error: `Pack not found or unavailable: ${item.packId}` },
            { status: 404 }
          )
        }

        const licenseName = pack.license_type === 'EXCLUSIVE' ? 'Exclusive' : 'Royalty Free'

        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(pack.price_full) * 100),
            product_data: {
              name: `${pack.title} – ${licenseName}`,
              description: `License: ${licenseName} · KashmereSamples sample pack.`,
              images: coverImageUrl(pack.cover_image_url),
            },
          },
          quantity: 1,
        })

        cartMeta.push({
          type: 'pack',
          packId: pack.id,
          licenseType: pack.license_type,
          pricePaid: Number(pack.price_full),
        })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: lineItems,
      success_url: `${baseUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/order-confirmation?cancelled=true`,
      metadata: {
        user_id: userId ?? '',
        cart: JSON.stringify(cartMeta),
      },
    }

    if (session?.user?.email) {
      sessionParams.customer_email = session.user.email

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId!)
        .single()

      if (profile?.stripe_customer_id) {
        delete sessionParams.customer_email
        sessionParams.customer = profile.stripe_customer_id
      }
    } else {
      sessionParams.customer_creation = 'always'
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[stripe-checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}