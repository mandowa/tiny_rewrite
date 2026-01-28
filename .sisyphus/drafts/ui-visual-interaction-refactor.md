# Draft: UI / Visual / Interaction Refactor (writing-suggestion-app)

## Requirements (confirmed)
- Produce an implementation plan to refactor UI/visual/interaction design for the existing web frontend.
- Plan must include concrete tasks for: design tokens, typography scale, spacing, component variants, RWD breakpoints.
- Plan must include verification steps (consistency + RWD).
- Must tailor to existing stack/patterns found in repo.
- Must propose a minimal-dependency approach.
- Must not modify any files; read-only analysis only.

## Technical Decisions (tentative)
- Likely approach: plain CSS (CSS variables tokens) + vanilla JS interactions; avoid adding build tooling unless user asks.

## Research Findings (repo)
- Frontend appears to be static HTML + plain CSS + vanilla JS:
  - `index.html` includes `styles.css`, `config.js`, `app.js`.
  - `styles.css` comment: "intentionally plain CSS (no build step)."
- Design tokens already exist as CSS variables in `styles.css` under `:root`:
  - Fonts: `--font-sans`, `--font-mono`
  - Colors: `--bg-0`, `--bg-1`, `--card`, `--border`, `--text`, `--accent`, etc.
  - Radius: `--radius-lg/md/sm`
  - Focus ring token: `--focus`
- Responsive rules currently minimal:
  - Single breakpoint: `@media (max-width: 768px)` in `styles.css`.
- Potential mismatch / duplication detected:
  - `index.html` uses classes like `.container`, `.header`, `.btn-primary`, `.select-control`, `.style-chip`, `.card`.
  - `styles.css` defines classes like `.app-container`, `.app-header`, `.primary-btn`, `.result-card`, `.icon-btn`, etc.
  - This may indicate (a) HTML/CSS drift, (b) in-progress rename, or (c) alternate designs.
- `styles-new.css` exists but is effectively empty (1 blank line).
- Interaction states in JS rely on CSS classes:
  - `app.js` toggles `.hidden`, `.copied`, `.playing` and sets `card.style.display` for selected styles.

## Open Questions
- Clarify whether resolving the HTML/CSS class mismatch is IN scope for the design refactor.
- Confirm the desired design direction (keep current "Linguistic Flow" vibe vs new direction).
- Confirm target breakpoints/devices and accessibility requirements.
- Confirm whether we can change markup/classes (still minimal deps) or must remain CSS-only.

## Scope Boundaries (draft)
- INCLUDE: Token system refinement, typography/spacing scale, component variants & states, responsive strategy, interaction affordances and motion guidance.
- EXCLUDE: Adding heavy frameworks/build steps unless explicitly approved.
