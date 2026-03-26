import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getFridge, type FridgeResponse } from '../fridgeClient'

function formatSyncTime(value: string | null) {
  if (!value) {
    return 'Not synced yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function Shopping() {
  const { accessToken } = useAuth()
  const [fridge, setFridge] = useState<FridgeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFridge = async () => {
    if (!accessToken) {
      setFridge(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getFridge(accessToken)
      setFridge(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fridge items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFridge()
  }, [accessToken])

  const totalUnits = fridge?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <div className="max-w-5xl space-y-6 animate-fadeIn">
      <section className="rounded-[2rem] border border-base-300 bg-gradient-to-br from-emerald-500 to-lime-400 p-6 text-primary-content shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-950/70">
              Metro Sync
            </p>
            <h1 className="text-4xl font-black tracking-tight text-emerald-950">
              Your digital fridge
            </h1>
            <p className="max-w-2xl text-base text-emerald-950/80">
              Sync the groceries from your Metro cart, then review what is stored for your account here.
            </p>
          </div>

          <button
            type="button"
            onClick={loadFridge}
            className="btn border-0 bg-emerald-950 text-white hover:bg-emerald-900"
          >
            Refresh fridge
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-50">Products synced</p>
          <p className="mt-3 text-4xl font-black">{fridge?.count ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-50">Total units</p>
          <p className="mt-3 text-4xl font-black">{totalUnits}</p>
        </div>
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-50">Last sync</p>
          <p className="mt-3 text-lg font-bold">{formatSyncTime(fridge?.syncedAt ?? null)}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Fridge items</h2>
            <p className="text-sm opacity-70">Each line is tied to your signed-in MealMajor account.</p>
          </div>
          <Link to="/profile" className="btn btn-ghost rounded-2xl">
            View profile
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-3xl border border-error/20 bg-error/10 p-4 text-error">
            {error}
          </div>
        ) : fridge && fridge.items.length > 0 ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {fridge.items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-base-300 bg-base-200/40 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{item.name}</h3>
                    <p className="text-sm opacity-60">
                      {item.unitFactor && item.unit ? `${item.unitFactor} ${item.unit}` : item.unit || 'Unit not specified'}
                    </p>
                  </div>
                  <div className="badge badge-primary badge-lg rounded-full px-4 py-4 font-bold">
                    x{item.quantity}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[2rem] border border-dashed border-base-300 bg-base-200/50 p-6">
            <h3 className="text-xl font-bold">No fridge items yet</h3>
            <p className="mt-2 max-w-2xl text-sm opacity-70">
              Sign in to MealMajor, keep the app open, then open your Metro cart and click the extension&apos;s
              sync button. The imported item count will appear here after the sync succeeds.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
