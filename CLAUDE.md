# Maggie Web App — maggie.buntinggpt.com

## Project Overview
Web interface for Maggie, Bunting Magnetics' AI operations assistant. Chat interface for any operational question + analytics dashboard for email processing performance. Connects to existing orchestrator API at 127.0.0.1:8000.

## Tech Stack
- Next.js 14 + Tailwind CSS (no shadcn/ui yet — pure Tailwind)
- Microsoft Entra ID SSO (MSAL.js v3 + @azure/msal-react v2)
- Existing Maggie Orchestrator API (DO NOT REBUILD)
- In-memory DB for dev (PostgreSQL planned for production)
- Netlify (frontend deploy)
- SSE for streaming chat responses

## Architecture Rules
- All orchestrator calls proxied through Next.js API routes (/api/chat)
- Never call orchestrator directly from browser
- TypeScript strict mode, no 'any' types
- React Context + useReducer for state (no Redux)
- Tailwind only (no other CSS frameworks)
- Conversation history in DB, not localStorage
- All API responses include timing metadata
- Rate limit: 30 messages/user/hour

## File Structure
```
src/app/              - Next.js routes (via (authenticated) route group)
src/app/api/          - API routes (chat proxy, analytics, history, settings)
src/components/       - Reusable UI (ChatMessage, Sidebar, ChartPanel, DataTable)
src/lib/              - Utilities (orchestrator client, auth config, db, formatting)
src/hooks/            - Custom hooks (useChat, useAnalytics)
src/types/            - TypeScript interfaces
src/contexts/         - React contexts (AuthContext, ChatContext)
```

## Orchestrator API (DO NOT MODIFY)
- POST /task/execute — send instruction, get task_id
- GET /task/{id}/status — poll status
- GET /task/{id}/result — get completed result
- GET /health — system health
- GET /agents — list available agents
- GET /epicor/catalog — list 17 BAQs
- Base URL: http://127.0.0.1:8000 (internal VPS)

## Roles
- Admin: all access (Robert)
- Management: chat + analytics + history
- Sales: chat + history + feedback
- Operations: chat only

## Build Phases
- Phase 1: Auth + Shell — COMPLETE
- Phase 2: Chat Core — COMPLETE
- Phase 3: Chat Polish (streaming, markdown, agent indicators) — COMPLETE
- Phase 4: Analytics API — COMPLETE
- Phase 5: Analytics UI (charts, filters, export) — COMPLETE
- Phase 6: Email History (table, detail, feedback) — COMPLETE
- Phase 7: Settings (admin config panel) — COMPLETE
- Phase 8: Deploy (Netlify + Caddy + DNS) — PENDING

## Current Phase: 8
