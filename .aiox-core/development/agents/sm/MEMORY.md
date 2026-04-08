# Scrum Master Agent Memory (River)

## Active Patterns
<!-- Current, verified patterns used by this agent -->

### Key Patterns
- CommonJS (`require`/`module.exports`), NOT ES Modules
- ES2022, Node.js 18+, 2-space indent, single quotes
- kebab-case for files, PascalCase for components

### Project Structure
- `docs/stories/epics/` — Epic directories with INDEX.md + stories
- `app/(public)/` — Landing Page (Sales)
- `app/(public)/inv/[slug]` — Private Invitation Experience
- `.aiox-core/development/templates/` — Story templates
- `.aiox-core/development/checklists/` — Draft checklists

### Strategic Pivot: Event-as-a-Service (SaaS)
- Core route (`/`) is for platform marketing.
- Client events are encapsulated in `/inv/[slug]`.
- Future state: Dynamic `evento_id` context in all services.

### Git Rules
- NEVER push — delegate to @devops
- Conventional commits: `docs:` for story creation

### Story Conventions
- Story naming: `story-{PREFIX}-{N}-{slug}.md`
- Epic INDEX.md tracks all stories with status
- Stories flow: Draft → Ready → InProgress → InReview → Done

## Promotion Candidates
<!-- Patterns seen across 3+ agents — candidates for CLAUDE.md or .claude/rules/ -->
<!-- Format: - **{pattern}** | Source: {agent} | Detected: {YYYY-MM-DD} -->

## Archived
<!-- Patterns no longer relevant — kept for history -->
<!-- Format: - ~~{pattern}~~ | Archived: {YYYY-MM-DD} | Reason: {reason} -->
