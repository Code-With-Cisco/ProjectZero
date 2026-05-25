const request = require('supertest');
const app = require('../../src/server');
const { getDb } = require('../../src/db/connection');

// Mock fixture person IDs match src/api/followupboss/mock.js
const USA_PERSON_ID = 'mock-fub-001';
const INTL_PERSON_ID = 'mock-fub-002';

beforeEach(() => {
  // Clear data_mapping and sync_events between tests
  const db = getDb();
  db.prepare('DELETE FROM data_mapping').run();
  db.prepare('DELETE FROM sync_events').run();
});

describe('POST /webhooks/fub (USA path)', () => {
  test('returns 200 with usa region', async () => {
    const res = await request(app)
      .post('/webhooks/fub')
      .send({ id: 'test-usa-001', personId: USA_PERSON_ID });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.region).toBe('usa');
    expect(res.body.destinationId).toBeDefined();
  });

  test('creates data_mapping row with region=usa', async () => {
    await request(app)
      .post('/webhooks/fub')
      .send({ id: 'test-usa-002', personId: USA_PERSON_ID });

    const db = getDb();
    const row = db.prepare('SELECT * FROM data_mapping WHERE fub_person_id = ?').get(USA_PERSON_ID);
    expect(row).toBeDefined();
    expect(row.region).toBe('usa');
    expect(row.bamboohr_id).toBeDefined();
    expect(row.sync_stage).toBe('hr_system_created');
  });

  test('writes sync_event with status=processed', async () => {
    await request(app)
      .post('/webhooks/fub')
      .send({ id: 'test-usa-003', personId: USA_PERSON_ID });

    const db = getDb();
    const row = db.prepare("SELECT * FROM sync_events WHERE webhook_id = 'test-usa-003'").get();
    expect(row).toBeDefined();
    expect(row.status).toBe('processed');
    expect(row.source).toBe('followupboss');
  });
});

describe('POST /webhooks/fub (International path)', () => {
  test('returns 200 with international region', async () => {
    const res = await request(app)
      .post('/webhooks/fub')
      .send({ id: 'test-intl-001', personId: INTL_PERSON_ID });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.region).toBe('international');
    expect(res.body.destinationId).toBeDefined();
  });

  test('creates data_mapping row with region=international', async () => {
    await request(app)
      .post('/webhooks/fub')
      .send({ id: 'test-intl-002', personId: INTL_PERSON_ID });

    const db = getDb();
    const row = db.prepare('SELECT * FROM data_mapping WHERE fub_person_id = ?').get(INTL_PERSON_ID);
    expect(row).toBeDefined();
    expect(row.region).toBe('international');
    expect(row.deel_contract_id).toBeDefined();
    expect(row.bamboohr_id).toBeNull();
  });
});

describe('POST /webhooks/fub (error handling)', () => {
  test('returns 500 when personId is missing', async () => {
    const res = await request(app)
      .post('/webhooks/fub')
      .send({ id: 'test-err-001' });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  test('writes sync_event with status=error on failure', async () => {
    await request(app)
      .post('/webhooks/fub')
      .send({ id: 'test-err-002' });

    const db = getDb();
    const row = db.prepare("SELECT * FROM sync_events WHERE webhook_id = 'test-err-002'").get();
    expect(row.status).toBe('error');
    expect(row.error).toBeDefined();
  });
});
