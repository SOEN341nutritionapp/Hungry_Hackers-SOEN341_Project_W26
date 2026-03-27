export type InventoryDimension = 'mass' | 'volume' | 'count'

export type InventoryAmount = {
  value: number
  unit: string
  dimension: InventoryDimension
}

const UNIT_ALIASES: Record<string, { unit: string; dimension: InventoryDimension; factor: number }> = {
  g: { unit: 'g', dimension: 'mass', factor: 1 },
  gram: { unit: 'g', dimension: 'mass', factor: 1 },
  grams: { unit: 'g', dimension: 'mass', factor: 1 },
  kg: { unit: 'g', dimension: 'mass', factor: 1000 },
  kilogram: { unit: 'g', dimension: 'mass', factor: 1000 },
  kilograms: { unit: 'g', dimension: 'mass', factor: 1000 },
  oz: { unit: 'g', dimension: 'mass', factor: 28.3495 },
  ounce: { unit: 'g', dimension: 'mass', factor: 28.3495 },
  ounces: { unit: 'g', dimension: 'mass', factor: 28.3495 },
  lb: { unit: 'g', dimension: 'mass', factor: 453.592 },
  lbs: { unit: 'g', dimension: 'mass', factor: 453.592 },
  pound: { unit: 'g', dimension: 'mass', factor: 453.592 },
  pounds: { unit: 'g', dimension: 'mass', factor: 453.592 },
  ml: { unit: 'ml', dimension: 'volume', factor: 1 },
  milliliter: { unit: 'ml', dimension: 'volume', factor: 1 },
  milliliters: { unit: 'ml', dimension: 'volume', factor: 1 },
  l: { unit: 'ml', dimension: 'volume', factor: 1000 },
  liter: { unit: 'ml', dimension: 'volume', factor: 1000 },
  liters: { unit: 'ml', dimension: 'volume', factor: 1000 },
  litre: { unit: 'ml', dimension: 'volume', factor: 1000 },
  litres: { unit: 'ml', dimension: 'volume', factor: 1000 },
  'fl oz': { unit: 'ml', dimension: 'volume', factor: 29.5735 },
  floz: { unit: 'ml', dimension: 'volume', factor: 29.5735 },
  piece: { unit: 'ea', dimension: 'count', factor: 1 },
  pieces: { unit: 'ea', dimension: 'count', factor: 1 },
  whole: { unit: 'ea', dimension: 'count', factor: 1 },
  ea: { unit: 'ea', dimension: 'count', factor: 1 },
  each: { unit: 'ea', dimension: 'count', factor: 1 },
  un: { unit: 'ea', dimension: 'count', factor: 1 },
  unit: { unit: 'ea', dimension: 'count', factor: 1 },
  units: { unit: 'ea', dimension: 'count', factor: 1 },
}

export function normalizeInventoryName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function inventoryNamesMatch(left: string, right: string) {
  const normalizedLeft = normalizeInventoryName(left)
  const normalizedRight = normalizeInventoryName(right)

  if (!normalizedLeft || !normalizedRight) {
    return false
  }

  if (normalizedLeft === normalizedRight) {
    return true
  }

  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    return true
  }

  const leftTokens = normalizedLeft.split(' ').filter(Boolean)
  const rightTokens = normalizedRight.split(' ').filter(Boolean)

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false
  }

  const shorter = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens
  const longer = leftTokens.length <= rightTokens.length ? rightTokens : leftTokens

  return shorter.every((token) => longer.includes(token))
}

export function normalizeUnit(unit?: string | null) {
  if (!unit) {
    return null
  }

  const normalized = unit.toLowerCase().trim().replace(/\./g, '')
  return UNIT_ALIASES[normalized] ?? null
}

export function convertToInventoryAmount(value: number, unit?: string | null): InventoryAmount | null {
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }

  const normalized = normalizeUnit(unit)
  if (!normalized) {
    return null
  }

  return {
    value: value * normalized.factor,
    unit: normalized.unit,
    dimension: normalized.dimension,
  }
}

export function parseIngredientAmount(amount: string, unit?: string | null): InventoryAmount | null {
  if (!amount) {
    return null
  }

  const numeric = Number.parseFloat(amount.replace(',', '.'))
  return convertToInventoryAmount(numeric, unit)
}

export function formatInventoryAmount(value: number, unit: string) {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '')
  return `${rounded} ${unit}`
}
