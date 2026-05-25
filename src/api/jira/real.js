const axios = require('axios');
const config = require('../../config');

function assertConfig() {
  if (!config.jira.apiToken) throw new Error('Missing JIRA_API_TOKEN in .env');
  if (!config.jira.baseUrl) throw new Error('Missing JIRA_BASE_URL in .env');
  if (!config.jira.email) throw new Error('Missing JIRA_EMAIL in .env');
}

function client() {
  assertConfig();
  return axios.create({
    baseURL: `${config.jira.baseUrl}/rest/api/3`,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.jira.email}:${config.jira.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });
}

async function createIssue(data) {
  const { data: res } = await client().post('/issue', data);
  return { key: res.key, id: res.id };
}

async function createSubtask(parentKey, data) {
  const payload = { ...data, fields: { ...data.fields, parent: { key: parentKey } } };
  const { data: res } = await client().post('/issue', payload);
  return { key: res.key, id: res.id };
}

module.exports = { createIssue, createSubtask };
