require('dotenv').config();
const axios = require('axios');
const config = require('../config');

// ─── Jira ──────────────────────────────────────────────────────────────────

async function discoverJiraFields() {
  console.log('\n=== JIRA CUSTOM FIELDS ===');

  if (config.jira.useMock) {
    console.log('[mock mode] Skipping — set USE_MOCK_API=false and add JIRA_* credentials to run live.');
    return;
  }

  const auth = Buffer.from(`${config.jira.email}:${config.jira.apiToken}`).toString('base64');
  const { data: fields } = await axios.get(`${config.jira.baseUrl}/rest/api/3/fields`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  });

  const custom = fields.filter(f => f.custom).sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Found ${custom.length} custom fields:\n`);
  custom.forEach(f => console.log(`  ${f.id.padEnd(25)} ${f.name}`));

  console.log('\nFields relevant to Employee Onboarding (search for these names):');
  const keywords = ['first', 'last', 'preferred', 'start', 'region', 'address', 'email', 'position', 'phone', 'department', 'manager', 'equipment', 'system', 'access', 'location', 'note'];
  custom
    .filter(f => keywords.some(k => f.name.toLowerCase().includes(k)))
    .forEach(f => console.log(`  ✓ ${f.id.padEnd(25)} ${f.name}`));
}

// ─── BambooHR ──────────────────────────────────────────────────────────────

async function discoverBamboohrFields() {
  console.log('\n=== BAMBOOHR CUSTOM FIELDS ===');

  if (config.bamboohr.useMock) {
    console.log('[mock mode] Skipping — set USE_MOCK_API=false and add BAMBOOHR_* credentials to run live.');
    return;
  }

  const auth = Buffer.from(`${config.bamboohr.apiKey}:x`).toString('base64');
  const { data } = await axios.get(
    `https://api.bamboohr.com/api/gateway.php/${config.bamboohr.subdomain}/v1/meta/fields`,
    { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } }
  );

  console.log(`Found ${data.length} fields:\n`);
  data
    .filter(f => f.type === 'custom' || f.alias?.startsWith('custom'))
    .forEach(f => console.log(`  ${String(f.id).padEnd(8)} ${f.alias || f.name}`));

  console.log('\nAll standard fields:');
  data
    .filter(f => f.type !== 'custom')
    .forEach(f => console.log(`  ${String(f.id).padEnd(8)} ${f.alias || f.name}`));
}

// ─── Run ───────────────────────────────────────────────────────────────────

(async () => {
  try {
    await discoverJiraFields();
    await discoverBamboohrFields();
    console.log('\nDone. Copy the field IDs above into src/transform/bamboohr-to-jira.js → FIELD map.\n');
  } catch (err) {
    console.error('Discovery failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();
