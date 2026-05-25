require('dotenv').config();
const axios = require('axios');
const config = require('../config');

async function run() {
  console.log('\n=== JIRA SERVICE MANAGEMENT DISCOVERY ===');

  if (config.jira.useMock) {
    console.log('[mock mode] Skipping — set USE_MOCK_API=false and add JIRA_* credentials to run live.');
    return;
  }

  const auth = Buffer.from(`${config.jira.email}:${config.jira.apiToken}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
  const base = config.jira.baseUrl;

  // ── List all service desks ──────────────────────────────────────────────
  console.log('\n── Service Desks ──');
  const { data: desks } = await axios.get(`${base}/rest/servicedeskapi/servicedesk`, { headers });
  desks.values.forEach(d => {
    console.log(`  id=${d.id}  key=${d.projectKey}  name=${d.projectName}`);
  });

  const desk = desks.values.find(d => d.projectKey === config.jira.projectKey) || desks.values[0];
  if (!desk) { console.log('No service desk found.'); return; }
  console.log(`\nUsing service desk: id=${desk.id} key=${desk.projectKey}`);

  // ── Request types (what employees submit) ──────────────────────────────
  console.log('\n── Request Types ──');
  const { data: rtypes } = await axios.get(
    `${base}/rest/servicedeskapi/servicedesk/${desk.id}/requesttype`, { headers }
  );
  rtypes.values.forEach(r => {
    console.log(`  id=${String(r.id).padEnd(6)} name=${r.name}`);
  });

  const onboardingType = rtypes.values.find(r =>
    r.name.toLowerCase().includes('onboard') || r.name.toLowerCase().includes('employee')
  );
  if (!onboardingType) { console.log('\nNo "Employee Onboarding" request type found — check the names above.'); return; }
  console.log(`\nFound onboarding request type: id=${onboardingType.id} name=${onboardingType.name}`);

  // ── Fields on the onboarding request type ─────────────────────────────
  console.log('\n── Fields on Employee Onboarding form ──');
  const { data: fields } = await axios.get(
    `${base}/rest/servicedeskapi/servicedesk/${desk.id}/requesttype/${onboardingType.id}/field`,
    { headers }
  );
  fields.requestTypeFields.forEach(f => {
    console.log(`  ${f.fieldId.padEnd(25)} ${f.name}${f.required ? ' (required)' : ''}`);
  });

  // ── Issue types in the project ─────────────────────────────────────────
  console.log('\n── Issue Types in project ──');
  const { data: project } = await axios.get(
    `${base}/rest/api/3/project/${config.jira.projectKey}`, { headers }
  );
  project.issueTypes?.forEach(t => {
    console.log(`  id=${t.id.padEnd(8)} name=${t.name}${t.subtask ? ' (subtask)' : ''}`);
  });

  console.log('\nDone. Use the field IDs above to update src/transform/bamboohr-to-jira.js → FIELD map.\n');
}

run().catch(err => {
  console.error('JSM discovery failed:', err.response?.data || err.message);
  process.exit(1);
});
