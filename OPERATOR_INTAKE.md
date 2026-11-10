# OPERATOR_INTAKE.md — Consolidated Readiness Check

**Purpose:** One complete intake before repository modifications. The agent must first inspect repository/environment for existing answers, then ask all genuinely missing critical questions together. This is not a sequence of phase-by-phase approval prompts.

**Status at blueprint handoff:** Not completed. Fields marked `PENDING` must be validated in Phase 0. Do not put secret values in this document; record only secret-manager references and validation status.

| Area | Required input / question | Default or safe rule | Status / source | Authority boundary |
|---|---|---|---|---|
| Target repository | Exact Git repo URL/local path, owner, branch and write access? | Do not assume Assay is target | PENDING | No repo changes before target confirmed |
| Existing work | Are there existing branches, code, DB, CI or deployment to preserve? | Inspect before changing; never overwrite uncommitted work | PENDING | Preserve user work |
| Product identity | Confirm Interlock name/pronunciation and Total Recall audience? | Interlock; “IN-ter-lock” provisional | PENDING | Product naming can be corrected before build |
| UI reference | Attach at least one owned/licensed reference image (or small set) and state source/ownership/intended screens. | If absent, ask now; no fabricated supplied asset | PENDING — critical | Agent-generated image only with explicit authorization |
| Visual constraints | Brand colors/fonts, logo, existing assets, responsive priorities? | Extract principles from reference; original UI | PENDING | Do not copy third-party branding/assets |
| Supabase | Project URL/ref, access role, Auth enabled, migration permissions, preview vs prod project? | Separate preview/test data from production | PENDING — critical | No destructive prod migration without authority |
| Walrus Memory | Dedicated account ID, namespace, SDK access and delegated keys for Scout/policy/Sentinel/Runner? | Dedicated Interlock namespace; never sample/shared account | PENDING — critical | Do not disclose key values in docs/logs; no unapproved account sharing |
| Walrus test | Can a signed mainnet write complete, produce blob ID, list metadata and recall matching content? | Test with safe synthetic fact | PENDING — critical | Do not report integration available before evidence |
| Tatum | API key in secret store and a public Sui mainnet demo address? | Public address only; native SUI coin type | PENDING — critical | Never request private key/seed phrase |
| Tatum method | Does Tatum endpoint support `StateService.GetBalance` with current official proto? | Must smoke-test exact gRPC method | PENDING — critical | Do not silently use deprecated JSON-RPC or alternate provider |
| OpenAI | API access, approved model, quota, max daily requests and dollar ceiling? | Optional; deterministic Analyst fallback if unavailable | PENDING | No spend beyond explicit ceiling |
| Vercel | Project/team access, protected preview ability, domain? | Protected preview; no prod secrets | PENDING — critical for hosted preview | Preview permission is not production permission |
| Other services | Any existing logging/monitoring provider? | Optional; don't add paid service without approval | PENDING | No unapproved integrations |
| Budget | Total permitted spend across Walrus, Tatum, Supabase, OpenAI, Vercel, TTS and video tooling? | **$0 unapproved spend** | PENDING — critical | An API key is not unlimited spending authority |
| Quotas | Known provider quotas/rate limits and expected demo load? | Conservative low-rate limits and bounded retries | PENDING | Stop before overage |
| Production | May agent deploy production, migrate production DB, configure DNS or publish public content? | **No; production release DENIED** | PENDING — critical | Exact actions must be authorized individually |
| Data policy | Can synthetic/public wallet data be used in preview/demo? Any prohibited data? | Public address + synthetic data only | PENDING | No sensitive production data in preview |
| Demo audience | Judges, developers, customers or internal team? | Hackathon judges | PENDING | Keep story and terminology audience-appropriate |
| Demo pronunciation | How should Interlock and technical names be pronounced? | Interlock: “IN-ter-lock” provisional | PENDING | Narration uses confirmed wording |
| Demo output | Approved output directory, repository path, file sharing requirements? | `demo/` in repo unless size or privacy requires external artifact | PENDING | No public video upload without authority |
| Redactions | Accounts, wallet address fragments, private URLs, email, environment info to redact? | Redact secrets, private URLs, personal data and private identifiers | PENDING | Never show keys/tokens or private workspace details |
| TTS | Can agent check free Google AI voice/TTS and use an approved genuinely-free fallback? | Check live free quota/terms; no charges | PENDING | Stop before paid usage |
| GitHub visibility | Is repository public and may footer link to it? | Omit GitHub link unless verified public and approved | PENDING | Never leak private repository URL |
| Support/legal | Are real support, privacy and terms URLs available? | Do not invent; omit until real destinations supplied | PENDING | No fabricated legal claims |

## Critical readiness checklist

- [ ] Repository and branch confirmed; access verified.
- [ ] Existing repo inspected; no uncommitted work will be overwritten.
- [ ] Reference image(s) attached and inspected, or explicit image-generation authorization recorded.
- [ ] Supabase project and migration access verified.
- [ ] Walrus dedicated account/namespace/delegates validated with signed write → completed job → metadata → recall test.
- [ ] Tatum key/public address validated; exact `StateService.GetBalance` method works against approved endpoint.
- [ ] OpenAI choice and spend ceiling recorded, or deterministic fallback accepted.
- [ ] Preview host access and protection verified.
- [ ] Budget ceiling, quota limits and no-charge restrictions recorded.
- [ ] Production actions explicitly authorized or marked DENIED.
- [ ] Demo audience, pronunciation, redactions and output directory recorded.

## Readiness result

- `READY`: all critical inputs validated; Phase 1 may begin.
- `BLOCKED`: one or more critical inputs missing; no code changes until resolved, though unrelated safe repository inspection/documentation may continue.
- `PARTIAL`: an optional integration is unavailable but a documented safe fallback is approved; proceed only if core requirements remain demonstrable.

| Field | Value |
|---|---|
| Readiness | NOT ASSESSED |
| Reviewed by | Coding agent during Phase 0 |
| Date/time | To be recorded |
| Blocking items | All PENDING critical entries above |
| Explicit production authority | DENIED unless changed in writing |
