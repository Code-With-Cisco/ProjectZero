const axios = require('axios');
const config = require('../../config');

function assertConfig() {
  if (!config.bamboohr.apiKey) throw new Error('Missing BAMBOOHR_API_KEY in .env');
  if (!config.bamboohr.subdomain) throw new Error('Missing BAMBOOHR_SUBDOMAIN in .env');
}

function client() {
  assertConfig();
  return axios.create({
    baseURL: `https://api.bamboohr.com/api/gateway.php/${config.bamboohr.subdomain}/v1`,
    auth: { username: config.bamboohr.apiKey, password: 'x' },
    headers: { Accept: 'application/json' },
  });
}

async function createEmployee(data) {
  const { data: res } = await client().post('/employees/', data);
  return res;
}

async function getEmployee(id) {
  const { data } = await client().get(`/employees/${id}`, {
    params: { fields: 'firstName,lastName,workEmail,department,jobTitle,hireDate' },
  });
  return data;
}

module.exports = { createEmployee, getEmployee };
