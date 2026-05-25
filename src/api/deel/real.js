const axios = require('axios');
const config = require('../../config');

function assertConfig() {
  if (!config.deel.apiKey) throw new Error('Missing DEEL_API_KEY in .env');
}

function client() {
  assertConfig();
  return axios.create({
    baseURL: 'https://api.letsdeel.com/rest/v2',
    headers: { Authorization: `Bearer ${config.deel.apiKey}` },
  });
}

async function createContract(data) {
  const { data: res } = await client().post('/contracts', data);
  return res;
}

async function getContract(id) {
  const { data } = await client().get(`/contracts/${id}`);
  return data;
}

module.exports = { createContract, getContract };
