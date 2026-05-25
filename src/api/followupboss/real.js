const axios = require('axios');
const config = require('../../config');

function assertConfig() {
  if (!config.fub.apiKey) throw new Error('Missing FUB_API_KEY in .env');
  if (!config.fub.systemKey) throw new Error('Missing FUB_SYSTEM_KEY in .env');
}

function client() {
  assertConfig();
  return axios.create({
    baseURL: 'https://api.followupboss.com/v1',
    auth: { username: config.fub.apiKey, password: '' },
    headers: { 'x-system-key': config.fub.systemKey },
  });
}

async function getPerson(id) {
  const { data } = await client().get(`/people/${id}`);
  return data;
}

async function updatePersonTags(id, tags) {
  const { data } = await client().put(`/people/${id}`, { tags });
  return data;
}

module.exports = { getPerson, updatePersonTags };
