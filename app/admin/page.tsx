// app/admin/page.tsx
import { createServiceClient } from '@/lib/supabase/service'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminDashboardPage() {
  const supabase = createServiceClient()

  // 1. Total revenue from PAID orders
  const { data: revenueRows } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'PAID')

  const totalRevenue = (revenueRows ?? []).reduce(
    (sum, row) => sum + Number(row.total_amount),
    0
  )

  const totalOrders = (revenueRows ?? []).length

  // 2. Recent 10 orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, user_id, guest_email, total_amount, status, created_at, profiles(email)')
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. Top-selling beats
  const { data: beatItems } = await supabase
    .from('order_items')
    .select('beat_id, beats(title)')
    .not('beat_id', 'is', null)

  const beatCounts: Record<string, { title: string; count: number }> = {}
  for (const item of beatItems ?? []) {
    if (!item.beat_id) continue
    const title = (item.beats as any)?.title ?? 'Unknown'
    if (!beatCounts[item.beat_id]) beatCounts[item.beat_id] = { title, count: 0 }
    beatCounts[item.beat_id].count++
  }

  const topBeats = Object.entries(beatCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, data]) => ({ id, ...data }))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100 mb-1">Dashboard</h1>
        <p className="text-sm text-neutral-500">Store overview and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-3xl font-black text-white">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Paid Orders</p>
          <p className="text-3xl font-black text-white">{totalOrders}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Avg. Order Value</p>
          <p className="text-3xl font-black text-white">
            {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-base font-semibold text-neutral-200 mb-4">Recent Orders</h2>
          <div className="rounded-xl border border-neutral-800 divide-y divide-neutral-800 overflow-hidden">
            {!recentOrders || recentOrders.length === 0 ? (
              <p className="text-sm text-neutral-500 p-4">No orders yet.</p>
            ) : (
              recentOrders.map((order) => {
                const email = (order.profiles as any)?.email ?? order.guest_email ?? '—'
                const isGuest = !order.user_id
                return (
                  <div key={order.id} className="flex items-center justify-between px-4 py-3 bg-neutral-900 hover:bg-neutral-800/60 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-neutral-500">{formatDate(order.created_at)}</p>
                        {isGuest && <span className="text-xs text-neutral-600 bg-neutral-800 px-1.5 py-0.5 rounded">guest</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${order.status === 'PAID' ? 'bg-emerald-900/40 text-emerald-400' : order.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white ml-4 shrink-0">{formatCurrency(Number(order.total_amount))}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-neutral-200 mb-4">Top-Selling Beats</h2>
          <div className="rounded-xl border border-neutral-800 divide-y divide-neutral-800 overflow-hidden">
            {topBeats.length === 0 ? (
              <p className="text-sm text-neutral-500 p-4">No sales data yet.</p>
            ) : (
              topBeats.map((beat, i) => (
                <div key={beat.id} className="flex items-center gap-4 px-4 py-3 bg-neutral-900 hover:bg-neutral-800/60 transition-colors">
                  <span className="text-xs text-neutral-600 w-4 shrink-0">{i + 1}</span>
                  <p className="text-sm text-white flex-1 truncate">{beat.title}</p>
                  <span className="text-xs text-neutral-400 shrink-0">{beat.count} {beat.count === 1 ? 'sale' : 'sales'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}