const request = require('supertest');
const app = require('../../src/server');
const { getDb } = require('../../src/db/connection');

const USA_PERSON_ID = 'mock-fub-001';

async function setupUsaMapping(bamboohrId = 'mock-bhr-001') {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO data_mapping (fub_person_id, bamboohr_id, region, sync_stage)
    VALUES (?, ?, 'usa', 'hr_system_created')
  `).run(USA_PERSON_ID, bamboohrId);
  return bamboohrId;
}

beforeEach(() => {
  const db = getDb();
  db.prepare('DELETE FROM data_mapping').run();
  db.prepare('DELETE FROM sync_events').run();
});

describe('POST /webhooks/bamboohr', () => {
  test('creates Jira issue and returns issue key', async () => {
    const bamboohrId = await setupUsaMapping();

    const res = await request(app)
      .post('/webhooks/bamboohr')
      .send({ id: 'bhr-evt-001', employeeId: bamboohrId });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.issueKey).toMatch(/^OB-\d+$/);
  });

  test('updates data_mapping with jira_issue_key and jira_created stage', async () => {
    const bamboohrId = await setupUsaMapping();

    await request(app)
      .post('/webhooks/bamboohr')
      .send({ id: 'bhr-evt-002', employeeId: bamboohrId });

    const db = getDb();
    const row = db.prepare('SELECT * FROM data_mapping WHERE bamboohr_id = ?').get(bamboohrId);
    expect(row.jira_issue_key).toMatch(/^OB-\d+$/);
    expect(row.sync_stage).toBe('jira_created');
  });

  test('writes sync_event with status=processed', async () => {
    const bamboohrId = await setupUsaMapping();

    await request(app)
      .post('/webhooks/bamboohr')
      .send({ id: 'bhr-evt-003', employeeId: bamboohrId });

    const db = getDb();
    const row = db.prepare("SELECT * FROM sync_events WHERE webhook_id = 'bhr-evt-003'").get();
    expect(row.status).toBe('processed');
  });

  test('returns 500 when employeeId missing', async () => {
    const res = await request(app)
      .post('/webhooks/bamboohr')
      .send({ id: 'bhr-err-001' });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });

  test('returns 500 when no data_mapping found for bamboohr_id', async () => {
    const res = await request(app)
      .post('/webhooks/bamboohr')
      .send({ id: 'bhr-err-002', employeeId: 'no-such-id' });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('No data_mapping');
  });
});
