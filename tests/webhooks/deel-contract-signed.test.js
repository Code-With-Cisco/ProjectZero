const request = require('supertest');
const app = require('../../src/server');
const { getDb } = require('../../src/db/connection');

const INTL_PERSON_ID = 'mock-fub-002';

async function setupIntlMapping(deelContractId = 'mock-deel-001') {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO data_mapping (fub_person_id, deel_contract_id, region, sync_stage)
    VALUES (?, ?, 'international', 'hr_system_created')
  `).run(INTL_PERSON_ID, deelContractId);
  return deelContractId;
}

beforeEach(() => {
  const db = getDb();
  db.prepare('DELETE FROM data_mapping').run();
  db.prepare('DELETE FROM sync_events').run();
});

describe('POST /webhooks/deel', () => {
  test('creates Jira issue and shipping subtask', async () => {
    const contractId = await setupIntlMapping();

    const res = await request(app)
      .post('/webhooks/deel')
      .send({ id: 'deel-evt-001', contractId });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.issueKey).toMatch(/^OB-\d+$/);
    expect(res.body.shippingSubtaskKey).toMatch(/^OB-\d+$/);
  });

  test('shipping subtask key differs from parent issue key', async () => {
    const contractId = await setupIntlMapping();

    const res = await request(app)
      .post('/webhooks/deel')
      .send({ id: 'deel-evt-002', contractId });

    expect(res.body.issueKey).not.toBe(res.body.shippingSubtaskKey);
  });

  test('updates data_mapping with jira_issue_key and jira_created stage', async () => {
    const contractId = await setupIntlMapping();

    await request(app)
      .post('/webhooks/deel')
      .send({ id: 'deel-evt-003', contractId });

    const db = getDb();
    const row = db.prepare('SELECT * FROM data_mapping WHERE deel_contract_id = ?').get(contractId);
    expect(row.jira_issue_key).toMatch(/^OB-\d+$/);
    expect(row.sync_stage).toBe('jira_created');
  });

  test('writes sync_event with status=processed', async () => {
    const contractId = await setupIntlMapping();

    await request(app)
      .post('/webhooks/deel')
      .send({ id: 'deel-evt-004', contractId });

    const db = getDb();
    const row = db.prepare("SELECT * FROM sync_events WHERE webhook_id = 'deel-evt-004'").get();
    expect(row.status).toBe('processed');
    expect(row.source).toBe('deel');
  });

  test('returns 500 when contractId is missing', async () => {
    const res = await request(app)
      .post('/webhooks/deel')
      .send({ id: 'deel-err-001' });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });

  test('returns 500 when no data_mapping found for deel_contract_id', async () => {
    const res = await request(app)
      .post('/webhooks/deel')
      .send({ id: 'deel-err-002', contractId: 'no-such-contract' });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('No data_mapping');
  });
});
