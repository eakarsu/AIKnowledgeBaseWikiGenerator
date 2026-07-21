# Governed knowledge publishing operations

## Supported local boundary

The production-shaped path is `/api/governed-knowledge-publishing`. A work item captures versioned source digests, rights, source ACLs, ownership, parsed pages, review state, freshness, link/accessibility checks, retrieval fixtures, and cited answers. It never publishes or calls a model/provider directly.

The state machine is `draft -> submitted -> approved|rejected`, with approved records optionally retired and eligible records entering receipt-backed erasure. Every transition uses optimistic versions and an append-only tenant-scoped event.

## Security and approval

JWTs need a deployment-managed secret of at least 32 characters and a signed `tenantId`; missing configuration returns 503. Publishing approvers are editor, publisher, knowledge owner, or admin, and cannot approve their own item. Full exports and event history are limited to the creator, approver, or admin. Source/page ACL validation rejects widened access and injected instruction-like content unless it is explicitly quarantined.

Use a unique `Idempotency-Key` for evaluation, connector enqueue, and erasure. Keys are bound to a canonical SHA-256 request digest; reuse with another payload fails with 409.

## Lifecycle

- `./start.sh check` validates local configuration shape without network or database access.
- `./start.sh start` requires preinstalled dependencies and starts only this repository's processes. It never installs, seeds, migrates, creates databases, or kills ports.
- `ALLOW_SCHEMA_MIGRATION=true DATABASE_URL=... ./start.sh migrate` is the sole schema path. Review backup and rollback procedures first.
- Demo seeding is destructive, excluded from startup/CI, forbidden in production, and additionally requires `ALLOW_DEMO_SEED=true` plus an explicit 12-character password.

Generated gap routes remain unmounted. Other generated prototype routes require `ENABLE_GENERATED_ROUTES=true` and are still unavailable in production.

## External systems and failure

Document/SaaS, CMS, search, vector, identity, model-gateway, and notification operations only enter the durable outbox after independent approval. No worker or credentials are included. An integration worker must obtain secrets from a broker, preserve provider cursors in checkpoints, use the stored idempotency key, and post delivery/failure receipts. Five failed attempts dead-letter the item. Publication, deletion completion, and claims about connected search remain closed until authoritative credentials, contracts, safe tenants, and receipts exist.

## Verification

Run `node --test backend/src/governance/tests/*.test.js`, exhaustive `node --check` on changed JavaScript, and `bash -n start.sh`. CI repeats domain, contract, authorization, migration, integration, failure, and lifecycle checks. No connected-corpus recall, provider, database, or deployment claim is made by local tests.

