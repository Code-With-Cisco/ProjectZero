const logger = require('../../logger');

let issueCounter = 1;
const issues = {};

async function createIssue(data) {
  const key = `OB-${issueCounter++}`;
  issues[key] = { key, ...data, status: 'Open', createdAt: new Date().toISOString() };
  logger.info('[MOCK JIRA] createIssue', { key, summary: data.summary });
  return { key, id: `mock-jira-${key}` };
}

async function createSubtask(parentKey, data) {
  const key = `OB-${issueCounter++}`;
  issues[key] = { key, parentKey, ...data, status: 'Open', createdAt: new Date().toISOString() };
  logger.info('[MOCK JIRA] createSubtask', { key, parentKey, summary: data.summary });
  return { key, id: `mock-jira-${key}` };
}

module.exports = { createIssue, createSubtask };
