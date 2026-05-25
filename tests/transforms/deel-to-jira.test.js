const { transform, shippingSubtask } = require('../../src/transform/deel-to-jira');
const { FIELD } = require('../../src/transform/bamboohr-to-jira');

const deelContract = {
  id: 'deel-001',
  firstName: 'Carlos',
  lastName: 'Rivera',
  email: 'carlos@example.com',
  jobTitle: 'Account Executive',
  department: 'Sales',
  startDate: '2026-08-15',
  countryCode: 'FR',
  address: { city: 'Paris', postalCode: '75001', country: 'FR' },
};

const fubPerson = {
  emails: [{ value: 'carlos@personal.com' }],
  phones: [{ value: '5125550200' }],
  addresses: [{ street: '10 Rue de Rivoli', city: 'Paris', zip: '75001', country: 'FR' }],
  tags: ['Hired-International', 'Equipment-Laptop', 'Equipment-International-Shipping'],
};

describe('deel-to-jira transform', () => {
  test('sets correct project and issue type', () => {
    const result = transform(deelContract, fubPerson);
    expect(result.fields.project.key).toBe('OB');
    expect(result.fields.issuetype.name).toBe('Employee Onboarding');
  });

  test('summary includes name and country code', () => {
    const result = transform(deelContract, fubPerson);
    expect(result.fields.summary).toContain('Carlos Rivera');
    expect(result.fields.summary).toContain('FR');
  });

  test('sets region to International', () => {
    expect(transform(deelContract, fubPerson).fields[FIELD.region]).toBe('International');
  });

  test('maps name fields', () => {
    const result = transform(deelContract, fubPerson);
    expect(result.fields[FIELD.firstName]).toBe('Carlos');
    expect(result.fields[FIELD.lastName]).toBe('Rivera');
  });

  test('uses personal email from FUB', () => {
    const result = transform(deelContract, fubPerson);
    expect(result.fields[FIELD.personalEmail]).toBe('carlos@personal.com');
  });

  test('extracts equipment — excludes International-Shipping tag', () => {
    const result = transform(deelContract, fubPerson);
    expect(result.fields[FIELD.equipment]).toEqual(['Laptop']);
    expect(result.fields[FIELD.equipment]).not.toContain('International-Shipping');
  });

  test('includes Deel contract ID in notes', () => {
    const result = transform(deelContract, fubPerson);
    expect(result.fields[FIELD.notes]).toContain('deel-001');
  });
});

describe('shippingSubtask', () => {
  test('sets Highest priority', () => {
    const result = shippingSubtask('OB-1', deelContract);
    expect(result.fields.priority.name).toBe('Highest');
  });

  test('summary contains RUSH and country code', () => {
    const result = shippingSubtask('OB-1', deelContract);
    expect(result.fields.summary).toContain('RUSH');
    expect(result.fields.summary).toContain('FR');
  });

  test('summary contains worker name', () => {
    const result = shippingSubtask('OB-1', deelContract);
    expect(result.fields.summary).toContain('Carlos Rivera');
  });

  test('description mentions lead time and contract ID', () => {
    const result = shippingSubtask('OB-1', deelContract);
    const text = result.fields.description.content[0].content[0].text;
    expect(text).toContain('30-60 day');
    expect(text).toContain('deel-001');
  });

  test('sets correct issue type', () => {
    const result = shippingSubtask('OB-1', deelContract);
    expect(result.fields.issuetype.name).toBe('Subtask');
  });
});
