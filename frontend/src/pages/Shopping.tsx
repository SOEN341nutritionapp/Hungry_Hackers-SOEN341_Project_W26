import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getFridge, type FridgeItem, type FridgeResponse } from '../fridgeClient'

const SHELF_LABELS = ['Upper Shelf', 'Fresh Shelf', 'Dinner Shelf', 'Door Rack']

function formatSyncTime(value: string | null) {
  if (!value) {
    return 'Not synced yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatItemSize(item: FridgeItem) {
  if (item.sizeLabel) {
    return item.sizeLabel
  }

  if (item.unitFactor && item.unit) {
    return `${item.unitFactor} ${formatUnitForDisplay(item.unit)}`
  }

  if (item.unit) {
    return formatUnitForDisplay(item.unit)
  }

  return 'Size not listed'
}

function formatUnitForDisplay(unit: string) {
  switch (unit.toLowerCase()) {
    case 'ml':
      return 'mL'
    case 'l':
      return 'L'
    case 'ea':
    case 'each':
    case 'un':
      return 'ea'
    default:
      return unit.toLowerCase()
  }
}

function chunkIntoShelves(items: FridgeItem[], size: number) {
  const shelves: FridgeItem[][] = []

  for (let index = 0; index < items.length; index += size) {
    shelves.push(items.slice(index, index + size))
  }

  return shelves
}

export default function Shopping() {
  const { accessToken } = useAuth()
  const [fridge, setFridge] = useState<FridgeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})

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
      setBrokenImages({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fridge items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFridge()
  }, [accessToken])

  const shelves = chunkIntoShelves(fridge?.items ?? [], 3)

  return (
    <div className="max-w-6xl space-y-6 animate-fadeIn">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[#b7e0c4] bg-[linear-gradient(135deg,#f8fff8_0%,#eaf9ee_45%,#d9f2e0_100%)] p-6 shadow-[0_24px_70px_rgba(22,101,52,0.10)] md:p-8">
        <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,#ffffff_0%,rgba(255,255,255,0)_72%)]" />
        <div className="absolute bottom-0 left-0 h-36 w-56 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.18)_0%,rgba(34,197,94,0)_72%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex rounded-full border border-[#b8e3c6] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-primary shadow-sm backdrop-blur">
              Your Digital Fridge
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#14532d] md:text-5xl">
              Your Digital Fridge
            </h1>
            <p className="text-sm font-medium text-[#166534]/80 md:text-base">
              Clean shelves. Clear items. Fast scan.
            </p>
          </div>

          <div className="rounded-[1.9rem] border border-white/90 bg-white/80 p-5 text-[#14532d] shadow-[0_18px_45px_rgba(22,101,52,0.10)] backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Last Updated</p>
            <p className="mt-2 text-lg font-black">{formatSyncTime(fridge?.syncedAt ?? null)}</p>
            <button
              type="button"
              onClick={loadFridge}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.9rem] border border-[#d6eadb] bg-white p-5 shadow-[0_16px_36px_rgba(22,101,52,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary/80">Total Products</p>
          <p className="mt-3 text-4xl font-black text-[#14532d]">{fridge?.count ?? 0}</p>
        </div>
        <div className="rounded-[1.9rem] border border-[#d6eadb] bg-white p-5 shadow-[0_16px_36px_rgba(22,101,52,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary/80">Last Updated</p>
          <p className="mt-3 text-lg font-bold text-[#14532d]">{formatSyncTime(fridge?.syncedAt ?? null)}</p>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-[#d7ecdd] bg-[linear-gradient(180deg,#ffffff_0%,#f3fbf5_100%)] p-6 shadow-[0_24px_60px_rgba(22,101,52,0.08)] md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Kitchen Shelves</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#14532d]">Fridge Inventory</h2>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-full border border-[#d6eadb] bg-white px-5 py-3 text-sm font-bold text-[#166534] transition hover:bg-[#f6fdf7]"
          >
            View profile
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[2rem] border border-error/20 bg-error/10 p-4 text-error">
            {error}
          </div>
        ) : fridge && fridge.items.length > 0 ? (
          <div className="mt-8 space-y-5">
            {shelves.map((shelf, shelfIndex) => (
              <div
                key={SHELF_LABELS[shelfIndex] ?? `Shelf ${shelfIndex + 1}`}
                className="relative overflow-hidden rounded-[2.2rem] border border-[#d6eadb] bg-[linear-gradient(180deg,#fafffb_0%,#eff8f1_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_45px_rgba(22,101,52,0.07)] md:p-5"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/80">
                      {SHELF_LABELS[shelfIndex] ?? `Shelf ${shelfIndex + 1}`}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#166534]/70">
                      {shelf.length} {shelf.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="h-3 w-28 rounded-full bg-[linear-gradient(90deg,rgba(34,197,94,0.12),rgba(34,197,94,0.38),rgba(34,197,94,0.12))]" />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {shelf.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[1.9rem] border border-white/90 bg-white/90 p-4 shadow-[0_18px_38px_rgba(22,101,52,0.10)] backdrop-blur-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,#f7fff8_0%,#e5f7e9_100%)] ring-1 ring-[#cde8d4]">
                          {item.imageUrl && !brokenImages[item.id] ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenImages((current) => ({ ...current, [item.id]: true }))
                              }
                            />
                          ) : (
                            <div className="text-3xl font-black text-primary/55">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-lg font-black leading-6 text-[#14532d]">
                                {item.name}
                              </h3>
                              <p className="mt-1 text-sm font-medium text-[#166534]/70">
                                {formatItemSize(item)}
                              </p>
                            </div>
                            <div className="rounded-full bg-[linear-gradient(135deg,#22c55e_0%,#16a34a_100%)] px-3 py-2 text-sm font-black text-white shadow-[0_10px_20px_rgba(34,197,94,0.24)]">
                              x{item.quantity}
                            </div>
                          </div>

                          <p className="mt-3 text-sm text-[#166534]/75">
                            {item.name} &middot; {formatItemSize(item)} &middot; x{item.quantity}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-x-6 bottom-3 h-3 rounded-full bg-[linear-gradient(90deg,rgba(34,197,94,0.10),rgba(34,197,94,0.24),rgba(34,197,94,0.10))] blur-sm" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[2.2rem] border border-dashed border-[#cfe7d6] bg-[#f8fff9] p-6">
            <h3 className="text-xl font-black text-[#14532d]">No fridge items yet</h3>
          </div>
        )}
      </section>
    </div>
  )
}
