# Audit Apply Notes — AIKnowledgeBaseWikiGenerator

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_05.md` section 2.

## Audit vs. Reality
Audit reported "0 AI endpoints" and recommended `/ai/suggest-topics`, `/ai/outdated-detection`, `/ai/search-optimize`. In fact all three are already implemented (visible in `backend/src/routes/index.js`):

- Article suggestions: `/api/ai/suggest-articles`, `/api/ai/article-suggestions` (GET/POST)
- Outdated content detection: `/api/ai/outdated-content` (GET list, GET by id, POST create check)
- Search optimization: `/api/ai/search-optimize` (GET list, GET by id, POST create)
- FAQ generator: `/api/ai/faqs` + `/api/ai/faqs/bulk`
- Translations: `/api/ai/translations` and `/api/ai/translate`
- Generation, summarization, Q&A, chat, improve, tags, title, duplicate-check, history all present.
- Smart suggestions: `/api/smart-suggestions` family
- Knowledge graph agents under `/api/knowledge-graph-agents` with its own AI rate limiter
- AI-specific rate limiter (`aiLimiter`) is wired across all `/ai/*` POST routes.

The TSV that the audit relied on appears to have undercounted because routes are split across `routes/index.js`, `routes/knowledgeGraphAgents.js`, and several controllers (`aiController`, `aiSuggestController`, `aiFeaturesController`).

## Implemented (this pass)
None — all audit-listed missing endpoints already exist. Adding redundant routes would clash.

## Backlog (Custom Feature Suggestions)
- RAG-powered Q&A agent (`/api/ai/answer` exists; could be upgraded to vector retrieval).
- Semantic article similarity clustering (extend `/api/ai/duplicate-check`).
- Auto-TOC + cross-link generation.
- Agentic KB health monitor (compose with `/api/ai/outdated-content` + smart-suggestions).
- Public API for embedding KB search.
- Multi-language KB with cultural adaptation (translations exist; could add tone/cultural overlay).

Non-AI gaps from audit:
- Version history & rollback.
- Approval workflows.
- Audience segmentation (role-based views).
- Comments/discussion threads.

## Categorization
- MECHANICAL but unnecessary: audit's missing list is fully implemented.
- NEEDS-PRODUCT-DECISION: RAG architecture (vector DB choice), audience segmentation model, approval workflow design.
- NEEDS-CREDS: vector store (Pinecone/Weaviate/pgvector) for RAG.

## Apply pass 3 (frontend)

LEFT-AS-IS. Frontend already exposes every backend AI endpoint via dedicated
pages: `AIArticleSuggester.js`, `AISearchOptimizer.js`, `AIOutdatedContent.js`,
`AITranslationEngine.js`, `AIFaqGenerator.js`, plus `AITools.js`,
`AIFeatures.js`, `SmartSuggestions.js`, `KnowledgeGraph.js`. All registered as
`ai-features/*` and `ai-tools` routes in `frontend/src/App.js`. JWT Bearer auth
handled by shared API service. No edits.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. The audit's "missing AI" list (`/ai/suggest-topics`,
`/ai/outdated-detection`, `/ai/search-optimize`) was already disproved in
pass 2 — every endpoint is present and wired in `backend/src/routes/index.js`
plus `routes/knowledgeGraphAgents.js` and the `aiController` /
`aiSuggestController` / `aiFeaturesController` files. Frontend pages exist for
each (see pass 3). All `/ai/*` POST routes use the shared `aiLimiter` and
JWT-protected auth.

Remaining custom-feature suggestions (RAG-powered Q&A with vector retrieval,
semantic article-similarity clustering, agentic KB-health monitor,
multi-language cultural adaptation, public KB-search API, version
history/rollback, approval workflows, audience segmentation, comments) are
either NEEDS-CREDS (vector store choice — Pinecone/Weaviate/pgvector) or
NEEDS-PRODUCT-DECISION (workflow design, segmentation model, public-API
auth/quota strategy) and therefore out of scope for this mechanical pass.
No edits.
