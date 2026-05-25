const { transform, normalizePhone, extractTag, extractEquipment } = require('../../src/transform/fub-to-bamboohr');

const basePerson = {
  id: 'fub-001',
  firstName: 'Jane',
  lastName: 'Smith',
  emails: [{ value: 'jane@example.com' }],
  phones: [{ value: '5125550100' }],
  addresses: [{ street: '123 Main St', city: 'Austin', state: 'TX', zip: '78701', country: 'US' }],
  tags: ['Hired-USA', 'Dept-Engineering', 'Equipment-Laptop', 'Equipment-Monitor'],
  customFields: { startDate: '2026-07-01', position: 'Engineer', manager: 'Bob' },
};

describe('normalizePhone', () => {
  test('10-digit raw number', () => {
    expect(normalizePhone('5125550100')).toBe('(512)555-0100');
  });
  test('11-digit with leading 1', () => {
    expect(normalizePhone('15125550100')).toBe('(512)555-0100');
  });
  test('formatted input passthrough', () => {
    expect(normalizePhone('(512)555-0100')).toBe('(512)555-0100');
  });
  test('returns raw value if not 10 digits', () => {
    expect(normalizePhone('123')).toBe('123');
  });
  test('handles null/undefined', () => {
    expect(normalizePhone(null)).toBe(null);
    expect(normalizePhone(undefined)).toBe(undefined);
  });
});

describe('extractTag', () => {
  const tags = ['Hired-USA', 'Dept-Engineering', 'Equipment-Laptop'];
  test('extracts department', () => {
    expect(extractTag(tags, 'Dept-')).toBe('Engineering');
  });
  test('returns null when prefix not found', () => {
    expect(extractTag(tags, 'Missing-')).toBeNull();
  });
});

describe('extractEquipment', () => {
  test('extracts multiple equipment tags', () => {
    const tags = ['Equipment-Laptop', 'Equipment-Monitor', 'Equipment-Badge'];
    expect(extractEquipment(tags)).toEqual(['Laptop', 'Monitor', 'Badge']);
  });
  test('ignores non-equipment tags', () => {
    expect(extractEquipment(['Hired-USA', 'Dept-Sales'])).toEqual([]);
  });
  test('ignores Equipment-International-Shipping', () => {
    expect(extractEquipment(['Equipment-International-Shipping', 'Equipment-Laptop'])).toEqual(['Laptop']);
  });
});

describe('transform', () => {
  test('maps core fields correctly', () => {
    const result = transform(basePerson);
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
    expect(result.workEmail).toBe('jane@example.com');
    expect(result.hireDate).toBe('2026-07-01');
    expect(result.jobTitle).toBe('Engineer');
    expect(result.supervisorId).toBe('Bob');
  });

  test('normalizes phone number', () => {
    const result = transform(basePerson);
    expect(result.mobilePhone).toBe('(512)555-0100');
  });

  test('extracts department from tags', () => {
    const result = transform(basePerson);
    expect(result.department).toBe('Engineering');
  });

  test('extracts equipment from tags', () => {
    const result = transform(basePerson);
    expect(result.customField_equipmentNeeded).toEqual(['Laptop', 'Monitor']);
  });

  test('maps address fields', () => {
    const result = transform(basePerson);
    expect(result.address1).toBe('123 Main St');
    expect(result.city).toBe('Austin');
    expect(result.state).toBe('TX');
    expect(result.zipCode).toBe('78701');
    expect(result.country).toBe('US');
  });

  test('defaults country to US when missing', () => {
    const person = { ...basePerson, addresses: [{ street: '1 St' }] };
    expect(transform(person).country).toBe('US');
  });

  test('stores fub person id', () => {
    expect(transform(basePerson).customField_fubPersonId).toBe('fub-001');
  });

  test('handles missing optional fields gracefully', () => {
    const minimal = { id: 'fub-min', firstName: 'A', lastName: 'B', tags: [] };
    const result = transform(minimal);
    expect(result.department).toBeNull();
    expect(result.hireDate).toBeNull();
    expect(result.customField_equipmentNeeded).toEqual([]);
  });
});
