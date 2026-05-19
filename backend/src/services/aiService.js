const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  }

  async makeRequest(messages, model = null) {
    const useModel = model || this.model;
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: useModel,
        messages: messages,
        max_tokens: 8000,
        temperature: 0.7
      });

      const options = {
        hostname: 'openrouter.ai',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Knowledge Base Wiki Generator'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (response.choices && response.choices[0]) {
              resolve(response.choices[0].message.content);
            } else if (response.error) {
              reject(new Error(response.error.message || 'AI request failed'));
            } else {
              resolve(body);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  // Stream SSE chunks to an Express response object.
  // The caller must set SSE headers before calling this method.
  // Resolves with the full accumulated content when the stream ends.
  makeStreamingRequest(messages, sseRes, model = null) {
    const useModel = model || this.model;
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: useModel,
        messages,
        max_tokens: 8000,
        temperature: 0.7,
        stream: true
      });

      const options = {
        hostname: 'openrouter.ai',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Knowledge Base Wiki Generator'
        }
      };

      let fullContent = '';

      const req = https.request(options, (res) => {
        let buffer = '';

        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          // Keep incomplete last line in buffer
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') {
              if (trimmed === 'data: [DONE]') {
                sseRes.write('data: [DONE]\n\n');
              }
              continue;
            }
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullContent += delta;
                  // Send SSE event with the token chunk
                  sseRes.write(`data: ${JSON.stringify({ delta })}\n\n`);
                }
              } catch {
                // Ignore malformed SSE lines
              }
            }
          }
        });

        res.on('end', () => {
          resolve(fullContent);
        });

        res.on('error', reject);
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async generateContent(topic, type = 'article') {
    const prompts = {
      article: `Write a comprehensive knowledge base article about "${topic}". Include:
        - Clear introduction
        - Main content with subheadings
        - Key points and best practices
        - Conclusion
        Format in markdown.`,
      tutorial: `Create a step-by-step tutorial about "${topic}". Include:
        - Prerequisites
        - Numbered steps with clear instructions
        - Code examples if applicable
        - Tips and troubleshooting
        Format in markdown.`,
      faq: `Generate a FAQ section about "${topic}". Include:
        - 5-10 common questions
        - Detailed answers for each
        - Related resources
        Format in markdown.`,
      documentation: `Write technical documentation about "${topic}". Include:
        - Overview
        - Features/Components
        - Usage examples
        - API reference if applicable
        Format in markdown.`
    };

    const messages = [
      { role: 'system', content: 'You are a professional technical writer creating knowledge base content.' },
      { role: 'user', content: prompts[type] || prompts.article }
    ];

    return this.makeRequest(messages);
  }

  async summarizeContent(content) {
    const messages = [
      { role: 'system', content: `You are an expert content analyst and summarization specialist. Create structured, insightful summaries that capture the essence of the content. Your summaries should be immediately useful to readers who need a quick understanding of the material.

Guidelines:
- Identify and highlight the most critical information first
- Preserve key technical details, numbers, and specific claims
- Maintain the original tone (technical, casual, formal) of the source material
- Use clear, accessible language even for complex topics` },
      { role: 'user', content: `Analyze and summarize the following content. Structure your summary as follows:

**Key Takeaways:** (3-5 bullet points of the most important findings/points)

**Summary:** (2-3 paragraphs covering the main content, arguments, and conclusions)

**Target Audience:** (Who would benefit most from reading the full content)

Content to summarize:
${content}` }
    ];

    return this.makeRequest(messages);
  }

  async answerQuestion(question, context) {
    const messages = [
      { role: 'system', content: `You are a knowledgeable assistant specializing in answering questions from knowledge base content. Your answers should be accurate, well-structured, and directly useful.

Guidelines:
- Always base your answer on the provided context; do not fabricate information
- If the context doesn't fully answer the question, clearly state what is and isn't covered
- Use formatting (bold, lists, code blocks) to improve readability
- Reference specific sections of the source material when relevant` },
      { role: 'user', content: `Context from knowledge base:
${context}

Question: ${question}

Provide a comprehensive answer with:
1. **Direct Answer:** A clear, concise response to the question
2. **Detailed Explanation:** Supporting details from the context
3. **Source References:** Indicate which parts of the context support your answer
4. **Confidence Level:** Rate your confidence (High/Medium/Low) based on how well the context covers this question
5. **Related Questions:** Suggest 2-3 follow-up questions the reader might have` }
    ];

    return this.makeRequest(messages);
  }

  async translateContent(content, targetLanguage) {
    const messages = [
      { role: 'system', content: `You are a professional translator with expertise in technical and knowledge base content. Translate to ${targetLanguage} with precision and cultural awareness.

Translation rules:
- Preserve all markdown formatting, code blocks, and HTML tags exactly as-is
- Keep technical terms, brand names, and acronyms in their original language unless they have a well-known translation in ${targetLanguage}
- Maintain the original tone and formality level
- Preserve numbered lists, bullet points, and heading structure
- Translate UI labels and user-facing text naturally for ${targetLanguage} speakers
- Do not translate code snippets, variable names, or file paths` },
      { role: 'user', content: `Translate the following content to ${targetLanguage}. Ensure the translation reads naturally to native speakers while preserving all technical accuracy and formatting:

${content}` }
    ];

    return this.makeRequest(messages);
  }

  async generateSuggestions(content) {
    const messages = [
      { role: 'system', content: `You are a senior content strategist and editorial expert. Analyze content holistically and provide actionable, prioritized improvement suggestions that will have the highest impact on quality and reader engagement.

Evaluation criteria:
- Clarity: Is the content easy to understand? Are complex concepts well-explained?
- Completeness: Are there gaps in coverage? Missing examples or edge cases?
- SEO: Are there opportunities for better keyword usage, meta descriptions, or headings?
- Readability: Is the content well-structured with appropriate formatting?
- Engagement: Does the content hold the reader's attention? Are there calls to action?` },
      { role: 'user', content: `Analyze the following content and provide 5-7 specific, actionable suggestions for improvement.

Content:
${content}

Format each suggestion as a JSON object with these fields:
- "type": one of "clarity", "completeness", "seo", "readability", "structure", "engagement"
- "suggestion": the specific improvement recommendation
- "priority": "high", "medium", or "low" based on potential impact
- "effort": "quick-fix", "moderate", or "significant" to indicate implementation effort

Return only a valid JSON array of suggestion objects.` }
    ];

    return this.makeRequest(messages);
  }

  async improveWriting(content) {
    const messages = [
      { role: 'system', content: `You are a professional editor and writing coach specializing in technical and knowledge base content. Improve writing quality while preserving the author's voice and original meaning.

Editing principles:
- Fix grammar, spelling, and punctuation errors
- Improve sentence structure for clarity and flow
- Replace jargon or overly complex language with simpler alternatives where possible
- Strengthen weak verbs and eliminate passive voice where active voice is more effective
- Ensure consistent tense, tone, and style throughout
- Improve transitions between paragraphs and sections
- Preserve all technical accuracy and domain-specific terminology` },
      { role: 'user', content: `Improve the following content. Provide the improved version followed by a brief summary of key changes made.

Original content:
${content}

Format your response as:

**Improved Version:**
(The improved content here)

**Changes Made:**
- (List the key improvements you made and why)` }
    ];

    return this.makeRequest(messages);
  }

  async generateTags(content) {
    const messages = [
      { role: 'system', content: `You are an expert content taxonomist and SEO specialist. Generate precise, relevant tags that improve content discoverability and categorization.

Tag generation guidelines:
- Include a mix of broad topic tags and specific detail tags
- Consider tags across categories: topic, technology, skill level, use case, and audience
- Prioritize tags by relevance (most relevant first)
- Use lowercase, commonly searched terms
- Include both singular and important variations where relevant
- Avoid overly generic tags like "information" or "guide" unless truly relevant` },
      { role: 'user', content: `Analyze the following content and generate 5-10 highly relevant tags/keywords. Order them by relevance (most relevant first). Return only the tags as a comma-separated list:

${content}` }
    ];

    return this.makeRequest(messages);
  }

  async generateTitle(content) {
    const messages = [
      { role: 'system', content: `You are an expert headline writer and content strategist. Craft compelling, accurate titles that drive clicks while accurately representing the content.

Title writing guidelines:
- Front-load important keywords for SEO and scanability
- Keep titles between 40-70 characters for optimal display
- Use power words that create urgency or curiosity without being clickbait
- Ensure the title accurately represents the content
- Consider the target audience's search intent` },
      { role: 'user', content: `Generate 3 compelling titles for the following content. Provide variety in style:
1. A clear, descriptive "How-to" or instructional title
2. A benefit-driven title highlighting what the reader will learn/gain
3. A concise, keyword-optimized title for search engines

Return only the three titles, one per line, without numbering or labels:

${content}` }
    ];

    return this.makeRequest(messages);
  }

  async chatWithKnowledgeBase(query, articles) {
    const context = articles.map(a => `Title: ${a.title}\nContent: ${a.content}`).join('\n\n---\n\n');

    const messages = [
      { role: 'system', content: `You are an intelligent knowledge base assistant. Your role is to provide accurate, helpful answers by synthesizing information from the available articles.

Response guidelines:
- Always cite which article(s) your answer is based on using [Article: "title"] format
- If multiple articles are relevant, synthesize information from all of them
- Clearly distinguish between information from the knowledge base and general knowledge
- If the knowledge base doesn't contain enough information, say so clearly and suggest what the user might search for instead
- Use formatting (bold, lists, code blocks) to make your answer easy to scan
- Keep answers focused and relevant to the specific question` },
      { role: 'user', content: `Available Knowledge Base Articles:

${context}

User Question: ${query}

Provide a helpful, well-structured answer. Include:
1. A direct answer to the question
2. Citations referencing specific articles using [Article: "title"] format
3. Confidence level (High/Medium/Low) based on the available information
4. 2-3 suggested follow-up questions the user might want to explore` }
    ];

    return this.makeRequest(messages);
  }

  // AI Article Suggester
  async suggestArticle(topic, context = {}) {
    const messages = [
      { role: 'system', content: `You are an expert content strategist and technical writer with deep expertise in creating knowledge base articles. You specialize in producing comprehensive, well-structured article plans that are immediately actionable.

Your article suggestions should:
- Include highly specific, descriptive section titles (not generic ones like "Introduction" or "Conclusion")
- Provide a detailed summary that clearly explains the value proposition and key takeaways
- Suggest 8-12 relevant keywords covering both broad topics and specific long-tail terms
- Recommend a realistic outline with 6-10 sections that progressively build understanding
- Consider the target audience's existing knowledge and learning goals
- Identify 4-6 related topics for cross-linking and further exploration` },
      { role: 'user', content: `Generate a comprehensive, detailed article suggestion for the topic: "${topic}"

${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}
${context.difficulty ? `Difficulty Level: ${context.difficulty}` : ''}

Return a JSON response with ALL of the following fields populated with rich, detailed content:
{
  "title": "A compelling, specific article title (not generic — include the key benefit or angle)",
  "summary": "A detailed 3-5 sentence summary explaining what the article covers, why it matters, what readers will learn, and what problems it solves",
  "outline": ["Section 1: Specific descriptive title", "Section 2: ...", ...at least 6-10 sections with descriptive titles that show the progression of the article],
  "keywords": ["keyword1", "keyword2", ...at least 8-12 relevant SEO keywords and phrases],
  "targetAudience": "Detailed description of ideal readers including their role, experience level, and what they're trying to accomplish",
  "difficulty": "Beginner/Intermediate/Advanced",
  "estimatedLength": "Short (500-800 words) / Medium (800-1500 words) / Long (1500+ words) — with justification",
  "relatedTopics": ["topic1", "topic2", ...at least 4-6 related topics for cross-linking]
}

IMPORTANT: Every field must be populated with substantial, useful content. Do not leave any field minimal or empty. The outline should have at least 6 detailed section titles. Keywords should have at least 8 entries. RelatedTopics should have at least 4 entries.` }
    ];

    return this.makeRequest(messages);
  }

  // AI API Documentation Generator
  async generateApiDocumentation(apiInfo) {
    const messages = [
      { role: 'system', content: `You are a senior API documentation engineer with extensive experience writing documentation for production REST APIs at companies like Stripe, Twilio, and GitHub. Your documentation is known for being thorough, developer-friendly, and immediately useful.

Documentation standards:
- Every parameter must have a clear type, description, constraints, and example value
- Request/response bodies must include realistic, complete examples with all fields
- Code examples must be copy-paste ready and work out of the box
- Error responses must cover all common failure scenarios with actionable error messages
- Authentication details must be specific and include example header values
- Always include rate limiting information and best practices` },
      { role: 'user', content: `Generate comprehensive, production-quality API documentation for:

Endpoint Name: ${apiInfo.name || 'API Endpoint'}
Method: ${apiInfo.method || 'GET'}
Path: ${apiInfo.endpoint || '/api/endpoint'}
Description: ${apiInfo.description || 'API endpoint description'}

Return a detailed JSON response with ALL fields populated with realistic, substantial content:
{
  "description": "A thorough 2-3 sentence description of what this endpoint does, when to use it, and what it returns",
  "parameters": [
    {"name": "param_name", "type": "string|number|boolean", "required": true/false, "description": "Clear description with constraints and example values", "example": "example_value"}
    ...include at least 3-5 relevant parameters (path params, query params, etc.)
  ],
  "headers": [
    {"name": "Authorization", "required": true, "description": "Bearer token for authentication. Example: Bearer eyJhbG..."}
    ...include at least 2-3 headers (Authorization, Content-Type, Accept, etc.)
  ],
  "requestBody": {
    "example": {realistic JSON body with all fields populated with example values},
    "schema": {field descriptions with types and constraints}
  },
  "responseBody": {
    "success": {complete realistic success response with all fields including metadata like timestamps, IDs, etc.},
    "error": {realistic error response with error code, message, and details}
  },
  "examples": [
    {"language": "curl", "code": "complete curl command that works out of the box"},
    {"language": "javascript", "code": "complete fetch/axios example with error handling"},
    {"language": "python", "code": "complete requests library example"}
  ],
  "authentication": "Detailed description of auth requirements including token type, where to obtain tokens, and expiration",
  "rateLimit": "Specific rate limit info (e.g., 100 requests/minute per API key, with retry-after header)",
  "errors": [
    {"code": 400, "message": "Bad Request", "description": "When and why this error occurs, and how to fix it"},
    {"code": 401, "message": "Unauthorized", "description": "..."},
    {"code": 403, "message": "Forbidden", "description": "..."},
    {"code": 404, "message": "Not Found", "description": "..."},
    {"code": 429, "message": "Rate Limited", "description": "..."}
  ]
}

IMPORTANT: Generate realistic, substantial content for EVERY field. Include at least 3 parameters, 2 headers, 3 code examples, and 4+ error codes. The request/response bodies should have multiple fields with realistic example values, not just placeholders.` }
    ];

    return this.makeRequest(messages);
  }

  // AI Search Optimizer
  async optimizeSearch(query) {
    const messages = [
      { role: 'system', content: `You are a senior search optimization and information retrieval expert with deep expertise in NLP, query understanding, and search engine behavior. You help users dramatically improve their search results through query reformulation, semantic expansion, and search strategy optimization.

Your optimization approach:
- Analyze user intent (informational, navigational, transactional, troubleshooting)
- Expand queries with semantically related terms and domain-specific vocabulary
- Suggest multiple query variations targeting different aspects of the topic
- Identify synonyms that capture alternative terminology used in documentation
- Provide actionable search tips specific to the query domain
- Consider Boolean operators, phrase matching, and filtering strategies` },
      { role: 'user', content: `Optimize the following search query for maximum relevance and recall: "${query}"

Return a JSON response with ALL fields populated with substantial, useful content:
{
  "optimizedQuery": "A significantly improved, more specific version of the query with better keywords and structure",
  "suggestions": [
    "Alternative query 1 — targeting a different angle of the topic",
    "Alternative query 2 — using different terminology",
    "Alternative query 3 — more specific/narrowed down",
    "Alternative query 4 — broader to capture more results",
    "Alternative query 5 — phrased as a question"
    ...provide at least 5 alternative queries
  ],
  "synonyms": {
    "term1": ["synonym1", "synonym2", "synonym3"],
    "term2": ["synonym1", "synonym2"]
    ...map at least 2-3 key terms from the query to their synonyms (3+ synonyms each)
  },
  "relatedTerms": ["related1", "related2", "related3", "related4", "related5", ...at least 6-8 related terms and concepts],
  "searchTips": [
    "Specific, actionable tip 1 for searching this topic more effectively",
    "Tip 2 about narrowing or broadening results",
    "Tip 3 about using filters or operators",
    "Tip 4 about related resources to check"
    ...provide at least 4 detailed, actionable tips
  ],
  "filters": {"category": ["relevant categories"], "date": "suggested date range if applicable", "type": ["document types to look for"]},
  "intent": "Detailed analysis of what the user is likely trying to find, their experience level, and the best approach to satisfy their information need"
}

IMPORTANT: Every array must have multiple entries. Suggestions need at least 5, synonyms should cover 2-3 key terms with 3+ alternatives each, relatedTerms needs 6+, and searchTips needs 4+. Make all content specific to the query topic, not generic.` }
    ];

    return this.makeRequest(messages);
  }

  // AI Outdated Content Detector
  async detectOutdatedContent(content, metadata = {}) {
    const messages = [
      { role: 'system', content: `You are a senior technical content auditor and technology trends expert. You have deep knowledge of software versioning, technology lifecycles, deprecated APIs, and industry best practices across the full technology stack.

Your analysis approach:
- Check for specific version numbers, library names, and tools that have newer versions
- Identify deprecated practices, APIs, patterns, and workflows
- Flag security-relevant outdated information (vulnerable versions, insecure practices)
- Detect references to discontinued services, tools, or platforms
- Evaluate whether code examples use current syntax and best practices
- Consider the technology lifecycle and how quickly each technology evolves
- Provide specific, actionable recommendations with current alternatives` },
      { role: 'user', content: `Perform a thorough analysis of the following content for outdated information:

Title: ${metadata.title || 'Unknown'}
Last Updated: ${metadata.lastUpdated || 'Unknown'}
Content:
${content}

Return a JSON response with ALL fields populated with detailed, specific findings:
{
  "isOutdated": true/false,
  "severity": "low/medium/high/critical",
  "detectedIssues": [
    {
      "issue": "Specific description of what is outdated",
      "location": "Quote or reference the exact part of the content",
      "reason": "Detailed explanation of why it's outdated and what changed (include version numbers, dates, and specifics)"
    }
    ...identify at least 3-5 specific issues if the content has any outdated elements
  ],
  "recommendations": [
    "Specific, actionable recommendation 1 — include what to change and what the current best practice is",
    "Recommendation 2 with specific version numbers or alternatives to use",
    "Recommendation 3 addressing security or compatibility concerns",
    "Recommendation 4 about structural or approach changes needed"
    ...provide at least 4-6 detailed recommendations
  ],
  "suggestedUpdates": "A comprehensive 3-5 sentence summary of the overall update strategy: what needs to change, the priority order, and the estimated effort involved",
  "confidenceScore": 0.0-1.0,
  "lastValidDate": "Estimated date when this content was still current (e.g., 'approximately Q2 2023')"
}

IMPORTANT: Be thorough and specific. Each detected issue must include the exact problematic text, why it's outdated, and what replaced it. Recommendations must be actionable with specific alternatives. Even if the content seems mostly current, identify at least 2-3 areas that could be improved or verified.` }
    ];

    return this.makeRequest(messages);
  }

  // AI FAQ Generator
  async generateFAQ(topic, context = '') {
    const messages = [
      { role: 'system', content: `You are a senior customer experience and technical documentation expert who specializes in creating comprehensive FAQ sections. Your FAQs are known for anticipating user questions, providing thorough yet accessible answers, and reducing support ticket volume.

FAQ writing standards:
- Questions should be phrased exactly as a real user would ask them (natural language, not technical jargon)
- Answers should be detailed (3-5 sentences minimum) with specific steps, examples, or explanations
- Cover the full spectrum: getting started, common issues, advanced usage, troubleshooting, and edge cases
- Each answer should be self-contained — a user shouldn't need to read other FAQs to understand it
- Include practical examples, specific steps, or links to related resources in answers
- Organize by logical categories that help users find what they need quickly` },
      { role: 'user', content: `Generate a comprehensive, production-quality FAQ for the topic: "${topic}"

${context ? `Additional Context: ${context}` : ''}

Return a JSON response with detailed content:
{
  "faqs": [
    {
      "question": "A natural, specific question that real users frequently ask",
      "answer": "A thorough, helpful answer of 3-5 sentences minimum. Include specific steps, examples, or practical guidance. The answer should fully resolve the user's question without needing to look elsewhere.",
      "category": "Logical category grouping",
      "relatedQuestions": ["Related follow-up question 1", "Related follow-up question 2", "Related follow-up question 3"]
    }
    ...generate at least 6-8 FAQs covering different aspects of the topic
  ],
  "categories": ["Category1", "Category2", "Category3", ...list all unique categories used],
  "summary": "A 2-3 sentence summary of what this FAQ covers and who it's designed to help"
}

IMPORTANT: Generate at least 6-8 high-quality FAQs. Each answer must be substantive (3-5 sentences minimum with real, actionable information). Each FAQ must have at least 2-3 related questions. Cover a range from beginner to advanced questions. Categories should be specific and meaningful (not just "General").` }
    ];

    return this.makeRequest(messages);
  }

  // AI Translation Engine (Enhanced)
  async translateAdvanced(text, targetLanguage, options = {}) {
    const messages = [
      { role: 'system', content: `You are a professional translator and localization expert with native-level fluency in ${targetLanguage} and extensive experience translating technical, marketing, and professional content. You produce translations that read as if originally written in the target language.

Translation principles:
- Prioritize natural, fluent expression in ${targetLanguage} over literal word-for-word translation
- Adapt idioms, metaphors, and cultural references appropriately for the target audience
- Maintain the original tone, formality level, and emotional impact
- Preserve all technical terms, brand names, code snippets, and formatting exactly as-is unless they have well-established translations
- Consider regional variations and use the most widely understood form of ${targetLanguage}
- Note any passages where meaning is ambiguous and provide alternative interpretations` },
      { role: 'user', content: `Translate the following text to ${targetLanguage} with professional quality:

Source Text:
${text}

${options.context ? `Context: ${options.context}` : ''}
${options.tone ? `Desired Tone: ${options.tone}` : ''}
${options.glossary ? `Glossary Terms to Preserve (do not translate these): ${options.glossary}` : ''}

Return a JSON response with ALL fields populated:
{
  "translatedText": "The complete, polished translation that reads naturally in ${targetLanguage}",
  "sourceLanguage": "The detected source language",
  "targetLanguage": "${targetLanguage}",
  "preservedTerms": ["term1", "term2", ...list all technical terms and proper nouns kept in original language],
  "notes": [
    "Translation note 1 — explain any significant adaptation choices made",
    "Note 2 — flag any ambiguous passages and how they were interpreted",
    "Note 3 — mention cultural adaptations or regional considerations"
    ...provide at least 2-3 translation notes
  ],
  "alternativeTranslations": [
    "Alternative rendering for a key phrase or sentence that could be translated differently",
    "Another alternative for a different important passage"
    ...provide at least 2 alternatives for key phrases
  ],
  "qualityScore": 0.0-1.0
}

IMPORTANT: The translation must be complete and polished. Notes should explain your translation choices. Include at least 2 alternative translations for key phrases. Preserve all formatting, paragraph breaks, and structure from the source text.` }
    ];

    return this.makeRequest(messages);
  }
}

module.exports = new AIService();
