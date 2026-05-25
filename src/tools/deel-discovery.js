require('dotenv').config();
const axios = require('axios');
const config = require('../config');

// Countries we currently route international hires through — extend as needed
const COUNTRIES_TO_CHECK = ['FR', 'GB', 'DE', 'CA', 'AU', 'IN', 'BR', 'SG', 'MX', 'NL'];

async function run() {
  console.log('\n=== DEEL COUNTRY REQUIREMENTS DISCOVERY ===');

  if (config.deel.useMock) {
    console.log('[mock mode] Skipping — set USE_MOCK_API=false and add DEEL_API_KEY to run live.');
    return;
  }

  const client = axios.create({
    baseURL: 'https://api.letsdeel.com/rest/v2',
    headers: { Authorization: `Bearer ${config.deel.apiKey}`, Accept: 'application/json' },
  });

  // ── Supported countries ────────────────────────────────────────────────
  console.log('\n── Deel Supported Countries ──');
  try {
    const { data } = await client.get('/countries');
    const supported = data.data || data;
    console.log(`Total supported countries: ${supported.length}`);
    supported.slice(0, 20).forEach(c => console.log(`  ${c.code}  ${c.name}`));
    if (supported.length > 20) console.log(`  ... and ${supported.length - 20} more`);
  } catch (err) {
    console.log('  Could not fetch countries:', err.response?.status, err.response?.data?.message || err.message);
  }

  // ── Per-country required contract fields ──────────────────────────────
  console.log('\n── Required Fields Per Country ──');
  for (const code of COUNTRIES_TO_CHECK) {
    try {
      const { data } = await client.get(`/contracts/requirements`, { params: { country: code } });
      const fields = data.data || data;
      console.log(`\n  ${code}:`);
      (Array.isArray(fields) ? fields : Object.keys(fields)).forEach(f => {
        const name = typeof f === 'string' ? f : f.name || f.field;
        const required = f.required !== false;
        console.log(`    ${required ? '* ' : '  '}${name}`);
      });
    } catch (err) {
      console.log(`  ${code}: Could not fetch (${err.response?.status || err.message})`);
    }
  }

  // ── Contract types available ───────────────────────────────────────────
  console.log('\n── Available Contract Types ──');
  try {
    const { data } = await client.get('/contract-types');
    const types = data.data || data;
    (Array.isArray(types) ? types : [types]).forEach(t => {
      console.log(`  ${t.id || t.type || JSON.stringify(t)}`);
    });
  } catch (err) {
    console.log('  Could not fetch contract types:', err.response?.status, err.response?.data?.message || err.message);
  }

  console.log('\nDone. Update src/transform/fub-to-deel.js with any country-specific required fields.\n');
}

run().catch(err => {
  console.error('Deel discovery failed:', err.response?.data || err.message);
  process.exit(1);
});
