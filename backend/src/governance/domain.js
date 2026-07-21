'use strict';
function evaluate(input = {}) {
  const errors = [], sources = Array.isArray(input.sources) ? input.sources : [];
  const pages = Array.isArray(input.pages) ? input.pages : [], answers = Array.isArray(input.answers) ? input.answers : [];
  const evaluatedAt = Date.parse(input.evaluatedAt);
  if (!Number.isFinite(evaluatedAt)) errors.push('evaluatedAt timestamp required for deterministic freshness');
  if (!sources.length || !pages.length) errors.push('at least one governed source and page are required');
  const sourceMap = new Map();
  for (const source of sources) {
    if (sourceMap.has(String(source.id))) errors.push(`duplicate source ${source.id || '?'}`);
    if (!source.id || !source.version || !/^[a-f0-9]{64}$/i.test(source.sha256 || '') ||
        !source.rightsBasis || !Array.isArray(source.acl) || !source.ownerId) {
      errors.push(`source ${source.id || '?'} lacks version, digest, rights, ACL, or owner`);
    }
    if (/ignore (all|previous)|<script|system prompt/i.test(String(source.content || '')) && source.quarantined !== true) {
      errors.push(`source ${source.id || '?'} contains unquarantined instruction-like content`);
    }
    sourceMap.set(String(source.id), source);
  }
  let parsed = 0, permissionSafe = 0, fresh = 0, accessible = 0;
  const pageMap = new Map();
  for (const page of pages) {
    const source = sourceMap.get(String(page.sourceId));
    if (!page.id || !source || page.sourceVersion !== source?.version || !Number.isInteger(page.version) || page.version < 1 || !page.ownerId || !page.reviewerId) {
      errors.push(`page ${page.id || '?'} lacks source, version, owner, or reviewer`);
    }
    if (page.ownerId === page.reviewerId && page.status === 'published') errors.push(`page ${page.id} is self-published`);
    if (!['draft','review','published','retired'].includes(page.status)) errors.push(`page ${page.id || '?'} status invalid`);
    const acl = Array.isArray(page.acl) ? page.acl : [];
    if (source && acl.some((principal) => !source.acl.includes(principal))) errors.push(`page ${page.id} widens source ACL`);
    else if (source) permissionSafe += 1;
    if (Array.isArray(page.sections) && page.sections.length && page.parseVersion) parsed += 1;
    if (Number.isFinite(evaluatedAt) && Date.parse(page.freshUntil) >= evaluatedAt) fresh += 1;
    if (page.accessibility && page.accessibility.headingOrder === true && Number(page.accessibility.altCoverage) === 1) accessible += 1;
    for (const link of page.links || []) if (link.status !== 'ok') errors.push(`page ${page.id} contains broken link ${link.url || '?'}`);
    pageMap.set(String(page.id), page);
  }
  let supportedClaims = 0, totalClaims = 0;
  for (const answer of answers) for (const claim of answer.claims || []) {
    totalClaims += 1;
    const valid = Array.isArray(claim.citations) && claim.citations.length &&
      claim.citations.every((c) => pageMap.has(String(c.pageId)) && Number(c.entailment) >= 0.8);
    if (valid) supportedClaims += 1; else errors.push(`answer claim ${claim.id || '?'} lacks entailed citations`);
  }
  const evaluation = input.evaluation || {};
  const retrievalCases = Array.isArray(evaluation.retrievalCases) ? evaluation.retrievalCases : [];
  let expectedPages = 0, retrievedExpectedPages = 0;
  if (!evaluation.corpusVersion || !evaluation.querySetVersion || !retrievalCases.length) {
    errors.push('versioned parsing and retrieval evaluation is required');
  }
  for (const testCase of retrievalCases) {
    const expected = Array.isArray(testCase.expectedPageIds) ? testCase.expectedPageIds.map(String) : [];
    const retrieved = Array.isArray(testCase.retrievedPageIds) ? testCase.retrievedPageIds.map(String) : [];
    if (!testCase.id || !testCase.principal || !expected.length) errors.push(`retrieval case ${testCase.id || '?'} is incomplete`);
    expectedPages += expected.length;
    retrievedExpectedPages += expected.filter((id) => retrieved.includes(id)).length;
    for (const id of retrieved) {
      const page = pageMap.get(id);
      if (!page || !(page.acl || []).includes(testCase.principal)) errors.push(`retrieval case ${testCase.id || '?'} leaks or references an unknown page`);
    }
  }
  if (Number(evaluation.parsingRegressionFailures) !== 0 || Number(evaluation.publishingRegressionFailures) !== 0) {
    errors.push('parsing or publishing regressions remain');
  }
  const count = Math.max(1, pages.length);
  return { errors, result: {
    coverage: { parsing: parsed / count, permissions: permissionSafe / count, freshness: fresh / count, accessibility: accessible / count },
    citationEntailment: totalClaims ? supportedClaims / totalClaims : 1,
    retrievalRecall: expectedPages ? retrievedExpectedPages / expectedPages : 0,
    published: pages.filter((p) => p.status === 'published').length,
    retired: pages.filter((p) => p.status === 'retired').length,
    decision: errors.length ? 'revise' : 'reviewable'
  }, assumptions: ['connector snapshots and source ACLs are authoritative only at capturedAt'],
  uncertainty: { authoritativeRecallRequiresConnectedCorpus: true, publicationOwnerReviewRequired: true, searchIndexNotConnected: true } };
}
module.exports = { evaluate };
