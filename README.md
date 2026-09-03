# WriteSpace

WriteSpace is a responsive, local-first writing SPA for registering a local account, publishing plain-text stories, reading community posts, and demonstrating simple administrative controls. It is built with React, Vite, React Router, and Tailwind CSS.

**No backend, API, database, server-side authentication service, or remote data store is included.** All application data remains in the current browser's `localStorage`.

## Features

- NolanAI-inspired cinematic visual system with self-hosted Lexend Deca, charcoal surfaces, restrained electric-blue actions, and accessible light/dark themes
- Persistent sun/moon theme control in public and authenticated navigation, applied before React renders to avoid a theme flash
- Public landing page with an asymmetric image-led hero and recent-story previews
- Local account registration and sign-in
- Protected story list, reader, and create/edit/delete workflow
- Optional cover and gallery authoring using 10 bundled, attributed free images or validated uploads up to 500 KB each
- Lazy cover/gallery rendering, safe placeholders, and compatibility with legacy posts that have no image fields
- Exactly three fixed-date sample posts on a genuinely empty first run, without reseeding after deletion or overwriting upgraded installs
- Owner and Admin post-management checks
- Demo Admin dashboard and local user management
- Responsive pill navigation, mobile workflow surfaces, and computed-style browser coverage across both themes

The bundled image catalogue is documented in `frontend/public/images/free/LICENSE.md`. The bundled Lexend Deca font provenance and SIL Open Font License reference are documented in `frontend/public/fonts/LICENSE.md`. No remote image or font service is used at runtime.

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Public landing page and latest-story previews | Public |
| `/login` | Local account login | Public |
| `/register` | Local account registration | Public |
| `/blogs` | Authenticated story list | Signed-in user |
| `/blog/:id` | Authenticated story reader | Signed-in user |
| `/write` | Create a story | Signed-in user |
| `/edit/:id` | Edit or delete an owned story | Owner or Admin |
| `/admin` | Administration dashboard | Admin only |
| `/users` | Local user management | Admin only |

Unknown routes redirect to `/`.

## Local development

All commands use direct Node entry points so they work where package-manager bin links are unavailable.

```sh
cd frontend
node node_modules/vite/bin/vite.js
```

The dev server prints its local URL. To create a production static bundle:

```sh
cd frontend
node node_modules/vite/bin/vite.js build
```

## Tests

Run the complete Vitest suite:

```sh
cd frontend
node node_modules/vitest/vitest.mjs run
```

Run the cross-feature integration flow only:

```sh
cd frontend
node node_modules/vitest/vitest.mjs run src/integration/AppFlow.test.jsx
```

Install the Playwright browser once, then run all browser E2E specifications. The Playwright configuration starts a local Vite server at `127.0.0.1:4173` with one worker:

```sh
cd frontend
node node_modules/@playwright/test/cli.js install chromium
node node_modules/@playwright/test/cli.js test --config playwright.config.js
```

The E2E suite covers authentication, CRUD, administration, dark surfaces, theme persistence, image authoring/rendering, first-run seeding, visual-reference computed styles, responsive navigation, and browser console errors. Human-review screenshots are written under `frontend/test-results/` and are intentionally ignored by Git.

## Browser-local storage schemas

WriteSpace stores JSON arrays, objects, and flags under these keys:

- `writespace_users`: array of local account records: `{ id, displayName, username, password, role, createdAt? }`.
- `writespace_session`: current public session: `{ userId, username, displayName, role }`; it intentionally omits the password.
- `writespace_posts`: array of stories: `{ id, title, content, coverImage, gallery, authorId, authorName, authorRole, createdAt }`. `coverImage` is an optional local path or data URL; `gallery` is an optional array of local paths/data URLs. Missing fields remain valid for legacy records.
- `writespace_theme`: `light` or `dark`; missing, invalid, or unreadable values safely resolve to light.
- `writespace_seeded`: string flag `true` after first-run initialization is evaluated.

Uploaded images are converted to base64 data URLs and each file is rejected above 500 KB. Browser localStorage has a small implementation-dependent quota, so many uploads can exhaust it; save failures remain visible and do not silently discard existing values.

Clearing site data, using a different browser profile, or using another device removes or separates this local data. There is no synchronization, backup, migration, or account recovery.

## Privacy and security limitations

This is a local demonstration application, not a production security system. Registered credentials are stored as **plaintext** in the browser's local storage. Authorization is enforced only by client-side route guards and mutation checks, so it is not a security boundary and must not be trusted for real users or sensitive content. Do not use real passwords or private material.

A local demo administrator is available with username `admin` and password `admin`. This account is for demonstration only.

## Vercel SPA routing

`vercel.json` contains exactly one rewrite: requests matching `/(.*)` are served `/index.html`. Vercel therefore returns the SPA entry document for direct visits and refreshes on client-side routes such as `/write` or `/blog/:id`; React Router then selects the appropriate page. The rewrite does not add a backend or API.

## License

Private and proprietary. All rights reserved.
