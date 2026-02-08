# Plugin Selection Guide

**Quick reference for choosing the right Claude Code plugin/skill for your task**

---

## 🎯 How to Use This Guide

1. Find your task category below
2. Match your question to the examples
3. Use the recommended plugin

**Format:** `plugin-name:skill-name` → Use with `/skill-name` or mention it

---

## 📱 Frontend & Mobile Development

### Building React Native Components
**Use:** `frontend-mobile-development:react-native-architecture`
**Examples:**
- "Add navigation to the app"
- "Implement native modules"
- "Set up Expo configuration"
- "Add offline sync capabilities"

### React State Management
**Use:** `frontend-mobile-development:react-state-management`
**Examples:**
- "Should I use Redux or Zustand?"
- "Set up React Query for API calls"
- "Manage global app state"
- "Fix state synchronization issues"

### UI Design & Components
**Use:** `frontend-design:frontend-design`
**Examples:**
- "Create a beautiful login screen"
- "Design a card component"
- "Build a custom button with animations"
- "Improve this component's visual design"

### Tailwind/Design System
**Use:** `frontend-mobile-development:tailwind-design-system`
**Examples:**
- "Set up a design system"
- "Create reusable styled components"
- "Implement responsive breakpoints"
- "Build a component library"

---

## 🔐 Security & Authentication

### Security Code Review
**Use:** `security-scanning:security-sast`
**Examples:**
- "Check this code for vulnerabilities"
- "Find security issues in authentication"
- "Review for XSS/SQL injection risks"
- "Audit API endpoint security"

### Threat Modeling
**Use:** `security-scanning:stride-analysis-patterns`
**Examples:**
- "Analyze security threats for this feature"
- "Create a threat model for user data"
- "Identify attack vectors"
- "Document security concerns"

### Authentication Implementation
**Use:** `developer-essentials:auth-implementation-patterns`
**Examples:**
- "Implement JWT authentication"
- "Set up OAuth2 flow"
- "Add role-based access control"
- "Fix session management"

### GDPR Compliance
**Use:** `hr-legal-compliance:gdpr-data-handling`
**Examples:**
- "Make this feature GDPR compliant"
- "Implement consent management"
- "Add data deletion capabilities"
- "Review privacy practices"

---

## 🗄️ Database & Data

### Database Schema Design
**Use:** `database-design:postgresql`
**Examples:**
- "Design a schema for user sessions"
- "Optimize database structure"
- "Add proper indexes"
- "Set up foreign keys"

### Database Migrations
**Use:** `database-migrations:sql-migrations`
**Examples:**
- "Create a zero-downtime migration"
- "Migrate Supabase schema"
- "Add a column safely"
- "Rollback strategy for migrations"

### SQL Query Optimization
**Use:** `developer-essentials:sql-optimization-patterns`
**Examples:**
- "Why is this query slow?"
- "Optimize N+1 queries"
- "Add proper indexes"
- "Analyze EXPLAIN output"

---

## 🤖 AI & LLM Features

### Prompt Engineering
**Use:** `llm-application-dev:prompt-engineering-patterns`
**Examples:**
- "Improve this Claude API prompt"
- "Make prompts more reliable"
- "Add structured outputs"
- "Fix inconsistent AI responses"

### RAG Implementation
**Use:** `llm-application-dev:rag-implementation`
**Examples:**
- "Build a knowledge base search"
- "Implement document Q&A"
- "Set up vector search"
- "Add semantic search to journal entries"

### LLM Evaluation
**Use:** `llm-application-dev:llm-evaluation`
**Examples:**
- "Test AI response quality"
- "Benchmark prompt performance"
- "Measure AI accuracy"
- "Set up evaluation metrics"

### LangChain Architecture
**Use:** `llm-application-dev:langchain-architecture`
**Examples:**
- "Build an AI agent workflow"
- "Implement memory for conversations"
- "Chain multiple AI calls"
- "Add tool integration"

---

## 🏗️ Backend & APIs

### API Design
**Use:** `backend-development:api-design-principles`
**Examples:**
- "Design a REST API structure"
- "Review API naming conventions"
- "Plan API versioning"
- "Create consistent error responses"

### Microservices Architecture
**Use:** `backend-development:microservices-patterns`
**Examples:**
- "Break up this monolith"
- "Design service boundaries"
- "Implement inter-service communication"
- "Add resilience patterns"

### FastAPI Development
**Use:** `api-scaffolding:fastapi-templates`
**Examples:**
- "Create a FastAPI project"
- "Set up async endpoints"
- "Add dependency injection"
- "Implement error handling"

### Event Sourcing
**Use:** `backend-development:cqrs-implementation`
**Examples:**
- "Implement CQRS pattern"
- "Separate read/write models"
- "Design event store"
- "Build projections"

### Workflow Orchestration
**Use:** `backend-development:workflow-orchestration-patterns`
**Examples:**
- "Build a long-running workflow"
- "Implement saga pattern"
- "Handle distributed transactions"
- "Design durable workflows"

---

## 🧪 Testing & Quality

### JavaScript Testing
**Use:** `javascript-typescript:javascript-testing-patterns`
**Examples:**
- "Write tests for this component"
- "Set up Jest configuration"
- "Mock API calls in tests"
- "Implement TDD workflow"

### E2E Testing
**Use:** `developer-essentials:e2e-testing-patterns`
**Examples:**
- "Set up Playwright tests"
- "Fix flaky tests"
- "Test user workflows"
- "Add CI integration for tests"

---

## 📝 Documentation

### Architecture Decision Records
**Use:** `documentation-generation:architecture-decision-records`
**Examples:**
- "Document this technical decision"
- "Create an ADR"
- "Review past decisions"
- "Establish decision process"

### OpenAPI Specification
**Use:** `documentation-generation:openapi-spec-generation`
**Examples:**
- "Generate API docs"
- "Create OpenAPI spec"
- "Document API endpoints"
- "Set up API contract testing"

### Changelogs
**Use:** `documentation-generation:changelog-automation`
**Examples:**
- "Generate release notes"
- "Create changelog from commits"
- "Set up automated changelogs"
- "Format version history"

---

## 🐛 Debugging & Troubleshooting

### Systematic Debugging
**Use:** `developer-essentials:debugging-strategies`
**Examples:**
- "Help me debug this error"
- "Find the root cause"
- "Investigate performance issue"
- "Profile this code"

### Error Handling
**Use:** `developer-essentials:error-handling-patterns`
**Examples:**
- "Implement proper error handling"
- "Add graceful degradation"
- "Design error propagation"
- "Handle edge cases"

---

## 🔄 Migrations & Modernization

### React Modernization
**Use:** `framework-migration:react-modernization`
**Examples:**
- "Migrate class components to hooks"
- "Update to latest React version"
- "Add concurrent features"
- "Modernize React codebase"

### Dependency Upgrades
**Use:** `framework-migration:dependency-upgrade`
**Examples:**
- "Upgrade Expo version"
- "Update major dependencies"
- "Handle breaking changes"
- "Staged dependency rollout"

---

## 🚀 DevOps & Deployment

### Incident Response
**Use:** `incident-response:postmortem-writing`
**Examples:**
- "Write a postmortem"
- "Document incident timeline"
- "Create action items"
- "Blameless retrospective"

### Runbooks
**Use:** `incident-response:incident-runbook-templates`
**Examples:**
- "Create deployment runbook"
- "Document recovery procedures"
- "Write escalation guide"
- "Build incident playbook"

---

## 📊 Git & Version Control

### Advanced Git
**Use:** `developer-essentials:git-advanced-workflows`
**Examples:**
- "Rebase feature branch"
- "Fix merge conflicts"
- "Recover deleted commits"
- "Clean up git history"

### Code Review
**Use:** `developer-essentials:code-review-excellence`
**Examples:**
- "Review this pull request"
- "Provide constructive feedback"
- "Establish review standards"
- "Mentor on code quality"

---

## 🎓 JavaScript/TypeScript Specific

### Modern JavaScript
**Use:** `javascript-typescript:modern-javascript-patterns`
**Examples:**
- "Refactor to ES6+"
- "Use async/await properly"
- "Implement functional patterns"
- "Optimize JavaScript code"

### TypeScript Advanced Types
**Use:** `javascript-typescript:typescript-advanced-types`
**Examples:**
- "Create complex types"
- "Use conditional types"
- "Implement generics"
- "Build type utilities"

### Node.js Backend
**Use:** `javascript-typescript:nodejs-backend-patterns`
**Examples:**
- "Build Express API"
- "Implement middleware"
- "Add authentication"
- "Structure Node.js app"

---

## 🎨 Monorepo Management

### Turborepo
**Use:** `developer-essentials:turborepo-caching`
**Examples:**
- "Set up Turborepo"
- "Configure build caching"
- "Optimize monorepo builds"
- "Add remote caching"

### Nx Workspace
**Use:** `developer-essentials:nx-workspace-patterns`
**Examples:**
- "Configure Nx monorepo"
- "Set up project boundaries"
- "Optimize affected commands"
- "Manage workspace dependencies"

### General Monorepo
**Use:** `developer-essentials:monorepo-management`
**Examples:**
- "Set up monorepo structure"
- "Manage shared dependencies"
- "Configure workspace tools"
- "Optimize build pipeline"

---

## 📋 HR & Legal

### Employment Documents
**Use:** `hr-legal-compliance:employment-contract-templates`
**Examples:**
- "Create employment contract"
- "Draft offer letter"
- "Write HR policies"
- "Employee handbook template"

---

## 🎯 Special Skills

### Keybindings
**Use:** `/keybindings-help`
**Examples:**
- "Customize keyboard shortcuts"
- "Change submit key"
- "Add chord bindings"
- "Rebind ctrl+s"

---

## 💡 Quick Decision Tree

```
Are you building UI/mobile?
  ├─ Yes → frontend-mobile-development or frontend-design
  └─ No ↓

Is it about security?
  ├─ Yes → security-scanning or auth-implementation-patterns
  └─ No ↓

Is it database-related?
  ├─ Yes → database-design, sql-migrations, or sql-optimization
  └─ No ↓

Is it AI/LLM features?
  ├─ Yes → llm-application-dev skills
  └─ No ↓

Is it backend/API?
  ├─ Yes → backend-development or api-scaffolding
  └─ No ↓

Is it testing?
  ├─ Yes → testing-patterns or e2e-testing-patterns
  └─ No ↓

Is it documentation?
  ├─ Yes → documentation-generation skills
  └─ No ↓

Is it debugging?
  ├─ Yes → debugging-strategies or error-handling-patterns
  └─ No ↓

Is it a migration?
  ├─ Yes → framework-migration skills
  └─ No ↓

General development → developer-essentials
```

---

## 🚨 For This Project Specifically

Based on the Psychedelic Integration App context:

### Common Tasks

**"Improve AI conversation quality"**
→ `llm-application-dev:prompt-engineering-patterns`

**"Add new React Native screen"**
→ `frontend-mobile-development:react-native-architecture`

**"Fix Supabase schema issue"**
→ `database-design:postgresql`

**"Security audit for user data"**
→ `security-scanning:security-sast` + `hr-legal-compliance:gdpr-data-handling`

**"Optimize Claude API calls"**
→ `llm-application-dev:prompt-engineering-patterns`

**"Add authentication feature"**
→ `developer-essentials:auth-implementation-patterns`

**"Design new feature UI"**
→ `frontend-design:frontend-design`

**"Write technical decision document"**
→ `documentation-generation:architecture-decision-records`

**"Debug app crash"**
→ `developer-essentials:debugging-strategies`

**"Improve state management"**
→ `frontend-mobile-development:react-state-management`

---

## 📝 Notes

- You can use skills without typing the full name: `/commit`, `/review-pr`, etc.
- Skills are context-aware and know about your project
- Some tasks may need multiple skills used in sequence
- When in doubt, ask Claude which skill to use!

---

**Last Updated:** 2026-02-08
**Related:** CLAUDE.md, context/QUICK_START.md
