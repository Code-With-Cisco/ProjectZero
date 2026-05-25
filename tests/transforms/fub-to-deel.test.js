const { transform, extractCountryCode } = require('../../src/transform/fub-to-deel');

const basePerson = {
  id: 'fub-002',
  firstName: 'Carlos',
  lastName: 'Rivera',
  emails: [{ value: 'carlos@example.com' }],
  phones: [{ value: '5125550200' }],
  addresses: [{ street: '10 Rue de Rivoli', city: 'Paris', state: '', zip: '75001', country: 'France' }],
  tags: ['Hired-International', 'Dept-Sales', 'Equipment-Laptop'],
  customFields: { startDate: '2026-08-15', position: 'Account Executive' },
};

describe('extractCountryCode', () => {
  test('returns ISO code when 2-letter country is provided', () => {
    expect(extractCountryCode({ country: 'FR' })).toBe('FR');
  });

  test('maps country name to ISO code', () => {
    expect(extractCountryCode({ country: 'France' })).toBe('FR');
    expect(extractCountryCode({ country: 'Germany' })).toBe('DE');
    expect(extractCountryCode({ country: 'United Kingdom' })).toBe('GB');
    expect(extractCountryCode({ country: 'Singapore' })).toBe('SG');
  });

  test('falls back to parsing city field like "Paris, France"', () => {
    expect(extractCountryCode({ city: 'Paris, France' })).toBe('FR');
  });

  test('returns null for unknown country', () => {
    expect(extractCountryCode({ country: 'Narnia' })).toBeNull();
  });

  test('returns null for null address', () => {
    expect(extractCountryCode(null)).toBeNull();
  });
});

describe('transform', () => {
  test('maps core fields', () => {
    const result = transform(basePerson);
    expect(result.firstName).toBe('Carlos');
    expect(result.lastName).toBe('Rivera');
    expect(result.email).toBe('carlos@example.com');
    expect(result.jobTitle).toBe('Account Executive');
    expect(result.startDate).toBe('2026-08-15');
  });

  test('extracts department from tags', () => {
    expect(transform(basePerson).department).toBe('Sales');
  });

  test('resolves country code from country name', () => {
    const result = transform(basePerson);
    expect(result.countryCode).toBe('FR');
    expect(result.address.country).toBe('FR');
  });

  test('maps address subfields', () => {
    const result = transform(basePerson);
    expect(result.address.street).toBe('10 Rue de Rivoli');
    expect(result.address.city).toBe('Paris');
    expect(result.address.postalCode).toBe('75001');
  });

  test('includes required Deel defaults', () => {
    const result = transform(basePerson);
    expect(result.seniorityLevel).toBe('mid');
    expect(result.contractType).toBe('fixed');
  });

  test('stores fub person id', () => {
    expect(transform(basePerson).fubPersonId).toBe('fub-002');
  });

  test('handles missing optional fields gracefully', () => {
    const minimal = { id: 'fub-min', firstName: 'A', lastName: 'B', tags: [], addresses: [] };
    const result = transform(minimal);
    expect(result.department).toBeNull();
    expect(result.countryCode).toBeNull();
    expect(result.startDate).toBeNull();
  });
});
