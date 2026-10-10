---
name: plan-security-review
description: Use when the user wants their application secured but the target is NOT yet a single URL, repo or API - 'review our security', 'we have a customer security questionnaire', 'audit before launch', or they do not know which test they need. Maps the assets (repos, environments, APIs, CI), routes each to the right specific workflow, then merges the results into one ranked remediation plan. If the target is already a known single asset, use that asset's skill directly instead.
license: Apache-2.0
metadata:
  author: usestrix
  homepage: https://docs.strix.ai
---

# Application security testing

Entry point for "make my application secure" requests, where the target is not yet a single URL or repo. The job here is to pick the right test per asset, run it, and produce one ranked plan — not to run everything at maximum depth.

Install, LLM setup, all CLI flags, and the managed-cloud path live in the **run-penetration-test** skill. Read it first if `strix --version` fails.

Only test assets the user owns or is authorized to test. Confirm authorization before the first run, and prefer staging over production, because the agents send real exploit payloads and can change data.

## 1. Map the assets

Ask (or read from the repo) and write the answers down before scanning:

- **Source** — one repo, a monorepo, several services? Which languages/frameworks?
- **Running environments** — is there a staging deployment? A public production site? A local dev server only?
- **APIs** — REST, GraphQL, gRPC? Is there an OpenAPI/GraphQL schema?
- **Authentication** — can you get two test accounts in different tenants? Most high-impact bugs need them.
- **Constraints** — out-of-scope paths, whether production may be touched, budget and wall-clock limits.

If there is no staging environment and production is off limits, say so early. A code-only review is still valuable, but it cannot prove exploitability against a live app.

## 2. Pick the right test per asset

| Asset | Skill to use |
| --- | --- |
| Repository or working tree | **find-security-vulnerabilities-in-code** |
| Live web app or staging site | **test-web-app-security** |
| REST/GraphQL/gRPC API | **test-api-security** |
| Assessment mapped to OWASP categories | **test-owasp-top-10** |
| Every pull request, continuously | **add-security-scanning-to-ci** |
| No Docker, no LLM key, or a report an auditor will accept | **managed-pentesting-with-strix** |

Those skills carry the flags, credential handling, and result-reading details. Do not duplicate their instructions here.

Sequence for a first assessment:

1. Review the code. It is the cheapest run and it maps the authorization model.
2. Pentest staging with credentials, and pass the repo as a second target so the agents keep source context.
3. Add CI scanning, so later regressions are caught without another manual pass.

Run one asset at a time and read each report before starting the next. Findings from the code review make the live run sharper.

## 3. Consolidate into one plan

Findings arrive per run in `strix_runs/<run>/`. Merge them into a single list and rank by **proven impact**, not by scanner severity:

1. Validated exploits reachable without authentication.
2. Validated cross-tenant or privilege-escalation issues.
3. Validated issues needing an authenticated account.
4. Unproven observations (configuration, dependency, and hardening notes) — flag as such, and never present them as confirmed vulnerabilities.

Deduplicate: the same root cause often surfaces in both the code review and the live pentest.

## 4. Be honest about coverage

State plainly what was *not* tested — assets with no staging environment, categories a black-box run cannot reach (logging and alerting, supply-chain integrity, insecure design), and any run that hit its budget or turn cap before finishing. Check `run.json` status and cost against `--max-budget` for each run. An empty result set from a truncated scan is not a clean bill of health.

Then remediate with **fix-security-vulnerabilities**, which re-runs Strix against each fix to prove the exploit no longer works.
