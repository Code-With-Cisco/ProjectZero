require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,

  fub: {
    apiKey: process.env.FUB_API_KEY,
    systemKey: process.env.FUB_SYSTEM_KEY,
    useMock: process.env.USE_MOCK_API !== 'false',
  },

  bamboohr: {
    apiKey: process.env.BAMBOOHR_API_KEY,
    subdomain: process.env.BAMBOOHR_SUBDOMAIN,
    useMock: process.env.USE_MOCK_API !== 'false',
  },

  deel: {
    apiKey: process.env.DEEL_API_KEY,
    useMock: process.env.USE_MOCK_API !== 'false',
  },

  jira: {
    apiToken: process.env.JIRA_API_TOKEN,
    baseUrl: process.env.JIRA_BASE_URL,
    projectKey: process.env.JIRA_PROJECT_KEY || 'OB',
    email: process.env.JIRA_EMAIL,
    useMock: process.env.USE_MOCK_API !== 'false',
  },

  webhooks: {
    fubSecret: process.env.FUB_WEBHOOK_SECRET,
    bamboohrSecret: process.env.BAMBOOHR_WEBHOOK_SECRET,
    deelSecret: process.env.DEEL_WEBHOOK_SECRET,
  },
};
