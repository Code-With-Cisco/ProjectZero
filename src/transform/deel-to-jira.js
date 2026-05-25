const config = require('../config');
const { FIELD } = require('./bamboohr-to-jira');

function transform(deelContract, fubPerson) {
  const tags = fubPerson?.tags || [];
  const equipment = tags
    .filter(t => ['Equipment-Laptop', 'Equipment-Monitor', 'Equipment-Badge'].includes(t))
    .map(t => t.replace('Equipment-', ''));

  const address = fubPerson?.addresses?.[0] || {};
  const addressStr = [address.street, address.city, address.zip, address.country]
    .filter(Boolean).join(', ');

  return {
    fields: {
      project: { key: config.jira.projectKey },
      issuetype: { name: 'Employee Onboarding' },
      summary: `Onboard ${deelContract.firstName} ${deelContract.lastName} — International (${deelContract.countryCode || 'INTL'})`,
      [FIELD.firstName]:    deelContract.firstName,
      [FIELD.lastName]:     deelContract.lastName,
      [FIELD.preferredName]: deelContract.firstName,
      [FIELD.startDate]:    deelContract.startDate || null,
      [FIELD.region]:       'International',
      [FIELD.address]:      addressStr || null,
      [FIELD.personalEmail]: fubPerson?.emails?.[0]?.value || deelContract.email,
      [FIELD.position]:     deelContract.jobTitle || null,
      [FIELD.phone]:        fubPerson?.phones?.[0]?.value || null,
      [FIELD.department]:   deelContract.department || null,
      [FIELD.manager]:      null,
      [FIELD.equipment]:    equipment,
      [FIELD.systemAccess]: [],
      [FIELD.notes]:        `Deel EOR contract ID: ${deelContract.id}`,
      [FIELD.location]:     address.city || null,
    },
  };
}

function shippingSubtask(parentKey, deelContract) {
  return {
    fields: {
      project: { key: config.jira.projectKey },
      issuetype: { name: 'Subtask' },
      parent: { key: parentKey },
      summary: `RUSH: International Equipment Shipping — ${deelContract.firstName} ${deelContract.lastName} (${deelContract.countryCode || 'INTL'})`,
      priority: { name: 'Highest' },
      description: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: `30-60 day international shipping lead time. Ship equipment immediately upon contract signature. Destination: ${deelContract.address?.city || ''}, ${deelContract.countryCode || ''}. Deel contract ID: ${deelContract.id}`,
          }],
        }],
      },
    },
  };
}

module.exports = { transform, shippingSubtask };
