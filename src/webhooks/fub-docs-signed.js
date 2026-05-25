const express = require('express');
const router = express.Router();
const api = require('../api');
const { getDb } = require('../db/connection');
const { transform: toDeelPayload } = require('../transform/fub-to-deel');
const { transform: toBambooPayload } = require('../transform/fub-to-bamboohr');
const logger = require('../logger');

router.post('/', async (req, res) => {
  const db = getDb();
  const payload = req.body;
  const webhookId = payload.id || `fub-${Date.now()}`;

  // Record receipt immediately
  db.prepare(`
    INSERT OR IGNORE INTO sync_events (webhook_id, source, event_type, payload, status)
    VALUES (?, 'followupboss', 'docs-signed', ?, 'received')
  `).run(webhookId, JSON.stringify(payload));

  try {
    const personId = payload.personId || payload.person?.id;
    if (!personId) throw new Error('Missing personId in FUB webhook payload');

    const person = await api.followupboss.getPerson(personId);
    const tags = person.tags || [];
    const isInternational = tags.includes('Hired-International');

    logger.info('FUB docs-signed received', { personId, isInternational, tags });

    let region, destinationId;

    if (isInternational) {
      const deelPayload = toDeelPayload(person);
      const result = await api.deel.createContract(deelPayload);
      destinationId = result.id;
      region = 'international';
      logger.info('Deel contract created', { personId, contractId: destinationId });
    } else {
      const bambooPayload = toBambooPayload(person);
      const result = await api.bamboohr.createEmployee(bambooPayload);
      destinationId = result.id;
      region = 'usa';
      logger.info('BambooHR employee created', { personId, employeeId: destinationId });
    }

    // Link FUB person to destination system
    db.prepare(`
      INSERT INTO data_mapping (fub_person_id, ${region === 'usa' ? 'bamboohr_id' : 'deel_contract_id'}, region, sync_stage)
      VALUES (?, ?, ?, 'hr_system_created')
      ON CONFLICT(fub_person_id) DO UPDATE SET
        ${region === 'usa' ? 'bamboohr_id' : 'deel_contract_id'} = excluded.${region === 'usa' ? 'bamboohr_id' : 'deel_contract_id'},
        region = excluded.region,
        sync_stage = 'hr_system_created',
        updated_at = datetime('now')
    `).run(personId, destinationId, region);

    db.prepare(`UPDATE sync_events SET status = 'processed' WHERE webhook_id = ?`).run(webhookId);

    res.json({ ok: true, region, destinationId });
  } catch (err) {
    logger.error('FUB docs-signed failed', { webhookId, error: err.message });
    db.prepare(`UPDATE sync_events SET status = 'error', error = ? WHERE webhook_id = ?`).run(err.message, webhookId);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
