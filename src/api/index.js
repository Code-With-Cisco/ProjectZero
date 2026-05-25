const config = require('../config');

const followupboss = config.fub.useMock
  ? require('./followupboss/mock')
  : require('./followupboss/real');

const bamboohr = config.bamboohr.useMock
  ? require('./bamboohr/mock')
  : require('./bamboohr/real');

const deel = config.deel.useMock
  ? require('./deel/mock')
  : require('./deel/real');

const jira = config.jira.useMock
  ? require('./jira/mock')
  : require('./jira/real');

const status = {
  followupboss: config.fub.useMock ? 'mock' : 'real',
  bamboohr: config.bamboohr.useMock ? 'mock' : 'real',
  deel: config.deel.useMock ? 'mock' : 'real',
  jira: config.jira.useMock ? 'mock' : 'real',
};

module.exports = { followupboss, bamboohr, deel, jira, status };
