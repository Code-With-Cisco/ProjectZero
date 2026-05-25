# Testing

## Running Tests

```bash
npm test
```

All 70 tests run against mock APIs with `USE_MOCK_API=true`. No credentials needed, no network calls made.

---

## Test Structure

```
tests/
├── transforms/         # Unit tests — pure input/output, no server, no DB
│   ├── fub-to-bamboohr.test.js
│   ├── fub-to-deel.test.js
│   ├── bamboohr-to-jira.test.js
│   └── deel-to-jira.test.js
└── webhooks/           # Integration tests — full HTTP request through the stack
    ├── fub-docs-signed.test.js
    ├── bamboohr-docs-signed.test.js
    └── deel-contract-signed.test.js
```

---

## Transform Tests (Unit)

These test the data mapping functions in isolation. No server, no database, no API calls — just a JavaScript object in and a JavaScript object out.

### `fub-to-bamboohr.test.js`

Tests the transform that converts a Follow Up Boss person into a BambooHR employee payload.

| Test | What it checks |
|------|---------------|
| `normalizePhone` — 10-digit number | `5125550100` → `(512)555-0100` |
| `normalizePhone` — 11-digit with leading 1 | `15125550100` → `(512)555-0100` |
| `normalizePhone` — already formatted | passthrough, no double-formatting |
| `normalizePhone` — short number | returns raw value, doesn't corrupt it |
| `normalizePhone` — null/undefined | handles missing phone gracefully |
| `extractTag` — finds department | `Dept-Engineering` → `"Engineering"` |
| `extractTag` — missing prefix | returns null, doesn't throw |
| `extractEquipment` — multiple tags | `["Equipment-Laptop","Equipment-Monitor"]` → `["Laptop","Monitor"]` |
| `extractEquipment` — no equipment tags | returns empty array |
| `extractEquipment` — ignores shipping tag | `Equipment-International-Shipping` is not treated as equipment |
| Full transform — core fields | name, email, hire date, job title, manager all map correctly |
| Full transform — phone normalized | phone goes through normalization |
| Full transform — department from tags | `Dept-Engineering` tag sets department field |
| Full transform — equipment from tags | equipment tags populate the custom field |
| Full transform — address fields | street, city, state, zip, country all map |
| Full transform — country default | defaults to `"US"` when address has no country |
| Full transform — FUB person ID stored | person ID is carried through for traceability |
| Full transform — missing optional fields | no crash when tags/customFields/phones are absent |

### `fub-to-deel.test.js`

Tests the transform that converts a Follow Up Boss person into a Deel contract payload. Country resolution is the critical logic here.

| Test | What it checks |
|------|---------------|
| `extractCountryCode` — 2-letter code | `"FR"` passthrough, uppercased |
| `extractCountryCode` — full country names | `"France"` → `"FR"`, `"Germany"` → `"DE"`, etc. |
| `extractCountryCode` — city field fallback | `"Paris, France"` in city field → `"FR"` |
| `extractCountryCode` — unknown country | returns null, doesn't throw |
| `extractCountryCode` — null address | returns null, doesn't throw |
| Full transform — core fields | name, email, job title, start date map correctly |
| Full transform — department from tags | `Dept-Sales` tag sets department field |
| Full transform — country code resolved | country name in address resolves to ISO code |
| Full transform — address subfields | street, city, postal code all map to Deel address shape |
| Full transform — Deel required defaults | `seniorityLevel` and `contractType` are always present |
| Full transform — FUB person ID stored | carried through for later DB lookup |
| Full transform — missing optional fields | no crash when tags/addresses are absent |

### `bamboohr-to-jira.test.js`

Tests the transform that converts a BambooHR employee into a Jira Service Management issue payload. Field IDs are placeholder values (`customfield_10001` etc.) until `npm run discover` is run.

| Test | What it checks |
|------|---------------|
| Project and issue type | `project.key = "OB"`, `issuetype.name = "Employee Onboarding"` |
| Summary format | contains employee name and "USA" |
| Name fields | first and last name map to correct custom fields |
| Email preference | uses FUB personal email over BambooHR work email |
| Region field | always set to `"USA"` on this path |
| Equipment from FUB tags | equipment tags on FUB person populate the Jira field |
| Start date | maps from BambooHR hire date |
| Department and position | both map to their respective custom fields |
| Address string | formatted as a single string from address parts |
| Null fubPerson fallback | works without FUB data, equipment defaults to empty array |

### `deel-to-jira.test.js`

Tests both the main issue transform and the shipping subtask builder for the international path.

| Test | What it checks |
|------|---------------|
| Project and issue type | same shape as USA path |
| Summary format | contains employee name and country code |
| Region field | always set to `"International"` on this path |
| Name fields | map correctly |
| Email preference | uses FUB personal email |
| Equipment — excludes shipping tag | `Equipment-International-Shipping` does not appear as equipment item |
| Notes field | contains Deel contract ID for cross-reference |
| `shippingSubtask` — priority | always `"Highest"` |
| `shippingSubtask` — summary | contains "RUSH" and country code |
| `shippingSubtask` — summary has name | employee name in subtask summary |
| `shippingSubtask` — description | mentions 30-60 day lead time and Deel contract ID |
| `shippingSubtask` — issue type | `"Subtask"` |

---

## Webhook Tests (Integration)

These tests spin up the full Express app using `supertest` and fire real HTTP requests. The SQLite DB is initialized in-memory (same file, cleared between each test). All external API calls go to the mock implementations.

Each test file clears `sync_events` and `data_mapping` in `beforeEach` so tests are fully independent.

### `fub-docs-signed.test.js`

Tests `POST /webhooks/fub` — the entry point for all onboarding flows.

**USA path:**

| Test | What it checks |
|------|---------------|
| Returns 200 with `region: "usa"` | correct routing decision |
| `data_mapping` row created | `fub_person_id`, `bamboohr_id`, `region=usa`, `sync_stage=hr_system_created` all written |
| `sync_events` row written | `status=processed`, `source=followupboss` |

**International path:**

| Test | What it checks |
|------|---------------|
| Returns 200 with `region: "international"` | correct routing decision |
| `data_mapping` row created | `deel_contract_id` is set, `bamboohr_id` is null |

**Error handling:**

| Test | What it checks |
|------|---------------|
| Missing `personId` → 500 | bad payload doesn't crash the process |
| `sync_events` row written with `status=error` | failures are always recorded |

### `bamboohr-docs-signed.test.js`

Tests `POST /webhooks/bamboohr` — creates the Jira ticket for USA hires. Each test seeds a `data_mapping` row first to simulate the state left by the FUB webhook.

| Test | What it checks |
|------|---------------|
| Returns 200 with a Jira issue key | `OB-N` format |
| `data_mapping` updated | `jira_issue_key` set, `sync_stage=jira_created` |
| `sync_events` row written | `status=processed` |
| Missing `employeeId` → 500 | bad payload handled |
| Unknown `bamboohr_id` → 500 | error message contains "No data_mapping" |

### `deel-contract-signed.test.js`

Tests `POST /webhooks/deel` — creates the Jira ticket and shipping subtask for international hires. Each test seeds a `data_mapping` row first.

| Test | What it checks |
|------|---------------|
| Returns both `issueKey` and `shippingSubtaskKey` | both Jira items are created |
| Subtask key differs from parent key | they are two distinct Jira issues |
| `data_mapping` updated | `jira_issue_key` set, `sync_stage=jira_created` |
| `sync_events` row written | `status=processed`, `source=deel` |
| Missing `contractId` → 500 | bad payload handled |
| Unknown `deel_contract_id` → 500 | error message contains "No data_mapping" |

---

## Adding Tests

When you add new functionality, the pattern to follow:

**New transform logic** → add unit tests in `tests/transforms/`. Pass a fixture object in, assert fields on the output object. Keep fixtures at the top of the file so they're easy to update.

**New webhook behavior** → add integration tests in `tests/webhooks/`. Use `supertest` to POST to the endpoint, then query the DB directly with `getDb()` to assert the side effects.

**New routing logic in `fub-docs-signed`** → add a fixture person to `src/api/followupboss/mock.js` with the relevant tags, then test the route decision and DB state.
