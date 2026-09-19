# Math With Hawra

An Arabic RTL educational quiz platform for teachers and students. Teachers create quizzes (multiple choice + essay), students join via a 6-character share code, and the teacher grades essay answers manually.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/math-hawra run dev` — run the frontend (port 24101, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (RTL, Tajawal font, pink/yellow design)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: bcrypt + express-session (teacher email/password)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (teachers, quizzes, questions, options, submissions, answer_submissions)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/` — generated React Query hooks + custom-fetch (with credentials:include)
- `artifacts/api-server/src/routes/` — Express routes (auth, quizzes, submissions, dashboard)
- `artifacts/math-hawra/src/App.tsx` — entire frontend (single-file SPA, state-based navigation)

## Architecture decisions

- **No true/false question type** — only multiple choice and essay
- **Essay grading** — all essay answers go to "pending" status; teacher grades each answer 0-100
- **Image upload** — base64 strings embedded in JSON (10MB limit set on express.json)
- **Session auth** — express-session with bcrypt, SESSION_SECRET env var
- **Single-file frontend** — App.tsx contains all views inline for simplicity

## Product

- Teacher registers/logs in, creates quizzes with multiple choice + essay questions
- Each quiz gets a 6-character share code; teacher shares via copy/WhatsApp/Telegram
- Students enter their name + code to take the quiz (per-question timer + overall quiz timer)
- Essay answers go to pending; teacher grades them 0-100 in the grading view
- Dashboard shows total quizzes, students, average score, pending count

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after changing any `lib/*` package before checking leaf artifacts
- The `custom-fetch.ts` sets `credentials: "include"` globally for session cookie support
- Express 5 params have type `string | string[]` — always cast with `String(req.params.x)`
- Retry for 401 is disabled in QueryClient to avoid slow loading on unauthenticated pages

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
