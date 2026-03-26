import { apiGet } from './api'

export type FridgeItem = {
  id: string
  rawName: string
  name: string
  quantity: number
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
