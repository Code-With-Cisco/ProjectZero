const logger = require('../../logger');

let employeeCounter = 1;
const employees = {};

async function createEmployee(data) {
  const id = `mock-bhr-${String(employeeCounter++).padStart(3, '0')}`;
  employees[id] = { id, ...data, status: 'active', createdAt: new Date().toISOString() };
  logger.info('[MOCK BHR] createEmployee', { id, name: `${data.firstName} ${data.lastName}` });
  return { id };
}

async function getEmployee(id) {
  logger.info('[MOCK BHR] getEmployee', { id });
  return employees[id] || { id, firstName: 'Mock', lastName: 'Employee', status: 'active' };
}

module.exports = { createEmployee, getEmployee };
