import {
  convertToInventoryAmount,
  normalizeInventoryName,
  parseIngredientAmount,
} from './inventory-utils'

describe('inventory-utils', () => {
  it('normalizes names for fridge and recipe matching', () => {
    expect(normalizeInventoryName('Extra Old Cheddar Cheese')).toBe('extra old cheddar cheese')
    expect(normalizeInventoryName('  Crème  fraîche ')).toBe('creme fraiche')
  })

  it('converts package units to inventory base units', () => {
    expect(convertToInventoryAmount(0.5, 'kg')).toEqual({
      value: 500,
      unit: 'g',
      dimension: 'mass',
    })

    expect(convertToInventoryAmount(2, 'L')).toEqual({
      value: 2000,
      unit: 'ml',
      dimension: 'volume',
    })
  })

  it('parses recipe ingredient amounts into the same base units', () => {
    expect(parseIngredientAmount('200', 'g')).toEqual({
      value: 200,
      unit: 'g',
      dimension: 'mass',
    })

    expect(parseIngredientAmount('1', 'piece')).toEqual({
      value: 1,
      unit: 'ea',
      dimension: 'count',
    })
  })
})
