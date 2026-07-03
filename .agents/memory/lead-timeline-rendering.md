---
name: Lead timeline rendering traps
description: Which component actually renders the lead timeline, and how doc entry deleted-state must be derived
---

# Lead timeline rendering traps

## Two lookalike timeline components exist
`lead-detail-sheet.tsx` contains both `ActivityLog` (dead code, never rendered) and `TimelineTab` (the component `LeadDetailSheet` actually renders for the Timeline tab). They have nearly identical structure.

**Why:** New activity-type rendering was once added to `ActivityLog` by mistake and silently never appeared in the UI — activities fell through to the "created this lead" fallback.

**How to apply:** Any new timeline activity branch must go in `TimelineTab`. Consider deleting `ActivityLog` if touching this file again.

## Deleted-state for doc timeline entries must come from the activities feed
Document timeline entries (`document_uploaded`/`document_deleted`, JSON payload `{docId, fileName, fileUrl, stage}` in `newValue` — the activities table has no metadata column) derive "deleted" state from the activities list itself (a later `document_deleted` with the same docId), NOT from a separate live-documents query.

**Why:** A separate react-query documents fetch showed stale enabled View/Download buttons after delete despite invalidation (cache-coherence across tab mount/unmount). Deriving from the same feed that renders the entries is always consistent; an E2E test caught the stale-cache version failing.

**How to apply:** Prefer deriving UI state from the single data source already being rendered over cross-query cache invalidation when both reflect the same event.
