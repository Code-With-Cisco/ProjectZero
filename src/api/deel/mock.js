const logger = require('../../logger');

let contractCounter = 1;
const contracts = {};

async function createContract(data) {
  const id = `mock-deel-${String(contractCounter++).padStart(3, '0')}`;
  contracts[id] = { id, ...data, status: 'pending', createdAt: new Date().toISOString() };
  logger.info('[MOCK DEEL] createContract', { id, worker: `${data.firstName} ${data.lastName}` });
  return { id };
}

async function getContract(id) {
  logger.info('[MOCK DEEL] getContract', { id });
  return contracts[id] || { id, status: 'pending' };
}

module.exports = { createContract, getContract };
