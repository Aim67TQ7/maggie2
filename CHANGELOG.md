# Changelog — Maggie Web App

## [1.0.0] — 2026-02-11

### Initial Build (Phases 1-7)

**Auth + Shell (Phase 1)**
- Microsoft Entra ID SSO via MSAL.js v3 / @azure/msal-react v2
- AuthContext with role-based access control (admin/management/sales/operations)
- Protected routes with role gating
- Dark sidebar with navigation, conversation list, user profile
- Login page with Microsoft SSO button

**Chat Core (Phase 2)**
- Chat interface with message input, send/receive flow
- Orchestrator API proxy via Next.js API route (`/api/chat`)
- Conversation CRUD API (`/api/chat/conversations`)
- In-memory conversation + message persistence
- Rate limiting (30 messages/user/hour)

**Chat Polish (Phase 3)**
- SSE streaming responses with chunked delivery
- Markdown rendering via react-markdown + remark-gfm
- Agent activity indicator badges with pulse animation
- Streaming dots animation while waiting
- Code blocks with copy button
- Table rendering in responses
- Auto-scroll on new messages
- Suggestion chips on empty state

**Analytics API (Phase 4)**
- Analytics endpoint with demo data generation (`/api/analytics`)
- Date range filtering (today/7d/30d/90d/custom)
- CSV export endpoint (`/api/analytics/export`)

**Analytics UI (Phase 5)**
- Dashboard with 4 metric cards (volume, response time, automation, upsell)
- Sparkline trend charts per metric
- Period-over-period comparison badges
- Top customers table
- System health panel (orchestrator status, uptime, latency, error rate)
- Escalation reasons breakdown
- Date range selector with active state
- Auto-refresh every 60 seconds
- CSV export button

**Email History (Phase 6)**
- Searchable email processing log via DataTable component
- Expandable detail rows with email metadata and results
- Parts found and upsell suggested badges
- Accuracy feedback buttons (correct/partial/incorrect)
- Pagination
- Confidence score color coding

**Settings (Phase 7)**
- Admin-only settings panel with form controls
- Configurable: poll interval, confidence threshold, max upsell items
- Configurable: inside sales email, oversight mode, auto-acknowledge
- Toggle switches for boolean settings
- Change log with old/new value display
- Save confirmation feedback

### Technical
- Next.js 14 with App Router, TypeScript strict mode
- Tailwind CSS (no component libraries)
- React Context + useReducer for state management
- All API responses include timing metadata
- In-memory DB layer (ready for PostgreSQL swap)
- 25 seeded demo emails for development
