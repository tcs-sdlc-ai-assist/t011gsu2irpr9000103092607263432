# Changelog

## 2026-09-03 - Brownfield theme, media, seeding, and visual redesign

### Added

- Persistent light/dark theme state under `writespace_theme`, applied before React renders to avoid a flash of the wrong theme.
- Accessible sun/moon theme controls in public and authenticated navigation.
- Complete dark-mode surfaces for public, story, authoring, administration, and user-management routes.
- A local catalogue of 10 attributed, royalty-free JPEG images under `frontend/public/images/free/`.
- Cover and gallery image pickers plus validated browser uploads capped at 500 KB per file.
- Optional `coverImage` and `gallery` fields on locally stored posts, including create/edit persistence, previews, removal, lazy rendering, and legacy-record compatibility.
- Safe first-run initialization of exactly three fixed-date Admin sample posts, guarded by `writespace_seeded` so reloads and later deletion do not duplicate content.
- Self-hosted Lexend Deca variable font with SIL Open Font License provenance.
- NolanAI-inspired visual foundation adapted to WriteSpace: charcoal dark surfaces, restrained electric-blue actions, sticky translucent pill navigation, image-led landing composition, rounded workflow surfaces, and responsive mobile states.
- Dedicated unit/component and Playwright coverage for visual tokens, computed styles, local font loading, responsive navigation, media workflows, and first-run behavior.

### Changed

- Public landing, story listing, reader, authentication, authoring, dashboard, user-management, and image-control surfaces now share the same light/dark visual system.
- Story cards render covers when present and safe placeholders otherwise; the reader renders linked responsive galleries.
- Admin and user-management controls retain existing permissions and data behavior while adopting accessible rounded controls and consistent focus states.
- README documentation now covers theme behavior, local assets, image storage limits, seed semantics, expanded storage schemas, and browser test setup.
- Code graph refreshed after each committed feature slice and for the final release state.

### Compatibility and migration notes

- No backend, API, database, route, or environment migration is required.
- Existing posts without `coverImage` or `gallery` remain valid and render safely.
- Existing installations with posts are not seeded; the seed flag is set without changing their records.
- Clearing browser storage resets accounts, posts, theme, and seed state. A later genuinely empty first run seeds the three samples once.
- Uploaded images are base64 data URLs in localStorage. Browser quota is implementation-dependent; many uploads can exhaust it. Save failures remain visible.
- Registered passwords remain plaintext in browser localStorage because this is a demonstration SPA, not a production authentication system.

### Breaking changes

- None to public routes or stored legacy records.
- The approved visual palette replaces the predecessor’s painted Slate backgrounds with charcoal (`#191b1f` / `#222429`) and translucent white hairlines while retaining required semantic class contracts.