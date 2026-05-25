const config = require('../config');

// Field IDs are placeholders — replace after running: npm run discover
const FIELD = {
  firstName:      'customfield_10001',
  lastName:       'customfield_10002',
  preferredName:  'customfield_10003',
  startDate:      'customfield_10004',
  region:         'customfield_10005',
  address:        'customfield_10006',
  personalEmail:  'customfield_10007',
  position:       'customfield_10008',
  phone:          'customfield_10009',
  department:     'customfield_10010',
  manager:        'customfield_10011',
  equipment:      'customfield_10012',
  systemAccess:   'customfield_10013',
  notes:          'customfield_10014',
  location:       'customfield_10015',
};

function transform(bamboohrEmployee, fubPerson) {
  const tags = fubPerson?.tags || [];
  const equipment = tags
    .filter(t => ['Equipment-Laptop', 'Equipment-Monitor', 'Equipment-Badge'].includes(t))
    .map(t => t.replace('Equipment-', ''));

  const address = fubPerson?.addresses?.[0] || {};
  const addressStr = [address.street, address.city, address.state, address.zip]
    .filter(Boolean).join(', ');

  return {
    fields: {
      project: { key: config.jira.projectKey },
      issuetype: { name: 'Employee Onboarding' },
      summary: `Onboard ${bamboohrEmployee.firstName} ${bamboohrEmployee.lastName} — USA`,
      [FIELD.firstName]:    bamboohrEmployee.firstName,
      [FIELD.lastName]:     bamboohrEmployee.lastName,
      [FIELD.preferredName]: bamboohrEmployee.firstName,
      [FIELD.startDate]:    bamboohrEmployee.hireDate || null,
      [FIELD.region]:       'USA',
      [FIELD.address]:      addressStr || null,
      [FIELD.personalEmail]: fubPerson?.emails?.[0]?.value || bamboohrEmployee.workEmail,
      [FIELD.position]:     bamboohrEmployee.jobTitle || null,
      [FIELD.phone]:        fubPerson?.phones?.[0]?.value || null,
      [FIELD.department]:   bamboohrEmployee.department || null,
      [FIELD.manager]:      bamboohrEmployee.supervisorId || null,
      [FIELD.equipment]:    equipment,
      [FIELD.systemAccess]: [],
      [FIELD.notes]:        null,
      [FIELD.location]:     address.city || null,
    },
  };
}

module.exports = { transform, FIELD };
