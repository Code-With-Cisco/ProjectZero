const logger = require('../../logger');

const people = {
  'mock-fub-001': {
    id: 'mock-fub-001',
    firstName: 'Jane',
    lastName: 'Smith',
    emails: [{ value: 'jane.smith@example.com', type: 'personal' }],
    phones: [{ value: '5125550100', type: 'mobile' }],
    addresses: [{ street: '123 Main St', city: 'Austin', state: 'TX', zip: '78701', country: 'US' }],
    tags: ['Hired-USA', 'Dept-Engineering', 'Equipment-Laptop', 'Equipment-Monitor', 'Docs-Signed'],
    customFields: { position: 'Software Engineer', startDate: '2026-07-01', manager: 'Bob Johnson' },
  },
  'mock-fub-002': {
    id: 'mock-fub-002',
    firstName: 'Carlos',
    lastName: 'Rivera',
    emails: [{ value: 'carlos.rivera@example.com', type: 'personal' }],
    phones: [{ value: '5125550200', type: 'mobile' }],
    addresses: [{ street: '10 Rue de Rivoli', city: 'Paris', state: '', zip: '75001', country: 'FR' }],
    tags: ['Hired-International', 'Dept-Sales', 'Equipment-Laptop', 'Equipment-International-Shipping', 'Docs-Signed'],
    customFields: { position: 'Account Executive', startDate: '2026-08-15', manager: 'Alice Chen' },
  },
};

async function getPerson(id) {
  logger.info('[MOCK FUB] getPerson', { id });
  const person = people[id] || people['mock-fub-001'];
  return { ...person };
}

async function updatePersonTags(id, tags) {
  logger.info('[MOCK FUB] updatePersonTags', { id, tags });
  if (people[id]) people[id].tags = tags;
  return { success: true };
}

module.exports = { getPerson, updatePersonTags };
