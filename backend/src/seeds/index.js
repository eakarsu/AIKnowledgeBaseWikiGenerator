const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { pool, initializeDatabase } = require('../config/database');

const seed = async () => {
  console.log('Starting database seeding...');

  try {
    await initializeDatabase();

    // Clear existing data
    await pool.query(`
      TRUNCATE TABLE password_reset_tokens, token_blacklist, email_verifications,
      ai_translations, faq_entries, outdated_content, search_optimizations,
      api_documentations, article_suggestions, smart_suggestions, translations, notifications, search_history,
      team_members, teams, analytics, ai_generations, version_history, bookmarks,
      comments, article_tags, articles, templates, tags, categories, users CASCADE
    `);

    // Seed Users (15+)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [];
    const userNames = [
      { name: 'John Admin', email: 'admin@knowledgebase.com', role: 'admin' },
      { name: 'Sarah Editor', email: 'sarah@knowledgebase.com', role: 'editor' },
      { name: 'Mike Writer', email: 'mike@knowledgebase.com', role: 'user' },
      { name: 'Emily Designer', email: 'emily@knowledgebase.com', role: 'user' },
      { name: 'David Developer', email: 'david@knowledgebase.com', role: 'user' },
      { name: 'Lisa Manager', email: 'lisa@knowledgebase.com', role: 'admin' },
      { name: 'Tom Analyst', email: 'tom@knowledgebase.com', role: 'user' },
      { name: 'Jane Support', email: 'jane@knowledgebase.com', role: 'user' },
      { name: 'Chris Engineer', email: 'chris@knowledgebase.com', role: 'user' },
      { name: 'Amy Product', email: 'amy@knowledgebase.com', role: 'user' },
      { name: 'Kevin Sales', email: 'kevin@knowledgebase.com', role: 'user' },
      { name: 'Nicole HR', email: 'nicole@knowledgebase.com', role: 'user' },
      { name: 'Brian QA', email: 'brian@knowledgebase.com', role: 'user' },
      { name: 'Demo User', email: 'demo@example.com', role: 'user' },
      { name: 'Test Admin', email: 'test@example.com', role: 'admin' }
    ];

    for (const user of userNames) {
      const result = await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [user.email, hashedPassword, user.name, user.role]
      );
      users.push(result.rows[0].id);
    }
    console.log('Created 15 users');

    // Seed Categories (15+)
    const categories = [];
    const categoryData = [
      { name: 'Getting Started', description: 'Beginner guides and tutorials', icon: 'rocket', color: '#3B82F6' },
      { name: 'API Documentation', description: 'REST API reference and examples', icon: 'code', color: '#10B981' },
      { name: 'User Guides', description: 'Step-by-step user manuals', icon: 'book', color: '#8B5CF6' },
      { name: 'FAQs', description: 'Frequently asked questions', icon: 'help', color: '#F59E0B' },
      { name: 'Troubleshooting', description: 'Problem solving guides', icon: 'wrench', color: '#EF4444' },
      { name: 'Best Practices', description: 'Recommended approaches', icon: 'star', color: '#EC4899' },
      { name: 'Release Notes', description: 'Version updates and changes', icon: 'tag', color: '#06B6D4' },
      { name: 'Security', description: 'Security guidelines and policies', icon: 'shield', color: '#6366F1' },
      { name: 'Integration', description: 'Third-party integrations', icon: 'link', color: '#84CC16' },
      { name: 'Configuration', description: 'System configuration guides', icon: 'cog', color: '#F97316' },
      { name: 'Development', description: 'Developer resources', icon: 'terminal', color: '#14B8A6' },
      { name: 'Architecture', description: 'System design documents', icon: 'layout', color: '#A855F7' },
      { name: 'Tutorials', description: 'Step-by-step tutorials', icon: 'graduation', color: '#0EA5E9' },
      { name: 'Policies', description: 'Company policies and procedures', icon: 'file', color: '#78716C' },
      { name: 'Templates', description: 'Document templates', icon: 'template', color: '#22C55E' }
    ];

    for (const cat of categoryData) {
      const result = await pool.query(
        'INSERT INTO categories (name, description, icon, color) VALUES ($1, $2, $3, $4) RETURNING id',
        [cat.name, cat.description, cat.icon, cat.color]
      );
      categories.push(result.rows[0].id);
    }
    console.log('Created 15 categories');

    // Seed Tags (20+)
    const tags = [];
    const tagData = [
      { name: 'javascript', color: '#F7DF1E' },
      { name: 'python', color: '#3776AB' },
      { name: 'react', color: '#61DAFB' },
      { name: 'nodejs', color: '#339933' },
      { name: 'api', color: '#FF6B6B' },
      { name: 'database', color: '#336791' },
      { name: 'security', color: '#D93025' },
      { name: 'tutorial', color: '#7C3AED' },
      { name: 'beginner', color: '#10B981' },
      { name: 'advanced', color: '#F59E0B' },
      { name: 'best-practices', color: '#EC4899' },
      { name: 'devops', color: '#4F46E5' },
      { name: 'testing', color: '#14B8A6' },
      { name: 'authentication', color: '#8B5CF6' },
      { name: 'performance', color: '#EF4444' },
      { name: 'deployment', color: '#06B6D4' },
      { name: 'configuration', color: '#84CC16' },
      { name: 'troubleshooting', color: '#F97316' },
      { name: 'integration', color: '#0EA5E9' },
      { name: 'architecture', color: '#A855F7' }
    ];

    for (const tag of tagData) {
      const result = await pool.query(
        'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING id',
        [tag.name, tag.color]
      );
      tags.push(result.rows[0].id);
    }
    console.log('Created 20 tags');

    // Seed Articles (20+)
    const articles = [];
    const articleData = [
      { title: 'Getting Started with Our Platform', content: '# Getting Started\n\nWelcome to our platform! This guide will help you get up and running quickly.\n\n## Prerequisites\n\n- A modern web browser\n- An active account\n- Basic computer skills\n\n## Step 1: Create Your Account\n\nVisit our signup page and fill in your details...\n\n## Step 2: Configure Your Profile\n\nOnce logged in, navigate to settings...\n\n## Step 3: Explore Features\n\nStart exploring our key features...', summary: 'A comprehensive guide to get started with our platform', status: 'published' },
      { title: 'REST API Authentication Guide', content: '# API Authentication\n\n## Overview\n\nOur API uses JWT tokens for authentication.\n\n## Getting Your API Key\n\n1. Navigate to Settings > API\n2. Click "Generate New Key"\n3. Copy and store securely\n\n## Making Authenticated Requests\n\n```javascript\nfetch("/api/data", {\n  headers: {\n    "Authorization": "Bearer YOUR_TOKEN"\n  }\n})\n```', summary: 'Learn how to authenticate with our REST API', status: 'published' },
      { title: 'Database Schema Overview', content: '# Database Architecture\n\n## Tables\n\n### Users Table\n- id: UUID primary key\n- email: unique identifier\n- name: display name\n\n### Articles Table\n- id: UUID primary key\n- title: article title\n- content: markdown content', summary: 'Overview of our database schema and relationships', status: 'published' },
      { title: 'Security Best Practices', content: '# Security Guidelines\n\n## Password Requirements\n\n- Minimum 12 characters\n- Mix of letters, numbers, symbols\n- No common words\n\n## Two-Factor Authentication\n\nEnable 2FA for additional security...', summary: 'Essential security practices for your account', status: 'published' },
      { title: 'Troubleshooting Login Issues', content: '# Login Problems\n\n## Common Issues\n\n### Forgot Password\n1. Click "Forgot Password"\n2. Enter your email\n3. Check inbox for reset link\n\n### Account Locked\nContact support after 5 failed attempts...', summary: 'Solutions for common login problems', status: 'published' },
      { title: 'API Rate Limiting Explained', content: '# Rate Limits\n\n## Current Limits\n\n- 100 requests per minute\n- 10,000 requests per day\n\n## Handling Rate Limit Errors\n\nWhen you exceed limits, you\'ll receive a 429 response...', summary: 'Understanding API rate limits and quotas', status: 'published' },
      { title: 'Webhook Integration Guide', content: '# Webhooks\n\n## Setting Up Webhooks\n\n1. Navigate to Settings > Webhooks\n2. Add endpoint URL\n3. Select events to subscribe\n\n## Payload Format\n\n```json\n{\n  "event": "article.created",\n  "data": {...}\n}\n```', summary: 'Configure webhooks for real-time notifications', status: 'published' },
      { title: 'Custom Theming Options', content: '# Customizing Your Theme\n\n## Available Options\n\n- Primary color\n- Secondary color\n- Font family\n- Logo upload\n\n## CSS Variables\n\n```css\n:root {\n  --primary: #3B82F6;\n  --secondary: #10B981;\n}\n```', summary: 'Personalize the look and feel of your workspace', status: 'published' },
      { title: 'Data Export and Backup', content: '# Exporting Your Data\n\n## Available Formats\n\n- JSON\n- CSV\n- Markdown\n- PDF\n\n## Scheduling Automatic Backups\n\nConfigure daily backups in Settings > Backup...', summary: 'How to export and backup your knowledge base data', status: 'published' },
      { title: 'Team Collaboration Features', content: '# Collaboration\n\n## Real-time Editing\n\nMultiple users can edit simultaneously...\n\n## Comments and Mentions\n\nUse @username to notify team members...\n\n## Version History\n\nAll changes are tracked automatically...', summary: 'Collaborate effectively with your team', status: 'published' },
      { title: 'Search Tips and Tricks', content: '# Advanced Search\n\n## Search Operators\n\n- `"exact phrase"` - Match exact phrase\n- `tag:javascript` - Filter by tag\n- `author:john` - Filter by author\n\n## Filters\n\nUse the sidebar to narrow results...', summary: 'Master the search functionality', status: 'published' },
      { title: 'Mobile App Setup', content: '# Mobile Access\n\n## Download the App\n\n- iOS: App Store\n- Android: Play Store\n\n## Logging In\n\nUse your existing credentials...\n\n## Offline Mode\n\nArticles are cached for offline reading...', summary: 'Access your knowledge base on mobile devices', status: 'published' },
      { title: 'Keyboard Shortcuts Reference', content: '# Keyboard Shortcuts\n\n## Navigation\n\n- `Ctrl + K` - Quick search\n- `Ctrl + N` - New article\n- `Ctrl + S` - Save\n\n## Editing\n\n- `Ctrl + B` - Bold\n- `Ctrl + I` - Italic\n- `Ctrl + L` - Insert link', summary: 'Speed up your workflow with keyboard shortcuts', status: 'published' },
      { title: 'Analytics Dashboard Guide', content: '# Understanding Analytics\n\n## Key Metrics\n\n- Page views\n- Unique visitors\n- Time on page\n- Bounce rate\n\n## Reports\n\nGenerate custom reports in the analytics section...', summary: 'Track and analyze your knowledge base usage', status: 'published' },
      { title: 'Content Organization Best Practices', content: '# Organizing Content\n\n## Category Structure\n\nCreate a logical hierarchy...\n\n## Tagging Strategy\n\nUse consistent tags across articles...\n\n## Linking Articles\n\nCross-reference related content...', summary: 'Strategies for organizing your knowledge base', status: 'published' },
      { title: 'Writing Effective Documentation', content: '# Documentation Tips\n\n## Structure\n\n1. Clear introduction\n2. Step-by-step instructions\n3. Examples\n4. Troubleshooting\n\n## Tone\n\nBe concise and friendly...', summary: 'Tips for creating clear and helpful documentation', status: 'draft' },
      { title: 'Version Control for Articles', content: '# Article Versioning\n\n## Viewing History\n\nClick the history icon to see all versions...\n\n## Restoring Previous Versions\n\nSelect a version and click Restore...\n\n## Comparing Versions\n\nUse the compare feature to see changes...', summary: 'Track and manage article versions', status: 'published' },
      { title: 'Single Sign-On Configuration', content: '# SSO Setup\n\n## Supported Providers\n\n- SAML 2.0\n- OAuth 2.0\n- OIDC\n\n## Configuration Steps\n\n1. Access Admin > SSO\n2. Select provider\n3. Enter credentials...', summary: 'Configure enterprise single sign-on', status: 'published' },
      { title: 'AI Features Overview', content: '# AI Capabilities\n\n## Content Generation\n\nGenerate articles from topics...\n\n## Summarization\n\nAutomatically create summaries...\n\n## Translation\n\nTranslate content to multiple languages...\n\n## Smart Suggestions\n\nGet improvement recommendations...', summary: 'Explore AI-powered features', status: 'published' },
      { title: 'Notification Settings', content: '# Managing Notifications\n\n## Email Notifications\n\n- New comments\n- Mentions\n- Article updates\n\n## In-App Notifications\n\nCustomize what appears in your notification center...', summary: 'Configure your notification preferences', status: 'published' }
    ];

    for (let i = 0; i < articleData.length; i++) {
      const article = articleData[i];
      const result = await pool.query(
        'INSERT INTO articles (title, content, summary, status, author_id, category_id, views) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [article.title, article.content, article.summary, article.status, users[i % users.length], categories[i % categories.length], Math.floor(Math.random() * 1000)]
      );
      articles.push(result.rows[0].id);

      // Add random tags to articles
      const numTags = Math.floor(Math.random() * 4) + 1;
      const shuffledTags = tags.sort(() => 0.5 - Math.random()).slice(0, numTags);
      for (const tagId of shuffledTags) {
        await pool.query(
          'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [result.rows[0].id, tagId]
        );
      }
    }
    console.log('Created 20 articles with tags');

    // Seed Templates (15+)
    const templateData = [
      { name: 'How-To Guide', description: 'Step-by-step tutorial template', content: '# How to [Task]\n\n## Overview\n\nBrief description of what this guide covers.\n\n## Prerequisites\n\n- Requirement 1\n- Requirement 2\n\n## Steps\n\n### Step 1: [First Step]\n\nDescription...\n\n### Step 2: [Second Step]\n\nDescription...\n\n## Conclusion\n\nSummary of what was accomplished.', category: 'tutorial' },
      { name: 'FAQ Entry', description: 'Question and answer format', content: '## Question\n\n[The question goes here]\n\n## Answer\n\n[Detailed answer here]\n\n## Related Questions\n\n- [Related question 1]\n- [Related question 2]', category: 'faq' },
      { name: 'API Endpoint', description: 'REST API documentation template', content: '# [Endpoint Name]\n\n## Endpoint\n\n`[METHOD] /api/[path]`\n\n## Description\n\nWhat this endpoint does.\n\n## Parameters\n\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n| param1 | string | Yes | Description |\n\n## Response\n\n```json\n{\n  "key": "value"\n}\n```\n\n## Example\n\n```bash\ncurl -X GET "https://api.example.com/endpoint"\n```', category: 'api' },
      { name: 'Troubleshooting Guide', description: 'Problem-solution format', content: '# [Problem Title]\n\n## Symptoms\n\nDescribe what the user is experiencing.\n\n## Cause\n\nExplain why this happens.\n\n## Solution\n\n1. First step\n2. Second step\n3. Third step\n\n## Prevention\n\nHow to avoid this in the future.', category: 'support' },
      { name: 'Release Notes', description: 'Version release documentation', content: '# Release Notes - v[X.Y.Z]\n\n## Release Date\n\n[Date]\n\n## New Features\n\n- Feature 1\n- Feature 2\n\n## Improvements\n\n- Improvement 1\n- Improvement 2\n\n## Bug Fixes\n\n- Fix 1\n- Fix 2\n\n## Breaking Changes\n\n- Change 1', category: 'release' },
      { name: 'Meeting Notes', description: 'Team meeting documentation', content: '# Meeting Notes - [Date]\n\n## Attendees\n\n- Person 1\n- Person 2\n\n## Agenda\n\n1. Topic 1\n2. Topic 2\n\n## Discussion\n\n### Topic 1\n\nNotes...\n\n## Action Items\n\n- [ ] Task 1 - Owner\n- [ ] Task 2 - Owner\n\n## Next Meeting\n\n[Date and Time]', category: 'internal' },
      { name: 'Product Feature', description: 'Feature documentation template', content: '# [Feature Name]\n\n## Overview\n\nBrief description of the feature.\n\n## Benefits\n\n- Benefit 1\n- Benefit 2\n\n## How It Works\n\nExplanation...\n\n## Getting Started\n\nSteps to start using the feature.\n\n## Best Practices\n\n- Practice 1\n- Practice 2', category: 'product' },
      { name: 'Security Advisory', description: 'Security announcement template', content: '# Security Advisory - [ID]\n\n## Severity\n\n[Critical/High/Medium/Low]\n\n## Affected Versions\n\n- Version range\n\n## Description\n\nDetailed description of the vulnerability.\n\n## Impact\n\nWhat could happen if exploited.\n\n## Remediation\n\nSteps to fix or mitigate.\n\n## Timeline\n\n- Discovery: [Date]\n- Fix: [Date]\n- Disclosure: [Date]', category: 'security' },
      { name: 'Onboarding Guide', description: 'New user/employee guide', content: '# Welcome to [Company/Product]\n\n## Getting Started\n\nWelcome message...\n\n## First Steps\n\n1. Complete profile\n2. Explore features\n3. Join team\n\n## Resources\n\n- Documentation\n- Training videos\n- Support contacts\n\n## FAQ\n\nCommon questions for new users.', category: 'onboarding' },
      { name: 'Integration Guide', description: 'Third-party integration docs', content: '# [Integration Name] Integration\n\n## Overview\n\nWhat this integration does.\n\n## Requirements\n\n- Requirement 1\n- Requirement 2\n\n## Setup\n\n1. Step 1\n2. Step 2\n\n## Configuration\n\nSettings and options.\n\n## Troubleshooting\n\nCommon issues and solutions.', category: 'integration' },
      { name: 'Policy Document', description: 'Company policy template', content: '# [Policy Name]\n\n## Purpose\n\nWhy this policy exists.\n\n## Scope\n\nWho this applies to.\n\n## Policy Statement\n\nThe actual policy...\n\n## Procedures\n\n1. Procedure 1\n2. Procedure 2\n\n## Enforcement\n\nConsequences of violations.\n\n## Revision History\n\n| Date | Version | Changes |\n|------|---------|---------|', category: 'policy' },
      { name: 'Architecture Document', description: 'System design documentation', content: '# [System Name] Architecture\n\n## Overview\n\nHigh-level description.\n\n## Components\n\n### Component 1\n\nDescription...\n\n### Component 2\n\nDescription...\n\n## Data Flow\n\nHow data moves through the system.\n\n## Technologies\n\n- Technology 1\n- Technology 2\n\n## Diagrams\n\n[Insert diagrams]', category: 'architecture' },
      { name: 'Runbook', description: 'Operational procedure template', content: '# [Operation Name] Runbook\n\n## Purpose\n\nWhen to use this runbook.\n\n## Prerequisites\n\n- Access requirements\n- Tools needed\n\n## Procedure\n\n1. Step 1\n2. Step 2\n\n## Rollback\n\nHow to undo if something goes wrong.\n\n## Contacts\n\n- Primary: [Name]\n- Escalation: [Name]', category: 'operations' },
      { name: 'Code Review Checklist', description: 'Review process template', content: '# Code Review Checklist\n\n## General\n\n- [ ] Code follows style guide\n- [ ] No commented out code\n- [ ] Clear variable names\n\n## Security\n\n- [ ] No hardcoded secrets\n- [ ] Input validation\n- [ ] SQL injection prevention\n\n## Testing\n\n- [ ] Unit tests added\n- [ ] Tests pass\n\n## Documentation\n\n- [ ] Comments where needed\n- [ ] README updated', category: 'development' },
      { name: 'Postmortem Template', description: 'Incident analysis document', content: '# Incident Postmortem - [Date]\n\n## Summary\n\nBrief description of what happened.\n\n## Impact\n\n- Duration: [Time]\n- Users affected: [Number]\n\n## Timeline\n\n| Time | Event |\n|------|-------|\n\n## Root Cause\n\nWhat caused the incident.\n\n## Resolution\n\nHow it was fixed.\n\n## Action Items\n\n- [ ] Prevention measure 1\n- [ ] Prevention measure 2\n\n## Lessons Learned\n\nWhat we learned from this.', category: 'operations' }
    ];

    for (let i = 0; i < templateData.length; i++) {
      const template = templateData[i];
      await pool.query(
        'INSERT INTO templates (name, description, content, category, created_by) VALUES ($1, $2, $3, $4, $5)',
        [template.name, template.description, template.content, template.category, users[i % users.length]]
      );
    }
    console.log('Created 15 templates');

    // Seed Teams (15+)
    const teams = [];
    const teamData = [
      { name: 'Engineering', description: 'Software development team' },
      { name: 'Product', description: 'Product management team' },
      { name: 'Design', description: 'UX/UI design team' },
      { name: 'Marketing', description: 'Marketing and communications' },
      { name: 'Sales', description: 'Sales and business development' },
      { name: 'Support', description: 'Customer support team' },
      { name: 'DevOps', description: 'Infrastructure and operations' },
      { name: 'QA', description: 'Quality assurance team' },
      { name: 'Security', description: 'Information security team' },
      { name: 'Data Science', description: 'Analytics and ML team' },
      { name: 'HR', description: 'Human resources' },
      { name: 'Finance', description: 'Financial operations' },
      { name: 'Legal', description: 'Legal and compliance' },
      { name: 'Documentation', description: 'Technical writing team' },
      { name: 'Leadership', description: 'Executive team' }
    ];

    for (let i = 0; i < teamData.length; i++) {
      const team = teamData[i];
      const result = await pool.query(
        'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
        [team.name, team.description, users[0]]
      );
      teams.push(result.rows[0].id);

      // Add random members to team
      const numMembers = Math.floor(Math.random() * 5) + 2;
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, numMembers);
      for (const userId of shuffledUsers) {
        await pool.query(
          'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [result.rows[0].id, userId, Math.random() > 0.8 ? 'admin' : 'member']
        );
      }
    }
    console.log('Created 15 teams with members');

    // Seed Comments (20+)
    const commentData = [
      'Great article! Very helpful.',
      'Thanks for this detailed explanation.',
      'Could you add more examples?',
      'This solved my problem!',
      'Excellent documentation.',
      'I found this very useful.',
      'Clear and concise, thank you.',
      'Please update the screenshots.',
      'This is exactly what I needed.',
      'Very well written guide.',
      'Can you elaborate on step 3?',
      'Perfect explanation!',
      'This helped me understand the concept.',
      'Great work on this article.',
      'Could use some code examples.',
      'Thanks for the quick tips!',
      'Very informative content.',
      'I appreciate the detailed steps.',
      'This should be pinned!',
      'Excellent resource for beginners.'
    ];

    for (let i = 0; i < commentData.length; i++) {
      await pool.query(
        'INSERT INTO comments (content, article_id, user_id) VALUES ($1, $2, $3)',
        [commentData[i], articles[i % articles.length], users[(i + 3) % users.length]]
      );
    }
    console.log('Created 20 comments');

    // Seed Bookmarks (15+)
    for (let i = 0; i < 15; i++) {
      await pool.query(
        'INSERT INTO bookmarks (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [users[i % users.length], articles[(i + 2) % articles.length]]
      );
    }
    console.log('Created 15 bookmarks');

    // Seed Search History (15+)
    const searches = [
      'getting started', 'api authentication', 'database', 'security', 'troubleshooting',
      'webhooks', 'themes', 'export', 'collaboration', 'search', 'mobile', 'shortcuts',
      'analytics', 'organization', 'documentation'
    ];

    for (let i = 0; i < searches.length; i++) {
      await pool.query(
        'INSERT INTO search_history (query, user_id, results_count) VALUES ($1, $2, $3)',
        [searches[i], users[i % users.length], Math.floor(Math.random() * 20) + 1]
      );
    }
    console.log('Created 15 search history entries');

    // Seed Notifications (15+)
    const notificationTypes = ['comment', 'mention', 'update', 'team_invite', 'system'];
    for (let i = 0; i < 15; i++) {
      const type = notificationTypes[i % notificationTypes.length];
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, read) VALUES ($1, $2, $3, $4, $5)',
        [users[i % users.length], type, `Notification ${i + 1}`, `This is notification message ${i + 1}`, Math.random() > 0.5]
      );
    }
    console.log('Created 15 notifications');

    // Seed Version History (15+)
    for (let i = 0; i < 15; i++) {
      await pool.query(
        'INSERT INTO version_history (article_id, title, content, changed_by, version_number, change_summary) VALUES ($1, $2, $3, $4, $5, $6)',
        [articles[i % articles.length], `Old title ${i + 1}`, `Old content version ${i + 1}...`, users[i % users.length], i + 1, `Updated content in version ${i + 1}`]
      );
    }
    console.log('Created 15 version history entries');

    // Seed Translations (15+)
    const languages = ['es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru', 'ar', 'hi', 'nl', 'sv', 'pl', 'tr'];
    for (let i = 0; i < languages.length; i++) {
      await pool.query(
        'INSERT INTO translations (article_id, language, title, content, translated_by) VALUES ($1, $2, $3, $4, $5)',
        [articles[i % articles.length], languages[i], `Translated Title (${languages[i]})`, `Translated content in ${languages[i]}...`, 'ai']
      );
    }
    console.log('Created 15 translations');

    // Seed Smart Suggestions (15+)
    const suggestionTypes = ['clarity', 'completeness', 'seo', 'readability', 'structure'];
    for (let i = 0; i < 15; i++) {
      await pool.query(
        'INSERT INTO smart_suggestions (article_id, suggestion_type, suggestion, applied) VALUES ($1, $2, $3, $4)',
        [articles[i % articles.length], suggestionTypes[i % suggestionTypes.length], `Suggestion ${i + 1}: Consider improving this aspect...`, Math.random() > 0.7]
      );
    }
    console.log('Created 15 smart suggestions');

    // Seed Analytics Events (20+)
    const actions = ['view', 'edit', 'share', 'bookmark', 'search'];
    for (let i = 0; i < 20; i++) {
      await pool.query(
        'INSERT INTO analytics (article_id, user_id, action, metadata) VALUES ($1, $2, $3, $4)',
        [articles[i % articles.length], users[i % users.length], actions[i % actions.length], JSON.stringify({ source: 'web' })]
      );
    }
    console.log('Created 20 analytics events');

    // Seed AI Generations (15+)
    const aiTypes = ['content_generation', 'summarization', 'qa', 'translation', 'writing_improvement'];
    for (let i = 0; i < 15; i++) {
      await pool.query(
        'INSERT INTO ai_generations (type, prompt, result, model, user_id, article_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [aiTypes[i % aiTypes.length], `Sample prompt ${i + 1}`, `AI generated result ${i + 1}...`, 'anthropic/claude-haiku-4.5', users[i % users.length], articles[i % articles.length]]
      );
    }
    console.log('Created 15 AI generation records');

    // ==================== AI FEATURES SEED DATA ====================

    // Seed Article Suggestions (15+)
    const articleSuggestionData = [
      { topic: 'Getting Started with Docker', targetAudience: 'Beginner developers', difficulty: 'Beginner', title: 'Docker for Beginners: A Complete Guide', summary: 'Learn the fundamentals of containerization with Docker', outline: ['Introduction to Containers', 'Installing Docker', 'Your First Container', 'Docker Commands', 'Best Practices'] },
      { topic: 'Kubernetes Deployment Strategies', targetAudience: 'DevOps engineers', difficulty: 'Advanced', title: 'Advanced Kubernetes Deployment Patterns', summary: 'Master rolling updates, blue-green, and canary deployments', outline: ['Deployment Overview', 'Rolling Updates', 'Blue-Green Deployments', 'Canary Releases', 'Rollback Strategies'] },
      { topic: 'REST API Design Best Practices', targetAudience: 'Backend developers', difficulty: 'Intermediate', title: 'Building RESTful APIs: Design Principles', summary: 'Learn how to design scalable and maintainable REST APIs', outline: ['REST Principles', 'Resource Naming', 'HTTP Methods', 'Error Handling', 'Versioning'] },
      { topic: 'React Performance Optimization', targetAudience: 'Frontend developers', difficulty: 'Intermediate', title: 'Optimizing React Applications for Speed', summary: 'Techniques to improve React app performance', outline: ['Profiling Tools', 'Memo and useMemo', 'Code Splitting', 'Virtual Lists', 'Bundle Analysis'] },
      { topic: 'Database Indexing Strategies', targetAudience: 'Database administrators', difficulty: 'Advanced', title: 'Mastering Database Indexes for Performance', summary: 'Comprehensive guide to database indexing', outline: ['Index Types', 'Query Analysis', 'Index Design', 'Maintenance', 'Monitoring'] },
      { topic: 'GraphQL vs REST', targetAudience: 'API developers', difficulty: 'Intermediate', title: 'Choosing Between GraphQL and REST', summary: 'Compare and contrast API paradigms', outline: ['Overview', 'Pros and Cons', 'Use Cases', 'Migration Strategies', 'Hybrid Approaches'] },
      { topic: 'CI/CD Pipeline Setup', targetAudience: 'DevOps teams', difficulty: 'Intermediate', title: 'Building Robust CI/CD Pipelines', summary: 'Automate your software delivery process', outline: ['Pipeline Concepts', 'Tool Selection', 'Build Stages', 'Testing Integration', 'Deployment Automation'] },
      { topic: 'Microservices Communication', targetAudience: 'Software architects', difficulty: 'Advanced', title: 'Inter-Service Communication Patterns', summary: 'Design effective microservices communication', outline: ['Sync vs Async', 'Message Queues', 'API Gateways', 'Service Mesh', 'Event Sourcing'] },
      { topic: 'OAuth 2.0 Implementation', targetAudience: 'Security engineers', difficulty: 'Intermediate', title: 'Implementing OAuth 2.0 Authentication', summary: 'Secure your applications with OAuth', outline: ['OAuth Flows', 'Token Types', 'Implementation', 'Security Considerations', 'Best Practices'] },
      { topic: 'Serverless Architecture', targetAudience: 'Cloud developers', difficulty: 'Intermediate', title: 'Going Serverless: Complete Guide', summary: 'Build applications without managing servers', outline: ['Serverless Concepts', 'AWS Lambda', 'Azure Functions', 'Use Cases', 'Cost Optimization'] },
      { topic: 'Test-Driven Development', targetAudience: 'Software developers', difficulty: 'Intermediate', title: 'TDD: Writing Tests First', summary: 'Learn the TDD methodology and its benefits', outline: ['TDD Principles', 'Red-Green-Refactor', 'Unit Testing', 'Integration Tests', 'TDD Tools'] },
      { topic: 'Git Workflow Strategies', targetAudience: 'Development teams', difficulty: 'Beginner', title: 'Git Branching Strategies for Teams', summary: 'Collaborate effectively with Git', outline: ['Gitflow', 'GitHub Flow', 'Trunk-Based', 'Release Management', 'Code Reviews'] },
      { topic: 'API Rate Limiting', targetAudience: 'Backend developers', difficulty: 'Intermediate', title: 'Implementing API Rate Limiting', summary: 'Protect your APIs from abuse', outline: ['Rate Limiting Algorithms', 'Implementation', 'Redis Integration', 'Response Headers', 'Client Guidelines'] },
      { topic: 'Logging and Monitoring', targetAudience: 'SRE teams', difficulty: 'Intermediate', title: 'Observability: Logging and Monitoring Guide', summary: 'Build observable systems', outline: ['Logging Best Practices', 'Metrics Collection', 'Distributed Tracing', 'Alerting', 'Dashboards'] },
      { topic: 'API Documentation', targetAudience: 'Technical writers', difficulty: 'Beginner', title: 'Writing Great API Documentation', summary: 'Create documentation developers love', outline: ['Documentation Structure', 'Code Examples', 'Interactive Docs', 'Versioning', 'Maintenance'] }
    ];

    for (let i = 0; i < articleSuggestionData.length; i++) {
      const suggestion = articleSuggestionData[i];
      const aiResponse = JSON.stringify({
        title: suggestion.title,
        summary: suggestion.summary,
        outline: suggestion.outline,
        keywords: ['technology', 'development', 'guide', 'tutorial'],
        targetAudience: suggestion.targetAudience,
        difficulty: suggestion.difficulty,
        estimatedLength: '1500-2000 words',
        relatedTopics: ['Software Development', 'Best Practices', 'Technology']
      });

      await pool.query(
        `INSERT INTO article_suggestions (topic, title, summary, outline, keywords, target_audience, difficulty, estimated_length, ai_response, user_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [suggestion.topic, suggestion.title, suggestion.summary, JSON.stringify(suggestion.outline), 'technology, development, guide', suggestion.targetAudience, suggestion.difficulty, '1500-2000 words', aiResponse, users[i % users.length], 'generated']
      );
    }
    console.log('Created 15 article suggestions');

    // Seed API Documentations (15+)
    const apiDocData = [
      { name: 'User Authentication', endpoint: '/api/auth/login', method: 'POST', description: 'Authenticate user and receive JWT token', category: 'Authentication' },
      { name: 'User Registration', endpoint: '/api/auth/register', method: 'POST', description: 'Create a new user account', category: 'Authentication' },
      { name: 'Get User Profile', endpoint: '/api/users/:id', method: 'GET', description: 'Retrieve user profile information', category: 'Users' },
      { name: 'Update User Profile', endpoint: '/api/users/:id', method: 'PUT', description: 'Update user profile data', category: 'Users' },
      { name: 'List Articles', endpoint: '/api/articles', method: 'GET', description: 'Get paginated list of articles', category: 'Content' },
      { name: 'Create Article', endpoint: '/api/articles', method: 'POST', description: 'Create a new article', category: 'Content' },
      { name: 'Update Article', endpoint: '/api/articles/:id', method: 'PUT', description: 'Update an existing article', category: 'Content' },
      { name: 'Delete Article', endpoint: '/api/articles/:id', method: 'DELETE', description: 'Delete an article', category: 'Content' },
      { name: 'Search Content', endpoint: '/api/search', method: 'GET', description: 'Full-text search across articles', category: 'Search' },
      { name: 'Get Categories', endpoint: '/api/categories', method: 'GET', description: 'List all categories', category: 'Content' },
      { name: 'Upload File', endpoint: '/api/files/upload', method: 'POST', description: 'Upload a file attachment', category: 'Files' },
      { name: 'Get Analytics', endpoint: '/api/analytics', method: 'GET', description: 'Retrieve usage analytics', category: 'Analytics' },
      { name: 'Create Team', endpoint: '/api/teams', method: 'POST', description: 'Create a new team', category: 'Teams' },
      { name: 'Add Team Member', endpoint: '/api/teams/:id/members', method: 'POST', description: 'Add a user to a team', category: 'Teams' },
      { name: 'Generate AI Content', endpoint: '/api/ai/generate', method: 'POST', description: 'Generate content using AI', category: 'AI' }
    ];

    for (let i = 0; i < apiDocData.length; i++) {
      const doc = apiDocData[i];
      const aiResponse = JSON.stringify({
        parameters: [{ name: 'id', type: 'string', required: true, description: 'Resource identifier' }],
        headers: [{ name: 'Authorization', required: true, description: 'Bearer token' }],
        requestBody: { example: 'value' },
        responseBody: { success: true, data: {} },
        examples: [{ language: 'curl', code: `curl -X ${doc.method} "${doc.endpoint}"` }],
        authentication: 'Bearer token required'
      });

      await pool.query(
        `INSERT INTO api_documentations (name, endpoint, method, description, parameters, headers, request_body, response_body, examples, authentication, category, version, ai_response, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [doc.name, doc.endpoint, doc.method, doc.description, JSON.stringify([{ name: 'id', type: 'string', required: true, description: 'Resource ID' }]), JSON.stringify([{ name: 'Authorization', required: true, description: 'Bearer token' }]), JSON.stringify({ data: 'example' }), JSON.stringify({ success: true }), JSON.stringify([{ language: 'JavaScript', code: 'fetch(url)' }]), 'Bearer token', doc.category, 'v1', aiResponse, users[i % users.length]]
      );
    }
    console.log('Created 15 API documentations');

    // Seed Search Optimizations (15+)
    const searchOptData = [
      { original: 'how to login', optimized: '"user authentication" OR "login process" OR "sign in guide"' },
      { original: 'api error', optimized: '"API error handling" OR "error responses" OR "troubleshooting API"' },
      { original: 'database connection', optimized: '"database connection" AND (setup OR configuration OR troubleshooting)' },
      { original: 'deploy app', optimized: '"deployment guide" OR "application deployment" OR "deploy to production"' },
      { original: 'security best practices', optimized: '"security best practices" AND (authentication OR authorization OR encryption)' },
      { original: 'performance issues', optimized: '"performance optimization" OR "slow queries" OR "performance troubleshooting"' },
      { original: 'webhook setup', optimized: '"webhook configuration" OR "webhook integration" OR "event notifications"' },
      { original: 'user permissions', optimized: '"user permissions" OR "role-based access" OR "authorization rules"' },
      { original: 'file upload', optimized: '"file upload" AND (API OR frontend OR configuration)' },
      { original: 'search not working', optimized: '"search troubleshooting" OR "search configuration" OR "search index"' },
      { original: 'mobile app', optimized: '"mobile application" OR "mobile app guide" OR "mobile development"' },
      { original: 'email notifications', optimized: '"email notifications" OR "notification settings" OR "email configuration"' },
      { original: 'backup data', optimized: '"data backup" OR "backup configuration" OR "restore data"' },
      { original: 'team management', optimized: '"team management" OR "user groups" OR "team permissions"' },
      { original: 'analytics dashboard', optimized: '"analytics dashboard" OR "usage metrics" OR "reporting features"' }
    ];

    for (let i = 0; i < searchOptData.length; i++) {
      const opt = searchOptData[i];
      const aiResponse = JSON.stringify({
        optimizedQuery: opt.optimized,
        suggestions: ['Try adding specific keywords', 'Use quotes for exact phrases', 'Filter by category'],
        synonyms: { search: ['find', 'lookup', 'query'], error: ['issue', 'problem', 'bug'] },
        relatedTerms: ['documentation', 'guide', 'tutorial'],
        searchTips: ['Use specific keywords', 'Check spelling', 'Try different phrasings']
      });

      await pool.query(
        `INSERT INTO search_optimizations (original_query, optimized_query, suggestions, synonyms, related_terms, search_tips, ai_response, effectiveness_score, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [opt.original, opt.optimized, JSON.stringify(['Alternative 1', 'Alternative 2']), JSON.stringify({ term: ['synonym1', 'synonym2'] }), JSON.stringify(['related1', 'related2']), JSON.stringify(['Tip 1', 'Tip 2']), aiResponse, (0.75 + Math.random() * 0.2).toFixed(2), users[i % users.length]]
      );
    }
    console.log('Created 15 search optimizations');

    // Seed Outdated Content (15+)
    const outdatedContentData = [
      { title: 'Legacy API v1 Documentation', severity: 'high', reason: 'API version has been deprecated' },
      { title: 'Old Installation Guide', severity: 'medium', reason: 'Installation process has changed significantly' },
      { title: 'Previous Release Notes', severity: 'low', reason: 'Contains references to old version numbers' },
      { title: 'Outdated Security Practices', severity: 'critical', reason: 'Security recommendations are no longer valid' },
      { title: 'Old Configuration Options', severity: 'high', reason: 'Configuration format has been updated' },
      { title: 'Deprecated Feature Guide', severity: 'medium', reason: 'Feature has been replaced with new functionality' },
      { title: 'Legacy Integration Setup', severity: 'high', reason: 'Integration method is no longer supported' },
      { title: 'Old Troubleshooting Steps', severity: 'medium', reason: 'Some solutions are no longer applicable' },
      { title: 'Previous Pricing Information', severity: 'high', reason: 'Pricing structure has changed' },
      { title: 'Outdated Screenshots', severity: 'low', reason: 'UI has been redesigned' },
      { title: 'Old API Endpoints', severity: 'critical', reason: 'Endpoints have been moved or removed' },
      { title: 'Legacy Authentication Flow', severity: 'high', reason: 'Auth process has been updated for security' },
      { title: 'Outdated Best Practices', severity: 'medium', reason: 'Industry standards have evolved' },
      { title: 'Old Mobile App Guide', severity: 'medium', reason: 'App has been significantly updated' },
      { title: 'Previous Terms of Service', severity: 'low', reason: 'Legal terms have been updated' }
    ];

    for (let i = 0; i < outdatedContentData.length; i++) {
      const content = outdatedContentData[i];
      const aiResponse = JSON.stringify({
        severity: content.severity,
        suggestedUpdates: content.reason,
        recommendations: ['Update content immediately', 'Review with stakeholders', 'Add deprecation notice'],
        detectedIssues: [{ issue: 'Outdated information', location: 'Section 2', reason: content.reason }]
      });

      await pool.query(
        `INSERT INTO outdated_content (article_id, article_title, content_snippet, reason, severity, recommendations, detected_issues, ai_response, user_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [articles[i % articles.length], content.title, 'This content contains outdated information...', content.reason, content.severity, JSON.stringify(['Update immediately', 'Review changes', 'Notify users']), JSON.stringify([{ issue: content.reason, location: 'Multiple sections' }]), aiResponse, users[i % users.length], i % 3 === 0 ? 'resolved' : i % 3 === 1 ? 'in_progress' : 'detected']
      );
    }
    console.log('Created 15 outdated content records');

    // Seed FAQ Entries (15+)
    const faqData = [
      { question: 'How do I reset my password?', answer: 'Click on "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email.', category: 'Account', topic: 'Password Management' },
      { question: 'What browsers are supported?', answer: 'We support the latest versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.', category: 'Technical', topic: 'Browser Support' },
      { question: 'How do I upgrade my subscription?', answer: 'Go to Settings > Billing > Upgrade Plan. Select your desired plan and complete the payment process.', category: 'Billing', topic: 'Subscription' },
      { question: 'Can I export my data?', answer: 'Yes, you can export all your data in JSON, CSV, or PDF format from Settings > Data > Export.', category: 'Features', topic: 'Data Management' },
      { question: 'How do I invite team members?', answer: 'Navigate to Teams, click "Invite Members", enter their email addresses, and select their role.', category: 'Features', topic: 'Team Management' },
      { question: 'Is my data encrypted?', answer: 'Yes, all data is encrypted at rest and in transit using industry-standard AES-256 encryption.', category: 'Security', topic: 'Data Security' },
      { question: 'How do I enable two-factor authentication?', answer: 'Go to Settings > Security > Two-Factor Authentication and follow the setup wizard.', category: 'Security', topic: 'Authentication' },
      { question: 'What is the API rate limit?', answer: 'The default rate limit is 100 requests per minute. Enterprise plans have higher limits.', category: 'API', topic: 'Rate Limiting' },
      { question: 'How do I cancel my subscription?', answer: 'You can cancel anytime from Settings > Billing > Cancel Subscription. Your access continues until the billing period ends.', category: 'Billing', topic: 'Subscription' },
      { question: 'Is there a mobile app?', answer: 'Yes, we have iOS and Android apps available on the App Store and Google Play Store.', category: 'Features', topic: 'Mobile Access' },
      { question: 'How do I integrate with Slack?', answer: 'Go to Settings > Integrations > Slack and click "Connect". Follow the OAuth authorization process.', category: 'Integration', topic: 'Slack Integration' },
      { question: 'What is the maximum file upload size?', answer: 'The maximum file size is 50MB for standard accounts and 200MB for enterprise accounts.', category: 'Technical', topic: 'File Uploads' },
      { question: 'How do I delete my account?', answer: 'Contact support to request account deletion. We will process your request within 30 days.', category: 'Account', topic: 'Account Deletion' },
      { question: 'Can I use custom domains?', answer: 'Custom domains are available on Business and Enterprise plans. Configure them in Settings > Domains.', category: 'Features', topic: 'Custom Domains' },
      { question: 'How do I report a bug?', answer: 'Use the "Report Bug" button in the Help menu or email support@example.com with details and screenshots.', category: 'Troubleshooting', topic: 'Bug Reporting' }
    ];

    for (let i = 0; i < faqData.length; i++) {
      const faq = faqData[i];
      const aiResponse = JSON.stringify({
        faqs: [{ question: faq.question, answer: faq.answer, relatedQuestions: ['Related Q1', 'Related Q2'], category: faq.category }]
      });

      await pool.query(
        `INSERT INTO faq_entries (question, answer, category, topic, related_questions, helpful_count, not_helpful_count, ai_response, user_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [faq.question, faq.answer, faq.category, faq.topic, JSON.stringify(['How do I get started?', 'Where can I find help?']), Math.floor(Math.random() * 50), Math.floor(Math.random() * 5), aiResponse, users[i % users.length], 'active']
      );
    }
    console.log('Created 15 FAQ entries');

    // Seed AI Translations (15+)
    const translationData = [
      { source: 'Welcome to our platform! We are excited to have you here.', target: 'Spanish', translated: 'Bienvenido a nuestra plataforma! Estamos emocionados de tenerte aqui.', tone: 'Professional' },
      { source: 'This guide will help you get started quickly.', target: 'French', translated: 'Ce guide vous aidera a demarrer rapidement.', tone: 'Professional' },
      { source: 'Click the button to continue.', target: 'German', translated: 'Klicken Sie auf die Schaltflache, um fortzufahren.', tone: 'Formal' },
      { source: 'Your account has been created successfully.', target: 'Italian', translated: 'Il tuo account e stato creato con successo.', tone: 'Professional' },
      { source: 'Please contact support if you need help.', target: 'Portuguese', translated: 'Por favor, entre em contato com o suporte se precisar de ajuda.', tone: 'Friendly' },
      { source: 'Thank you for choosing our service.', target: 'Japanese', translated: 'サービスをご利用いただきありがとうございます。', tone: 'Formal' },
      { source: 'Your changes have been saved.', target: 'Korean', translated: '변경 사항이 저장되었습니다.', tone: 'Professional' },
      { source: 'Learn more about our features.', target: 'Chinese (Simplified)', translated: '了解更多关于我们的功能。', tone: 'Marketing' },
      { source: 'Error: Something went wrong.', target: 'Russian', translated: 'Ошибка: Что-то пошло не так.', tone: 'Technical' },
      { source: 'Your session has expired.', target: 'Arabic', translated: 'انتهت صلاحية جلستك.', tone: 'Professional' },
      { source: 'Enter your email address.', target: 'Hindi', translated: 'अपना ईमेल पता दर्ज करें।', tone: 'Casual' },
      { source: 'Privacy is our top priority.', target: 'Dutch', translated: 'Privacy is onze hoogste prioriteit.', tone: 'Professional' },
      { source: 'Get started in minutes.', target: 'Swedish', translated: 'Kom igang pa nagra minuter.', tone: 'Marketing' },
      { source: 'Download the latest version.', target: 'Polish', translated: 'Pobierz najnowsza wersje.', tone: 'Technical' },
      { source: 'Join thousands of happy customers.', target: 'Turkish', translated: 'Binlerce mutlu musteriye katilln.', tone: 'Marketing' }
    ];

    for (let i = 0; i < translationData.length; i++) {
      const trans = translationData[i];
      const aiResponse = JSON.stringify({
        translatedText: trans.translated,
        sourceLanguage: 'English',
        qualityScore: (0.85 + Math.random() * 0.14).toFixed(2)
      });

      await pool.query(
        `INSERT INTO ai_translations (source_text, source_language, target_language, translated_text, context, tone, quality_score, ai_response, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [trans.source, 'English', trans.target, trans.translated, 'Technical documentation', trans.tone, (0.85 + Math.random() * 0.14).toFixed(2), aiResponse, users[i % users.length]]
      );
    }
    console.log('Created 15 AI translations');

    // ==================== AUTH TABLES SEED DATA ====================

    // Update admin/demo users to email_verified = true
    await pool.query(
      `UPDATE users SET email_verified = true WHERE email IN ('admin@knowledgebase.com', 'demo@example.com', 'test@example.com', 'lisa@knowledgebase.com', 'sarah@knowledgebase.com')`
    );
    console.log('Updated admin/demo users email_verified');

    // Seed Password Reset Tokens (15 records)
    for (let i = 0; i < 15; i++) {
      const token = crypto.randomBytes(32).toString('hex');
      const used = i < 5;
      const expired = i >= 5 && i < 10;
      const expiresAt = expired
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES ($1, $2, $3, $4)',
        [users[i % users.length], token, expiresAt, used]
      );
    }
    console.log('Created 15 password reset tokens');

    // Seed Token Blacklist (15 records)
    for (let i = 0; i < 15; i++) {
      const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${crypto.randomBytes(30).toString('base64url')}.${crypto.randomBytes(20).toString('base64url')}`;
      await pool.query(
        'INSERT INTO token_blacklist (token, user_id, expires_at) VALUES ($1, $2, $3)',
        [fakeToken, users[i % users.length], new Date(Date.now() - 24 * 60 * 60 * 1000 * (i + 1))]
      );
    }
    console.log('Created 15 token blacklist entries');

    // Seed Email Verifications (15 records)
    for (let i = 0; i < 15; i++) {
      const token = crypto.randomBytes(32).toString('hex');
      const verified = i < 8;
      const expired = !verified && i < 12;
      const expiresAt = expired
        ? new Date(Date.now() - 48 * 60 * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO email_verifications (user_id, token, expires_at, verified_at) VALUES ($1, $2, $3, $4)',
        [users[i % users.length], token, expiresAt, verified ? new Date(Date.now() - i * 3600000) : null]
      );
    }
    console.log('Created 15 email verification records');

    console.log('\n========================================');
    console.log('Database seeding completed successfully!');
    console.log('========================================\n');
    console.log('Demo Credentials:');
    console.log('  Admin: admin@knowledgebase.com / password123');
    console.log('  Demo: demo@example.com / password123');
    console.log('\nAI Features Seeded:');
    console.log('  - 15 Article Suggestions');
    console.log('  - 15 API Documentations');
    console.log('  - 15 Search Optimizations');
    console.log('  - 15 Outdated Content Records');
    console.log('  - 15 FAQ Entries');
    console.log('  - 15 AI Translations');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
