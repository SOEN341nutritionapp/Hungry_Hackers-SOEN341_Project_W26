type UnitFamily = 'mass' | 'volume' | 'count';

const COUNT_UNITS = new Set([
  'ea',
  'each',
  'unit',
  'units',
  'item',
  'items',
  'piece',
  'pieces',
  'pc',
  'pcs',
  'whole',
  'clove',
  'cloves',
  'egg',
  'eggs',
]);

const NAME_STOP_WORDS = new Set([
  'fresh',
  'large',
  'small',
  'medium',
  'organic',
  'salted',
  'unsalted',
  'ground',
  'extra',
  'virgin',
  'lean',
  'boneless',
  'skinless',
  'yellow',
  'red',
  'green',
  'white',
]);

export type ParsedIngredient = {
  name: string;
  normalizedName: string;
  amount: number;
  unit: string;
  baseAmount: number;
  baseUnit: string;
};

export function normalizeInventoryName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => singularizeToken(token))
    .filter((token) => token && !NAME_STOP_WORDS.has(token))
    .join(' ')
    .trim();
}

export function parseIngredient(raw: unknown): ParsedIngredient | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const ingredient = raw as {
    name?: unknown;
    amount?: unknown;
    unit?: unknown;
  };

  if (typeof ingredient.name !== 'string') {
    return null;
  }

  const amount = parseAmountValue(ingredient.amount);
  if (amount === null || amount <= 0) {
    return null;
  }

  const normalizedUnit = normalizeUnit(
    typeof ingredient.unit === 'string' ? ingredient.unit : '',
  );
  const base = convertToBaseAmount(amount, normalizedUnit);
  if (!base) {
    return null;
  }

  return {
    name: ingredient.name.trim(),
    normalizedName: normalizeInventoryName(ingredient.name),
    amount,
    unit: normalizedUnit,
    baseAmount: base.amount,
    baseUnit: base.unit,
  };
}

export function convertToBaseAmount(amount: number, unit?: string | null) {
  const normalizedUnit = normalizeUnit(unit ?? '');

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  switch (normalizedUnit) {
    case 'g':
      return { amount, unit: 'g' };
    case 'kg':
      return { amount: amount * 1000, unit: 'g' };
    case 'lb':
      return { amount: amount * 453.59237, unit: 'g' };
    case 'oz':
      return { amount: amount * 28.349523125, unit: 'g' };
    case 'ml':
      return { amount, unit: 'ml' };
    case 'l':
      return { amount: amount * 1000, unit: 'ml' };
    case 'cup':
      return { amount: amount * 240, unit: 'ml' };
    case 'tbsp':
      return { amount: amount * 15, unit: 'ml' };
    case 'tsp':
      return { amount: amount * 5, unit: 'ml' };
    case 'ea':
      return { amount, unit: 'ea' };
    default:
      return null;
  }
}

export function normalizeUnit(unit?: string | null) {
  const value = (unit ?? '').trim().toLowerCase();

  if (!value) {
    return 'ea';
  }

  if (COUNT_UNITS.has(value)) {
    return 'ea';
  }

  if (value === 'gram' || value === 'grams') {
    return 'g';
  }

  if (value === 'kilogram' || value === 'kilograms') {
    return 'kg';
  }

  if (value === 'milliliter' || value === 'milliliters' || value === 'millilitre' || value === 'millilitres') {
    return 'ml';
  }

  if (value === 'liter' || value === 'liters' || value === 'litre' || value === 'litres') {
    return 'l';
  }

  if (value === 'tablespoon' || value === 'tablespoons') {
    return 'tbsp';
  }

  if (value === 'teaspoon' || value === 'teaspoons') {
    return 'tsp';
  }

  return value;
}

export function formatAmountLabel(amount: number, unit?: string | null) {
  const normalizedUnit = normalizeUnit(unit ?? '');
  const rounded = roundAmount(amount);
  return `${trimTrailingZeroes(rounded)} ${formatUnitForDisplay(normalizedUnit)}`.trim();
}

export function formatUnitForDisplay(unit?: string | null) {
  const normalizedUnit = normalizeUnit(unit ?? '');

  switch (normalizedUnit) {
    case 'ml':
      return 'mL';
    case 'l':
      return 'L';
    default:
      return normalizedUnit;
  }
}

export function deriveVisibleQuantity(
  availableAmount: number,
  unitFactor?: number | null,
  fallbackQuantity = 1,
) {
  if (availableAmount <= 0) {
    return 0;
  }

  if (unitFactor && unitFactor > 0) {
    return Math.max(1, Math.ceil(availableAmount / unitFactor));
  }

  return Math.max(1, Math.round(availableAmount) || fallbackQuantity);
}

export function toBasePackageAmount(unitFactor?: number | null, unit?: string | null) {
  const normalizedUnit = normalizeUnit(unit ?? '');

  if (unitFactor && Number.isFinite(unitFactor) && unitFactor > 0) {
    const converted = convertToBaseAmount(unitFactor, normalizedUnit);
    if (converted) {
      return converted.amount;
    }
  }

  return normalizedUnit === 'ea' ? 1 : null;
}

export function getUnitFamily(unit?: string | null): UnitFamily | null {
  const normalizedUnit = normalizeUnit(unit ?? '');

  if (['g', 'kg', 'lb', 'oz'].includes(normalizedUnit)) {
    return 'mass';
  }

  if (['ml', 'l', 'cup', 'tbsp', 'tsp'].includes(normalizedUnit)) {
    return 'volume';
  }

  if (normalizedUnit === 'ea') {
    return 'count';
  }

  return null;
}

export function ingredientMatchesItem(ingredientName: string, itemName: string) {
  const left = normalizeInventoryName(ingredientName);
  const right = normalizeInventoryName(itemName);

  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return false;
  }

  return [...leftTokens].every((token) => rightTokens.has(token));
}

export function scoreIngredientItemMatch(ingredientName: string, itemName: string) {
  const left = normalizeInventoryName(ingredientName);
  const right = normalizeInventoryName(itemName);

  if (!left || !right) {
    return -1;
  }

  if (left === right) {
    return 1000;
  }

  if (right.includes(left)) {
    return 500 + left.length;
  }

  const leftTokens = left.split(' ').filter(Boolean);
  const rightTokens = right.split(' ').filter(Boolean);
  const overlap = leftTokens.filter((token) => rightTokens.includes(token)).length;

  if (overlap === 0) {
    return -1;
  }

  return overlap * 100 - Math.abs(rightTokens.length - leftTokens.length) * 5;
}

function parseAmountValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) {
    return null;
  }

  if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return Number(cleaned);
  }

  const mixedFraction = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFraction) {
    return (
      Number(mixedFraction[1]) +
      Number(mixedFraction[2]) / Number(mixedFraction[3])
    );
  }

  const fraction = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }

  const numericPrefix = cleaned.match(/^\d+(?:\.\d+)?/);
  if (numericPrefix) {
    return Number(numericPrefix[0]);
  }

  return null;
}

function roundAmount(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function trimTrailingZeroes(value: number) {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

function singularizeToken(token: string) {
  if (token.endsWith('ies') && token.length > 3) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith('es') && token.length > 3) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}
