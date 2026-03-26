import {
  extractSizeLabel,
  normalizeMetroItem,
  simplifyProductName,
} from './fridge-normalizer';

describe('fridge-normalizer', () => {
  it('reduces branded grocery titles to a readable fridge name', () => {
    expect(simplifyProductName('Irresistibles Old Cheddar Cheese 400 g')).toBe(
      'Old Cheddar Cheese',
    );
  });

  it('extracts a clean size label from messy text', () => {
    expect(extractSizeLabel('2 x 200 g $1.25 / 100 g')).toBe('2 x 200 g');
    expect(extractSizeLabel('750ml')).toBe('750 mL');
  });

  it('keeps image url and normalized size fields on a parsed item', () => {
    expect(
      normalizeMetroItem({
        name: 'Selection Rosee Pasta Sauce 700 ml',
        quantity: 2,
        imageUrl: 'https://product-images.metro.ca/images/hed/h86/16134877282334.jpg',
      }),
    ).toEqual({
      rawName: 'Selection Rosee Pasta Sauce 700 ml',
      name: 'Rosee Pasta Sauce',
      normalizedName: 'rosee pasta sauce::700 ml',
      quantity: 2,
      unit: undefined,
      unitFactor: undefined,
      sizeLabel: '700 mL',
      imageUrl: 'https://product-images.metro.ca/images/hed/h86/16134877282334.jpg',
    });
  });
});
