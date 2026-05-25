const { transform, FIELD } = require('../../src/transform/bamboohr-to-jira');

const bambooEmployee = {
  firstName: 'Jane',
  lastName: 'Smith',
  workEmail: 'jane.smith@company.com',
  hireDate: '2026-07-01',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  supervisorId: 'Bob Johnson',
};

const fubPerson = {
  emails: [{ value: 'jane@personal.com' }],
  phones: [{ value: '5125550100' }],
  addresses: [{ street: '123 Main St', city: 'Austin', state: 'TX', zip: '78701' }],
  tags: ['Hired-USA', 'Dept-Engineering', 'Equipment-Laptop', 'Equipment-Monitor'],
};

describe('bamboohr-to-jira transform', () => {
  test('sets correct project and issue type', () => {
    const result = transform(bambooEmployee, fubPerson);
    expect(result.fields.project.key).toBe('OB');
    expect(result.fields.issuetype.name).toBe('Employee Onboarding');
  });

  test('summary includes name and USA region', () => {
    const result = transform(bambooEmployee, fubPerson);
    expect(result.fields.summary).toContain('Jane Smith');
    expect(result.fields.summary).toContain('USA');
  });

  test('maps name fields', () => {
    const result = transform(bambooEmployee, fubPerson);
    expect(result.fields[FIELD.firstName]).toBe('Jane');
    expect(result.fields[FIELD.lastName]).toBe('Smith');
  });

  test('uses personal email from FUB over work email', () => {
    const result = transform(bambooEmployee, fubPerson);
    expect(result.fields[FIELD.personalEmail]).toBe('jane@personal.com');
  });

  test('sets region to USA', () => {
    expect(transform(bambooEmployee, fubPerson).fields[FIELD.region]).toBe('USA');
  });

  test('extracts equipment from FUB tags', () => {
    const result = transform(bambooEmployee, fubPerson);
    expect(result.fields[FIELD.equipment]).toEqual(['Laptop', 'Monitor']);
  });

  test('maps start date', () => {
    expect(transform(bambooEmployee, fubPerson).fields[FIELD.startDate]).toBe('2026-07-01');
  });

  test('maps department and position', () => {
    const result = transform(bambooEmployee, fubPerson);
    expect(result.fields[FIELD.department]).toBe('Engineering');
    expect(result.fields[FIELD.position]).toBe('Software Engineer');
  });

  test('formats address string', () => {
    const result = transform(bambooEmployee, fubPerson);
    expect(result.fields[FIELD.address]).toContain('123 Main St');
    expect(result.fields[FIELD.address]).toContain('Austin');
  });

  test('works without fubPerson (falls back gracefully)', () => {
    const result = transform(bambooEmployee, null);
    expect(result.fields[FIELD.firstName]).toBe('Jane');
    expect(result.fields[FIELD.equipment]).toEqual([]);
  });
});
