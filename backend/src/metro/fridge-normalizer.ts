const BRAND_PREFIXES = [
  'metro',
  'selection',
  'irresistibles',
  'personnelle',
  'life smart',
  'cuisine adventures',
  'super c',
  'our finest',
  "president's choice",
  'presidents choice',
  'pc',
  'compliments',
  'no name',
  'great value',
];

const LEADING_NOISE = new Set([
  'brand',
  'grocery',
  'product',
  'prepared',
  'meal',
  'kit',
]);

const TRAILING_NOISE = new Set([
  'pack',
  'bags',
  'bag',
  'box',
  'bottle',
  'bottles',
  'carton',
  'container',
  'jar',
  'pkg',
  'package',
  'tray',
  'tub',
]);

const SIMPLE_SIZE_REGEX =
  /\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz|ea|each|un)\b/i;
const COMBO_SIZE_REGEX =
  /\b\d+\s*[xX]\s*\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz)\b/i;
const ANY_SIZE_REGEX =
  /\b\d+\s*[xX]\s*\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz)\b|\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz|ea|each|un)\b/gi;

type NormalizeMetroItemInput = {
  name: string;
  quantity: number;
  unit?: string;
  unitFactor?: number;
  sizeLabel?: string;
  imageUrl?: string;
};

export type NormalizedMetroItem = {
  rawName: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit?: string;
  unitFactor?: number;
  sizeLabel?: string;
  imageUrl?: string;
};

export function normalizeMetroItem(
  item: NormalizeMetroItemInput,
): NormalizedMetroItem | null {
  const rawName = normalizeWhitespace(item.name);

  if (!rawName) {
    return null;
  }

  const extractedSizeLabel = extractSizeLabel(rawName);
  const sizeLabel =
    normalizeSizeLabel(item.sizeLabel) ??
    buildSizeLabelFromUnit(item.unitFactor, item.unit) ??
    extractedSizeLabel;

  const displayName = simplifyProductName(rawName);
  const normalizedName = createNormalizedKey(displayName, sizeLabel);

  return {
    rawName,
    name: displayName,
    normalizedName,
    quantity: item.quantity,
    unit: normalizeUnit(item.unit),
    unitFactor: normalizeUnitFactor(item.unitFactor),
    sizeLabel,
    imageUrl: sanitizeImageUrl(item.imageUrl),
  };
}

export function simplifyProductName(rawName: string) {
  const source = normalizeWhitespace(rawName);
  const segments = source
    .split(/\s+\|\s+|\s+-\s+|\s+\/\s+|,\s*/g)
    .map((segment) => cleanupSegment(segment))
    .filter(Boolean);

  const bestSegment = [...segments].sort((left, right) => {
    return scoreSegment(right) - scoreSegment(left);
  })[0];

  const candidate = bestSegment || cleanupSegment(source) || source;
  const withoutTrailingNoise = stripTrailingNoiseWords(candidate);
  const compact = normalizeWhitespace(withoutTrailingNoise) || source;

  return applyReadableCase(compact);
}

export function extractSizeLabel(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const comboMatch = value.match(COMBO_SIZE_REGEX);
  if (comboMatch?.[0]) {
    return normalizeSizeLabel(comboMatch[0]);
  }

  const simpleMatch = value.match(SIMPLE_SIZE_REGEX);
  if (simpleMatch?.[0]) {
    return normalizeSizeLabel(simpleMatch[0]);
  }

  return undefined;
}

function cleanupSegment(segment: string) {
  let value = normalizeWhitespace(segment);
  if (!value) {
    return '';
  }

  value = value.replace(/\([^)]*\)/g, ' ');
  value = value.replace(ANY_SIZE_REGEX, ' ');
  value = value.replace(/\b\d+\s*(?:pack|ct|count)\b/gi, ' ');
  value = stripBrandPrefix(value);
  value = stripLeadingNoiseWords(value);
  value = value.replace(/[|/]+/g, ' ');
  value = value.replace(/\s{2,}/g, ' ');

  return value.trim();
}

function stripBrandPrefix(value: string) {
  let output = value.trim();
  let changed = true;

  while (changed) {
    changed = false;

    for (const prefix of BRAND_PREFIXES) {
      const matcher = new RegExp(`^${escapeForRegex(prefix)}\\b\\s*`, 'i');
      if (matcher.test(output)) {
        output = output.replace(matcher, '').trim();
        changed = true;
      }
    }
  }

  return output;
}

function stripLeadingNoiseWords(value: string) {
  const words = value.split(/\s+/);
  while (words.length > 0 && LEADING_NOISE.has(words[0].toLowerCase())) {
    words.shift();
  }

  return words.join(' ');
}

function stripTrailingNoiseWords(value: string) {
  const words = value.split(/\s+/);
  while (words.length > 1 && TRAILING_NOISE.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }

  return words.join(' ');
}

function scoreSegment(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  const letters = value.replace(/[^a-zA-Z\u00C0-\u017F]/g, '').length;
  return letters + words.length * 4;
}

function buildSizeLabelFromUnit(unitFactor?: number, unit?: string) {
  const normalizedUnit = normalizeUnit(unit);
  const normalizedUnitFactor = normalizeUnitFactor(unitFactor);

  if (!normalizedUnit || !normalizedUnitFactor) {
    return undefined;
  }

  return `${normalizedUnitFactor} ${formatUnitForDisplay(normalizedUnit)}`;
}

function normalizeUnit(unit?: string | null) {
  if (!unit) {
    return undefined;
  }

  const normalized = unit.trim().toLowerCase();

  if (normalized === 'each' || normalized === 'un') {
    return 'ea';
  }

  return normalized || undefined;
}

function normalizeUnitFactor(unitFactor?: number | null) {
  if (!unitFactor || !Number.isFinite(unitFactor) || unitFactor < 1) {
    return undefined;
  }

  return Math.round(unitFactor);
}

function normalizeSizeLabel(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = normalizeWhitespace(value)
    .replace(/\s*[xX]\s*/g, ' x ')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.replace(
    /\b(g|kg|ml|l|lb|oz|ea|each|un)\b/gi,
    (unit) => formatUnitForDisplay(unit.toLowerCase()),
  );
}

function sanitizeImageUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }

  if (/icon-no-picture|placeholder/i.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function createNormalizedKey(name: string, sizeLabel?: string) {
  return [name, sizeLabel]
    .filter(Boolean)
    .map((value) =>
      value!
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim(),
    )
    .join('::');
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function applyReadableCase(value: string) {
  const hasMixedCase =
    value.toLowerCase() !== value && value.toUpperCase() !== value;

  if (hasMixedCase) {
    return value;
  }

  return value
    .toLowerCase()
    .replace(/\b([a-z\u00C0-\u017F])/g, (letter) => letter.toUpperCase());
}

function formatUnitForDisplay(unit: string) {
  switch (unit.toLowerCase()) {
    case 'ml':
      return 'mL';
    case 'l':
      return 'L';
    case 'ea':
    case 'each':
    case 'un':
      return 'ea';
    default:
      return unit.toLowerCase();
  }
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
