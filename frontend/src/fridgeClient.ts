import { apiDelete, apiGet, apiPatch } from './api'

export type FridgeItem = {
  id: string
  rawName: string
  name: string
  quantity: number
  availableAmount: number
  availableLabel?: string | null
  unit?: string | null
  unitFactor?: number | null
  sizeLabel?: string | null
  imageUrl?: string | null
  source: string
  syncedAt: string
}

export type FridgeResponse = {
  count: number
  syncedAt: string | null
  items: FridgeItem[]
}

export async function getFridge(token?: string) {
  return apiGet<FridgeResponse>('/metro/fridge', token)
}

export async function updateFridgeItem(
  id: string,
  updates: { quantityDelta?: number; availableAmount?: number },
  token?: string,
) {
  return apiPatch<{ ok: boolean; removed: boolean; item?: FridgeItem }>(
    `/metro/fridge/${id}`,
    updates,
    token,
  )
}

export async function deleteFridgeItem(id: string, token?: string) {
  return apiDelete<{ ok: boolean }>(`/metro/fridge/${id}`, token)
}
