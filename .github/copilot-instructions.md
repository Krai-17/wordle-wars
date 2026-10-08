- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements: Two-person Wordle score tracker; no accounts required.
- [x] Scaffold the Project: React, TypeScript, Vite, npm; Node 20.17-compatible tooling.
- [x] Customize the Project: Attack of Tiles dashboard, result editor, history, stats, themes, shared rooms.
- [x] Install Required Extensions: None required.
- [x] Compile the Project: Production build and strict TypeScript checks pass.
- [x] Create and Run Task: Dev task created; direct Vite launch used after task runner failed.
- [x] Launch the Project: Local Vite preview launched, no debug session requested.
- [x] Ensure Documentation is Complete: README includes setup, scoring, shared storage, GitHub, and hosting.
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.

## Project Conventions

- Keep the league open; do not add Google sign-in or account requirements without asking.
- Use lucide-react for action icons and preserve the lime/pink tile-based design.
- Run `npm test` and `npm run build` after behavior changes.
- Keep scoring in `src/scoring.ts`; test changes using the Node test runner.
- Browser code talks to Supabase RPC functions, never directly to tables.
- Room tokens are edit capabilities. Do not expose them in logs or replace RLS with public table policies.
- Keep changes minimal; never commit, publish, or deploy without explicit user approval.
