const express = require('express');
const router = express.Router();
const api = require('../api');
const { getDb } = require('../db/connection');
const { transform: toJiraPayload, shippingSubtask } = require('../transform/deel-to-jira');
const logger = require('../logger');
const config = require('../config');
const { verifySignature } = require('./verifySignature');

router.post('/', async (req, res) => {
  const secret = config.webhooks.deelSecret;
  if (secret) {
    const sig = req.headers['x-deel-signature'];
    if (!sig || !verifySignature(req.rawBody, sig, secret)) {
      return res.status(401).json({ ok: false, error: 'Invalid webhook signature' });
    }
  }

  const db = getDb();
  const payload = req.body;
  const webhookId = payload.id || `deel-${Date.now()}`;

  db.prepare(`
    INSERT OR IGNORE INTO sync_events (webhook_id, source, event_type, payload, status)
    VALUES (?, 'deel', 'contract-signed', ?, 'received')
  `).run(webhookId, JSON.stringify(payload));

  try {
    const deelContractId = payload.contractId || payload.contract?.id;
    if (!deelContractId) throw new Error('Missing contractId in Deel webhook payload');

    const mapping = db.prepare(`SELECT * FROM data_mapping WHERE deel_contract_id = ?`).get(deelContractId);
    if (!mapping) throw new Error(`No data_mapping found for deel_contract_id=${deelContractId}`);

    const [contract, fubPerson] = await Promise.all([
      api.deel.getContract(deelContractId),
      api.followupboss.getPerson(mapping.fub_person_id),
    ]);

    const jiraPayload = toJiraPayload(contract, fubPerson);
    const issue = await api.jira.createIssue(jiraPayload);

    logger.info('Jira issue created (International path)', { deelContractId, issueKey: issue.key });

    // Shipping subtask — critical for international hires (30-60 day lead time)
    const subtaskPayload = shippingSubtask(issue.key, contract);
    const subtask = await api.jira.createSubtask(issue.key, subtaskPayload);

    logger.info('Shipping subtask created', { parentKey: issue.key, subtaskKey: subtask.key });

    db.prepare(`
      UPDATE data_mapping SET jira_issue_key = ?, sync_stage = 'jira_created', updated_at = datetime('now')
      WHERE deel_contract_id = ?
    `).run(issue.key, deelContractId);

    db.prepare(`UPDATE sync_events SET status = 'processed' WHERE webhook_id = ?`).run(webhookId);

    res.json({ ok: true, issueKey: issue.key, shippingSubtaskKey: subtask.key });
  } catch (err) {
    logger.error('Deel contract-signed failed', { webhookId, error: err.message });
    db.prepare(`UPDATE sync_events SET status = 'error', error = ? WHERE webhook_id = ?`).run(err.message, webhookId);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
