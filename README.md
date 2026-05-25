# Project Zero

Zero Waste, Zero Oversight, Zero Resources.
We're gonna build a backend so clean you could eat a ham sandwich off this thang.

---

## What It Does

Project Zero is an employee onboarding automation backend. When a new hire signs their offer letter in Follow Up Boss, this system automatically routes them to the correct HR platform and opens an IT provisioning ticket in Jira — with zero manual steps.

**USA hires** → BambooHR → Jira (6 days to ready)
**International hires** → Deel → Jira + RUSH shipping subtask (45 days to ready)

The 45-day international path exists because equipment shipping to some countries takes 30-60 days. The system detects international hires at the offer stage so IT gets the head start they need.

---

## Systems Connected

| System | Role |
|--------|------|
| Follow Up Boss | Source of truth — offer tracking, tags, candidate data |
| BambooHR | HRIS for USA employees |
| Deel | Employer of Record for international hires (130+ countries) |
| Jira Service Management | IT provisioning tickets |
| SQLite | Local audit trail and ID mapping |

---

## The Flow

```
Follow Up Boss
  └── candidate signs offer → "Docs-Signed" tag added
        │
        ▼
  POST /webhooks/fub
        │
        ├── "Hired-USA" tag?
        │     └── Create BambooHR employee
        │           └── BambooHR sends docs-signed webhook
        │                 └── POST /webhooks/bamboohr
        │                       └── Create Jira "Employee Onboarding" issue
        │
        └── "Hired-International" tag?
              └── Create Deel contract
                    └── Deel sends contract-signed webhook
                          └── POST /webhooks/deel
                                ├── Create Jira "Employee Onboarding" issue
                                └── Create Jira subtask: "RUSH: International Equipment Shipping"
```

---

## Setup

**Requirements:** Node.js v20 LTS

```bash
git clone <repo>
cd ProjectZero
cp .env.example .env
npm install
npm run dev
```

The server starts on port 3000. On first run, `data/integration.db` is created automatically with the correct schema.

Verify it's running:
```bash
curl http://localhost:3000/health
# {"status":"ok","apis":{"followupboss":"mock","bamboohr":"mock","deel":"mock","jira":"mock"}}
```

---

## Environment Variables

All variables live in `.env`. Copy from `.env.example` to get started.

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `USE_MOCK_API` | `true` = use mocks, `false` = use real APIs |
| `FUB_API_KEY` | Follow Up Boss API key |
| `FUB_SYSTEM_KEY` | Follow Up Boss system key (x-system-key header) |
| `BAMBOOHR_API_KEY` | BambooHR API key |
| `BAMBOOHR_SUBDOMAIN` | Your BambooHR subdomain |
| `DEEL_API_KEY` | Deel Bearer token |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_BASE_URL` | e.g. `https://yourorg.atlassian.net` |
| `JIRA_PROJECT_KEY` | Jira project key (default: `OB`) |
| `JIRA_EMAIL` | Email tied to the Jira API token |

---

## Running Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start server with hot reload (nodemon) |
| `npm start` | Start server (production) |
| `npm test` | Run all 70 tests |
| `npm run discover` | Query real APIs for field IDs (requires real credentials) |

---

## Webhook Endpoints

All three endpoints accept `POST` with a JSON body.

### `POST /webhooks/fub`

Triggered when Follow Up Boss fires a `Docs-Signed` event. Routes the hire to BambooHR or Deel based on their tags.

```bash
# USA hire
curl -X POST http://localhost:3000/webhooks/fub \
  -H "Content-Type: application/json" \
  -d '{"id":"evt-001","personId":"mock-fub-001"}'

# International hire
curl -X POST http://localhost:3000/webhooks/fub \
  -H "Content-Type: application/json" \
  -d '{"id":"evt-002","personId":"mock-fub-002"}'
```

### `POST /webhooks/bamboohr`

Triggered when BambooHR fires a docs-signed event. Creates the Jira onboarding issue for USA hires.

```bash
curl -X POST http://localhost:3000/webhooks/bamboohr \
  -H "Content-Type: application/json" \
  -d '{"id":"evt-003","employeeId":"mock-bhr-001"}'
```

### `POST /webhooks/deel`

Triggered when Deel fires a contract-signed event. Creates the Jira onboarding issue and the RUSH shipping subtask for international hires.

```bash
curl -X POST http://localhost:3000/webhooks/deel \
  -H "Content-Type: application/json" \
  -d '{"id":"evt-004","contractId":"mock-deel-001"}'
```

---

## Tag System

Tags in Follow Up Boss drive all routing and equipment detection. No tags, no routing.

| Tag | Purpose |
|-----|---------|
| `Hired-USA` | Routes hire to BambooHR |
| `Hired-International` | Routes hire to Deel |
| `Dept-{Name}` | Sets department (e.g. `Dept-Engineering`) |
| `Equipment-Laptop` | Adds laptop to provisioning ticket |
| `Equipment-Monitor` | Adds monitor to provisioning ticket |
| `Equipment-Badge` | Adds badge to provisioning ticket |
| `Equipment-International-Shipping` | Signals international shipping needed |
| `Docs-Signed` | Gate that triggers the entire pipeline |

---

## Mock vs Real APIs

The system ships with full mock implementations of all four external APIs. Mocks are on by default — the entire pipeline runs and is testable with no credentials.

**To switch to real APIs:**

1. Add credentials to `.env`
2. Run field discovery to get real Jira and BambooHR field IDs:
   ```bash
   npm run discover
   ```
3. Update the `FIELD` map in `src/transform/bamboohr-to-jira.js` with the real IDs from discovery output
4. Set `USE_MOCK_API=false` in `.env`
5. Run `npm test` to confirm everything passes
6. Deploy

The mock/real switch happens in `src/api/index.js` — it reads `USE_MOCK_API` from config and loads the correct implementation for each system. Zero code changes required.

---

## Project Structure

```
src/
├── server.js                  # Express app, webhook routes, health endpoint
├── config.js                  # Reads .env, exports structured config
├── logger.js                  # Winston logger → logs/app.log + console
├── api/
│   ├── index.js               # Mock/real switcher for all 4 systems
│   ├── followupboss/
│   │   ├── mock.js            # Fixture data, in-memory state
│   │   └── real.js            # HTTP Basic auth + x-system-key header
│   ├── bamboohr/
│   │   ├── mock.js
│   │   └── real.js            # HTTP Basic auth
│   ├── deel/
│   │   ├── mock.js
│   │   └── real.js            # Bearer token
│   └── jira/
│       ├── mock.js
│       └── real.js            # Basic auth (email:token base64)
├── webhooks/
│   ├── fub-docs-signed.js     # Entry point — routes USA vs International
│   ├── bamboohr-docs-signed.js
│   └── deel-contract-signed.js
├── transform/
│   ├── fub-to-bamboohr.js     # FUB person → BambooHR employee payload
│   ├── fub-to-deel.js         # FUB person → Deel contract payload
│   ├── bamboohr-to-jira.js    # BambooHR employee → Jira issue (placeholder field IDs)
│   └── deel-to-jira.js        # Deel contract → Jira issue + shipping subtask
├── db/
│   ├── connection.js          # SQLite singleton, runs schema on init
│   └── schema.sql             # 3 tables: sync_events, data_mapping, validation_errors
└── tools/
    ├── field-discovery.js     # Discovers Jira + BambooHR custom field IDs
    ├── jira-jsm-discovery.js  # Discovers JSM request types and form fields
    └── deel-discovery.js      # Discovers Deel country requirements

tests/
├── transforms/
│   ├── fub-to-bamboohr.test.js
│   ├── fub-to-deel.test.js
│   ├── bamboohr-to-jira.test.js
│   └── deel-to-jira.test.js
└── webhooks/
    ├── fub-docs-signed.test.js
    ├── bamboohr-docs-signed.test.js
    └── deel-contract-signed.test.js

data/
└── integration.db             # SQLite database (auto-created, git-ignored)

logs/
└── app.log                    # Append-only audit log (git-ignored)
```

---

## Database

Three tables in `data/integration.db`:

**`sync_events`** — every inbound webhook, win or fail
- `webhook_id`, `source`, `event_type`, `payload`, `status`, `error`, `created_at`

**`data_mapping`** — links a person across all systems
- `fub_person_id` ↔ `bamboohr_id` ↔ `deel_contract_id` ↔ `jira_issue_key`
- `region` (`usa` or `international`), `sync_stage`, timestamps

**`validation_errors`** — field-level validation failures with severity

---

## Jira Onboarding Ticket

Both paths create the same issue type in JSM project `OB`:

**Issue type:** Employee Onboarding
**Fields:** Location, First Name, Last Name, Preferred Name, Start Date, Region, Address, Personal Email, Position, Phone Number, Department, Manager, Equipment Needed, System Access, Notes

**International hires also get a subtask:**
- Summary: `RUSH: International Equipment Shipping — {Name} ({Country})`
- Priority: Highest
- Description includes 30-60 day lead time warning and Deel contract ID
