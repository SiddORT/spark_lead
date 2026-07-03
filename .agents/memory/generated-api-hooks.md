---
name: Generated API hook call signatures
description: Trap with orval-generated react-query hooks in lib/api-client-react — extra arguments are silently ignored
---

The generated hooks (e.g. `useGetLeads`) take a **single** `options?: { query?, request? }` argument.

**Why:** Some older call sites passed options as a *second* argument (`useGetLeads(undefined, { query: {...} })`). TypeScript flags this when the file is open in LSP, but at runtime the options were **silently ignored** — e.g. `refetchInterval` polling never actually ran.

**How to apply:** When "fixing" such a call, do NOT just move the options into the first argument — that *activates* previously-dead behavior (polling, refetch-on-focus → extra API calls) and is a functional change. For UI-only tasks, preserve runtime parity by calling the hook with no options; only enable query options as an explicit, approved product change. Also note: project-wide `tsc --noEmit` is broken (composite tsconfig), so these errors only surface via per-file LSP diagnostics.
