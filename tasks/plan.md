# Implementation Plan: End-to-end invitation creation and editable templates

## Overview
Make every active invitation template editable through the existing Supabase-backed template editor, wire event creation and event CRUD to template selection and rendered pages, add a public home page at `/`, and verify the user journeys in the browser without mutating existing real events.

## Assumptions
- `/` is the public product landing page; `/dashboard` remains the authenticated admin dashboard.
- Demo-template edits belong to `event_templates.demo_data`; customer events belong to `events` and related event tables.
- Keep the existing nine template designs and current Supabase project/data. Do not delete/reset production rows or alter `.env`.
- If RLS/schema changes are necessary, review current policies and add a migration; never weaken policies to make the UI pass.

## Architecture and dependency order
1. Inventory routes, event schema, auth/RLS, forms, template HTML, and test/build tooling.
2. Define shared template data contract and editor capabilities from actual template markers.
3. Finish one vertical slice: select template -> create event -> persist -> edit -> render public invitation.
4. Connect every template's editor fields and images to its own HTML without replacing its visual design.
5. Complete related event CRUD and public home page.
6. Verify with focused tests, typecheck/build/lint, browser flows, and a read-only Supabase audit.

## Task List

### Phase 1: Baseline and contracts
- [ ] Inventory all active templates, field/image markers, current CRUD mutations, event schema and RLS policies.
- [ ] Determine available test tooling and add focused regression coverage for pure create/slug/template mapping behavior.
- [ ] Record a field-to-template mapping/capabilities contract so editor controls cannot silently imply unsupported render fields.

### Phase 2: Event creation and CRUD slice
- [ ] Add active template selection and live preview to `/events/create`.
- [ ] Validate title, slug, couple names, template ID and duplicate slug; persist the correct `template_id` and authenticated owner.
- [ ] Verify created event navigates to its edit workspace and CRUD saves report actual Supabase row changes.

### Phase 3: Template editor and all renderers
- [ ] Load and save template `demo_data` consistently from Supabase; make photo/gallery upload and deletion state safe.
- [ ] Bind all editable text/image/link/gallery fields to each active template HTML while preserving its unique layout.
- [ ] Ensure public event and demo pages receive the right source data and refresh after saves/reopens without stale iframe content.
- [ ] Show template-specific field support clearly; do not allow a field to appear editable when no rendered target exists.

### Phase 4: Public home and finish CRUD
- [ ] Build responsive, accessible public landing page at `/` with product explanation, template previews and create invitation entry point.
- [ ] Audit related CRUD pages for correct table/event scoping, create/update/delete feedback, upload errors, and loading/empty states.

### Phase 5: Verification and review
- [ ] Run focused unit/component tests, typecheck, lint and production build.
- [ ] Use browser inspection to verify home, every template preview/edit mapping, event create/select-template/save/edit, and core CRUD behavior.
- [ ] Verify Supabase schema/RLS/data read-only; use isolated disposable data only for any live write test and clean it up safely.
- [ ] Review changed files for correctness, accessibility, security, scope and regressions; document remaining external/template limitations.

## Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Existing worktree has many user changes | Accidental data/code loss | Preserve dirty files; inspect diffs before touching; never reset or clean. |
| Each HTML template has different markup | Editable fields may save without rendering | Build explicit per-template field/image maps; verify in browser. |
| Supabase auth/RLS can silently return zero updated rows | UI reports false success | Check returned rows and surface policy errors; retain least-privilege policies. |
| Real event data is personal | Verification may alter user data | Use read-only DB checks; only isolated disposable test records if required. |
| HTML embeds third-party scripts | Noisy console/errors unrelated to app | Separate application failures from sandbox/third-party failures; fix app-owned errors. |

## Acceptance criteria
- All active template editor fields are either visibly connected to the corresponding rendered content or explicitly unavailable for that template.
- A new event can be created with an active template, saved to Supabase, reopened for editing and rendered at its public slug.
- Related CRUD operations are scoped to the event and only report success when Supabase confirms the mutation.
- `/` contains a responsive public landing page and does not redirect to the admin dashboard.
- Verification includes tests/build and browser evidence; no real user record is modified for testing.
