const express = require('express');
const config = require('./config');
const logger = require('./logger');
const { getDb } = require('./db/connection');

const app = express();
app.use(express.json());

// Webhook routes (mounted as they are built in later phases)
// app.use('/webhooks/fub', require('./webhooks/fub-docs-signed'));
// app.use('/webhooks/bamboohr', require('./webhooks/bamboohr-docs-signed'));
// app.use('/webhooks/deel', require('./webhooks/deel-contract-signed'));

app.get('/health', (req, res) => {
  const api = require('./api');
  res.json({ status: 'ok', apis: api.status });
});

app.listen(config.port, () => {
  getDb();
  logger.info(`Project Zero running on port ${config.port} | mock=${config.fub.useMock}`);
});

module.exports = app;
