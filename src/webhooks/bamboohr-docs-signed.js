const express = require('express');
const router = express.Router();
const api = require('../api');
const { getDb } = require('../db/connection');
const { transform: toJiraPayload } = require('../transform/bamboohr-to-jira');
const logger = require('../logger');

router.post('/', async (req, res) => {
  const db = getDb();
  const payload = req.body;
  const webhookId = payload.id || `bhr-${Date.now()}`;

  db.prepare(`
    INSERT OR IGNORE INTO sync_events (webhook_id, source, event_type, payload, status)
    VALUES (?, 'bamboohr', 'docs-signed', ?, 'received')
  `).run(webhookId, JSON.stringify(payload));

  try {
    const bamboohrId = payload.employeeId || payload.employee?.id;
    if (!bamboohrId) throw new Error('Missing employeeId in BambooHR webhook payload');

    // Look up the FUB person linked to this BambooHR employee
    const mapping = db.prepare(`SELECT * FROM data_mapping WHERE bamboohr_id = ?`).get(bamboohrId);
    if (!mapping) throw new Error(`No data_mapping found for bamboohr_id=${bamboohrId}`);

    const [employee, fubPerson] = await Promise.all([
      api.bamboohr.getEmployee(bamboohrId),
      api.followupboss.getPerson(mapping.fub_person_id),
    ]);

    const jiraPayload = toJiraPayload(employee, fubPerson);
    const issue = await api.jira.createIssue(jiraPayload);

    logger.info('Jira issue created (USA path)', { bamboohrId, issueKey: issue.key });

    db.prepare(`
      UPDATE data_mapping SET jira_issue_key = ?, sync_stage = 'jira_created', updated_at = datetime('now')
      WHERE bamboohr_id = ?
    `).run(issue.key, bamboohrId);

    db.prepare(`UPDATE sync_events SET status = 'processed' WHERE webhook_id = ?`).run(webhookId);

    res.json({ ok: true, issueKey: issue.key });
  } catch (err) {
    logger.error('BambooHR docs-signed failed', { webhookId, error: err.message });
    db.prepare(`UPDATE sync_events SET status = 'error', error = ? WHERE webhook_id = ?`).run(err.message, webhookId);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
