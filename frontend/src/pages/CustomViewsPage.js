import React from 'react';
import ArticleViewCountsChart from '../components/ArticleViewCountsChart';
import TopicCoverageHeatmap from '../components/TopicCoverageHeatmap';
import DocumentationPdfExport from '../components/DocumentationPdfExport';
import ContentRulesEditor from '../components/ContentRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>KB Custom Views</h1>
        <p style={{ color: '#6b7280', marginTop: 0 }}>
          Visualisations and operational tools for the knowledge base.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <ArticleViewCountsChart />
        <TopicCoverageHeatmap />
        <DocumentationPdfExport />
        <ContentRulesEditor />
      </section>
    </div>
  );
}
