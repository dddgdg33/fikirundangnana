# Task List: Invitation platform completion

## Phase 1: Baseline and contracts
- [x] Audit active templates, field/image markers, event schema, RLS and CRUD mutations.
- [x] Identify test runner; add focused regression tests for slug/template mapping.
- [x] Define template capability contract from actual render targets.

## Phase 2: Event create and CRUD
- [x] Add template choice and preview to `/events/create`.
- [x] Validate and persist event/template/admin access safely; handle duplicate slug and errors.
- [ ] Verify edit workspace and CRUD row-confirmation behavior.

## Phase 3: Template editing and rendering
- [x] Harden template `demo_data` and Storage save/load flows.
- [ ] Connect every editable text, image, link, gallery and media field in all nine templates.
- [ ] Refresh public/demo previews reliably after save and verify every mapping in the browser.
- [x] Align editor controls with actual render capabilities; unsupported inputs are hidden.

## Phase 4: Public home and CRUD polish
- [x] Build accessible responsive public landing page at `/`.
- [x] Review related event CRUD, loading/error/empty states and event scoping.

## Phase 5: Verification
- [x] Tests, typecheck and build pass; lint completes with warnings that are being reviewed.
- [ ] Browser-verify home, templates, create/select/save/edit and core CRUD flows without changing real records.
- [x] Read-only Supabase/RLS audit; final code review remains.
