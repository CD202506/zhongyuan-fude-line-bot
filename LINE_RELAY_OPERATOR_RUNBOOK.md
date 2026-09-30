# LINE relay OFF-baseline operator runbook

Owner: organization_admin / 總幹事. Gate V2-0930-1400-01.

## Limits

Pilot and outbound stay OFF; allowlist stays empty. This release only permits
synthetic handoff. Real webhook events continue V1 without journal/receipt I/O.
Do not change webhook URL. No normal operation requires direct SQL.

## Runtime configuration

Use Render environment UI. Never paste credentials into chat, source or logs.
LEGACY_RELAY_RUNTIME=off_journal
RECEIPT_ADMISSION_URL=https://zhongyuan-fude-line-admission-5ektxaybca-de.a.run.app
RECEIPT_ADMISSION_KEY_ID=render-admission-v1
RECEIPT_ORGANIZATION_ID uses the approved organization UUID.
RECEIPT_ADMISSION_HMAC is the dedicated admission credential, custodian-entered.
Persistent disk must be mounted at /var/data/line-journal; single Render instance.

## Actions in authenticated Render Shell

- Inspect aggregate: `python relay_runtime.py metrics`
- Inspect one: `python relay_runtime.py inspect --key <sha256-key>`
- Synthetic handoff: `python relay_runtime.py send-synthetic --reference synthetic-gate1400-<unique-case>`
- Retry: inspect first; only retryable_failure can resend the SAME reference.
  `python relay_runtime.py retry --key <key> --actor <actor-sha256> --evidence <case-sha256>`
  records operator review; run send-synthetic with the SAME reference to resend.
  Maximum five attempts; a new reference must never bypass the retry budget.
- Reclaim: `python relay_runtime.py reclaim --key <key> --actor <actor-sha256> --evidence <case-sha256>`
  only after ten-second lease expiry; becomes unknown_outcome, never auto-resends.
- Unknown outcome: inspect private receiver using its authenticated operator
  contract and reconcile the original event identity before resolving. No blind retry.
- Resolve: `python relay_runtime.py resolve --key <key> --actor <actor-sha256> --evidence <case-sha256>`
  accepts durable_accepted, unknown_outcome or terminal_failure; preserves history.
- Pause Pilot / outbound / kill: `python relay_runtime.py pause-pilot`,
  `python relay_runtime.py pause-outbound`, `python relay_runtime.py kill`.
  These verify this release's immutable OFF state; they cannot enable anything.
  To disable synthetic tooling too, set LEGACY_RELAY_RUNTIME=disabled and redeploy.

Actor/case hashes are audit references, not authorization. Render Shell access
is the operator boundary. Keep source evidence in the operator incident record.

## Failure and maintenance

Timeout after attempted means unknown_outcome. Connection refusal means
retryable_failure. Auth rejection means terminal_failure: fix credential scope,
never print its value. Journal unavailable must not block V1; /ready returns503.
Metadata collector runs separately and cannot block LINE ACK.
Use SQLite online backup through an approved operator maintenance session;
never copy a live database blindly. Preserve Render disk during rollback.
Provider disk snapshots are separate from an off-provider backup policy.

## Rotation and rollback

For rotation, provision a new dedicated admission version/key id, configure the
receiver's previous key/id overlap, let the custodian update Render, verify only
synthetic traffic, then remove previous acceptance and disable old version.
Never use the LINE channel secret or private operator key for relay.
Rollback code to abf2e7b9aef89776090714fa4301be4e6dfeaee1 and disable relay mode.
Keep webhook URL, disk and journal records intact; V2 Chat is unaffected.
Already accepted receipts must remain V2-owned; this OFF-only release cannot
activate real routing. Pilot activation requires a separate reviewed Gate.
